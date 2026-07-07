import asyncio
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Instanciação do app FastAPI principal para ASGI no Vercel
app = FastAPI(
    title="Master Varejo - FastAPI Backend",
    description="Backend Python robusto e escalável para deployment no Vercel usando Python Serverless",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configuração de CORS para permitir acesso fluído de frontends React/Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
async def read_root():
    """
    Retorna o status geral da API e as informações do runtime.
    """
    return {
        "status": "online",
        "message": "Bem-vindo ao Backend Python da Master Varejo no Vercel!",
        "framework": "FastAPI",
        "runtime": "Python (Vercel Beta)",
        "endpoints_exemplos": {
            "root": "/api",
            "detalhe_item": "/api/items/42?q=analise_giro",
            "streaming_assincrono": "/api/stream",
            "funcao_independente_hello": "/api/hello",
            "documentacao_interativa": "/api/docs"
        }
    }

@app.get("/api/items/{item_id}")
async def read_item(item_id: int, q: str = Query(None, description="Query de busca ou filtro do item")):
    """
    Endpoint demonstrativo de processamento de parâmetros de rota e de consulta (query parameters).
    """
    # Validação simples para demonstração
    if item_id <= 0:
        raise HTTPException(status_code=400, detail="O ID do item deve ser um número inteiro positivo maior que zero.")
        
    return {
        "item_id": item_id,
        "query": q,
        "details": f"Item {item_id} processado com sucesso pelo processador serverless de varejo.",
        "status_calculado": "Estável" if item_id % 2 == 0 else "Crítico"
    }

# Exemplo de streaming de resposta HTTP assíncrona usando async generators
async def simulador_stream_analitico():
    """
    Gerador assíncrono que simula o streaming de um processamento de auditoria em lotes.
    Envia eventos fragmentados linha por linha simulando processamento pesado.
    """
    etapas = [
        "Iniciando auditoria consolidada da rede...",
        "Carregando dados imobilizados das lojas SP/SC/MG...",
        "Cruzando dados operacionais com relatórios de Quebras e Perdas...",
        "Calculando criticidades de giros superiores a 90 dias...",
        "Consolidando relatório final para envio à diretoria..."
    ]
    
    for idx, etapa in enumerate(etapas, start=1):
        # Simula processamento assíncrono sem travar a thread principal
        await asyncio.sleep(1)
        yield f"data: {{\"etapa\": {idx}, \"status\": \"processando\", \"descricao\": \"{etapa}\", \"progresso\": {idx * 20}}}\n\n"
        
    await asyncio.sleep(0.5)
    yield "data: {\"status\": \"concluido\", \"progresso\": 100, \"mensagem\": \"Processamento concluído com sucesso!\"}\n\n"

@app.get("/api/stream")
async def stream_auditoria():
    """
    Endpoint que demonstra streaming assíncrono de dados em tempo real para o cliente (Server-Sent Events).
    Excelente para respostas de IA por partes, relatórios pesados ou progresso de exportações.
    """
    return StreamingResponse(simulador_stream_analitico(), media_type="text/event-stream")
