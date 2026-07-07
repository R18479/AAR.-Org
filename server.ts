import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import fs from "fs";

// Carrega variáveis de ambiente de .env
dotenv.config();

const app = express();
const PORT = 3000;

// Interface para controle de sessão de upload resumível local
interface LocalUploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  tempPath: string;
  bytesWritten: number;
}

const activeUploads = new Map<string, LocalUploadSession>();

// Inicialização Preguiçosa (Lazy) do cliente Storage
let storageClientInstance: Storage | null = null;

function getStorageClient(): Storage {
  if (!storageClientInstance) {
    storageClientInstance = new Storage();
  }
  return storageClientInstance;
}

// Configuração de limites aumentados para suportar uploads de imagens de alta resolução de câmeras de celular
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Inicialização Preguiçosa (Lazy) do cliente Gemini para evitar crashes se a API Key estiver ausente no arranque
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave de API do Gemini (GEMINI_API_KEY) não está configurada nos segredos do seu painel Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper resiliente para chamadas da API Gemini com política de retentativas (Retry policy)
async function generateContentWithRetry(params: any, retries = 3, delayMs = 1500): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const ai = getGeminiClient();
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const isTransient = 
        error.status === 503 || 
        error.code === 503 || 
        error.status === 429 || 
        error.code === 429 ||
        (error.message && (
          error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("UNAVAILABLE") || 
          error.message.includes("high demand") || 
          error.message.includes("exhausted")
        ));
      
      if (isTransient && attempt < retries) {
        console.warn(`[Gemini Retry] Tentativa ${attempt}/${retries} falhou devido a indisponibilidade ou sobrecarga do modelo. Retentando em ${delayMs}ms... Erro:`, error.message || error);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Backoff exponencial
      } else {
        throw error;
      }
    }
  }
}

// Rota de Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint principal para OCR de fotos de relatórios com a API do Gemini
app.post("/api/ocr", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Nenhuma imagem foi recebida para processamento." });
    }

    // Limpar o prefixo Data URL se houver (ex: "data:image/png;base64,")
    let base64Data = image;
    if (image.includes(";base64,")) {
      base64Data = image.split(";base64,").pop() || "";
    }

    console.log(`[OCR Server] Recebida imagem de mimeType: ${mimeType || "image/png"} para extração...`);

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || "image/png"
          }
        },
        {
          text: `Você é um leitor de OCR de relatórios de varejo (cobertura e giro de estoque) de alta fidelidade.
Analise a imagem enviada (que pode ser uma foto de uma folha impressa de relatório de vendas/estoque tirada com a câmera do celular) e extraia de forma literal e precisa as informações.
Retorne APENAS o texto livre correspondente aos dados identificados na imagem, sem introduções, comentários, explicações adicionais, e SEM utilizar blocos de formatação markdown (como triple backticks).
Se houver informações como Unidade de Loja, Categorias, Dias de Giro ou Capital de Giro, certifique-se de exibi-las claramente para que nossos padrões de expressões regulares no frontend consigam localizá-las de imediato.`
        }
      ]
    });

    const text = response.text || "";
    console.log(`[OCR Server] Extração concluída com sucesso. Tamanho do texto extraído: ${text.length} caracteres.`);
    return res.json({ text });

  } catch (error: any) {
    console.error("[OCR Server Error] Falha ao extrair dados usando Gemini:", error);
    return res.status(500).json({ 
      error: error.message || "Erro de processamento interno durante a extração via IA." 
    });
  }
});

// Endpoint para iniciar o upload resumível local
app.post("/api/local-upload/start", (req, res) => {
  try {
    const { fileName, fileSize, contentType } = req.body;
    if (!fileName || !fileSize) {
      return res.status(400).json({ error: "fileName e fileSize são obrigatórios." });
    }

    const uploadId = `upl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Arquivo temporário exclusivo para este upload
    const tempPath = path.join(uploadsDir, `temp-${uploadId}`);
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    activeUploads.set(uploadId, {
      id: uploadId,
      fileName,
      fileSize: Number(fileSize),
      contentType: contentType || "application/octet-stream",
      tempPath,
      bytesWritten: 0,
    });

    console.log(`[Local Upload] Iniciado: ${fileName} (${fileSize} bytes) | ID: ${uploadId}`);

    return res.json({
      success: true,
      uploadId,
      chunkSize: 256 * 1024 * 4, // 1MB chunks
    });
  } catch (err: any) {
    console.error("[Local Upload Start Error] Falha ao iniciar:", err);
    return res.status(500).json({ error: "Falha ao iniciar upload no servidor." });
  }
});

// Endpoint para receber chunks de arquivos e gravar de forma resumível
app.post("/api/local-upload/chunk", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const uploadId = req.headers["x-upload-id"] as string;
    const chunkIndexStr = req.headers["x-chunk-index"] as string;
    const offsetStr = req.headers["x-offset"] as string;

    if (!uploadId) {
      return res.status(400).json({ error: "x-upload-id é obrigatório." });
    }

    const session = activeUploads.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: "Sessão de upload não encontrada ou expirada." });
    }

    const offset = Number(offsetStr || 0);
    const chunkIndex = Number(chunkIndexStr || 0);
    const chunkBuffer = req.body as Buffer;

    if (!Buffer.isBuffer(chunkBuffer) || chunkBuffer.length === 0) {
      return res.status(400).json({ error: "Dados do chunk vazios ou inválidos." });
    }

    // Tolerância a retries: se o offset enviado já foi gravado, ignore o append e retorne sucesso
    if (offset < session.bytesWritten) {
      return res.json({
        success: true,
        bytesWritten: session.bytesWritten,
        completed: session.bytesWritten >= session.fileSize,
      });
    }

    if (offset !== session.bytesWritten) {
      return res.status(409).json({
        error: "Inconsistência de offset no servidor.",
        expectedOffset: session.bytesWritten,
      });
    }

    // Gravar o chunk
    fs.appendFileSync(session.tempPath, chunkBuffer);
    session.bytesWritten += chunkBuffer.length;

    const isCompleted = session.bytesWritten >= session.fileSize;

    if (isCompleted) {
      const uniqueFileName = `${Date.now()}_${session.fileName}`;
      const uploadsDir = path.join(process.cwd(), "uploads");
      const finalPath = path.join(uploadsDir, uniqueFileName);

      fs.renameSync(session.tempPath, finalPath);
      activeUploads.delete(uploadId);

      const downloadUrl = `/uploads/${uniqueFileName}`;
      console.log(`[Local Upload] Concluido! Salvo em: ${finalPath}. URL de acesso: ${downloadUrl}`);

      return res.json({
        success: true,
        bytesWritten: session.bytesWritten,
        completed: true,
        downloadUrl,
      });
    }

    return res.json({
      success: true,
      bytesWritten: session.bytesWritten,
      completed: false,
    });

  } catch (err: any) {
    console.error("[Local Upload Chunk Error] Falha ao processar chunk:", err);
    return res.status(500).json({ error: "Falha de processamento de chunk no servidor." });
  }
});

// Endpoint para conversação inteligente com o MASTER VAREJO A.I.A
app.post("/api/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Nenhuma mensagem enviada." });
    }

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Você é o "MASTER VAREJO A.I.A" - um analista de varejo 100% autônomo, especialista em dados operacionais, giro de estoque, e redução de quebras e perdas em supermercados.
Foco: dados reais, clareza cirúrgica e planos de ação práticos.

Seus traços de personalidade:
- Fala em português do Brasil.
- Tem tom de assessor experiente, seguro de si, ágil e focado em resultados rápidos.
- Responde em formato altamente escaneável e mobile-first, ideal para leitura rápida em WhatsApp.
- Usa emojis de forma profissional e moderada (🚨, ⚠️, 📈, 📉, 🎯).
- Usa *negrito* frequentemente em números, nomes de filiais e palavras-chave.
- Nunca inventa desculpas ou prolonga justificativas técnicas; vai direto ao ponto de ação.

Aqui está o contexto operacional atual do banco de dados das filiais:
${JSON.stringify(context || {})}

Mensagem do Usuário: ${message}

Responda mantendo a persona de MASTER VAREJO A.I.A, formatando a saída para WhatsApp (curta, legível, marcadores objetivos).`
        }
      ]
    });

    const text = response.text || "";
    return res.json({ text });

  } catch (error: any) {
    console.error("[Chat Server Error] Falha ao processar chat com Gemini:", error);
    return res.status(500).json({ 
      error: error.message || "Erro interno ao processar a resposta do assistente." 
    });
  }
});

// Configuração do Vite Middleware no desenvolvimento ou arquivos estáticos no ambiente de produção
async function setupServer() {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Rodando em modo de Desenvolvimento. Integrando Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Rodando em modo de Produção. Servindo arquivos do diretório /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Backend pronto e escutando na porta ${PORT}`);
  });
}

setupServer();
