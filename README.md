# 🔼 Master Varejo — Powered by AIA

Aplicativo corporativo de alta performance focado no monitoramento, auditoria e plano de ação rápida sobre giros de estoque parados no setor de varejo. Esta plataforma possui dupla interface integrada: um painel de visualização dinâmica construído em **React + Tailwind** e um painel de operação analítica construído em **Python + Streamlit**.

---

## 🏗️ Visão Geral da Arquitetura

O projeto é estruturado para garantir máxima consistência entre as versões web e mobile, utilizando regras de negócios idênticas para a simulação determinística e extração inteligente de dados via expressões regulares (Regex).

```
├── .env.example          # Exemplo de variáveis de ambiente do ecossistema
├── .gitignore            # Regras de ignorar arquivos para Git (Node & Python)
├── app.py                # Aplicativo analítico em Python (Streamlit)
├── index.html            # Ponto de entrada do SPA em React
├── package.json          # Gerenciamento de dependências Node.js e scripts de desenvolvimento
├── src/                  # Código-fonte da interface web React
│   ├── App.tsx           # Componente principal do painel Bento em React
│   ├── main.tsx          # Ponto de entrada React
│   └── index.css         # Configuração de estilos globais com Tailwind
└── tsconfig.json         # Configuração de tipagem estrita do TypeScript
```

---

## 🚀 Instalação e Execução Local

### 1. Requisitos Prévios
Certifique-se de ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   [Python](https://www.python.org/) (versão 3.9 ou superior)

### 2. Executando o Painel React (Interface Corporativa)
Para rodar a interface rica em React e Tailwind localmente:

```bash
# Instalar dependências de desenvolvimento e frontend
npm install

# Iniciar o servidor de desenvolvimento local
npm run dev
```
A aplicação React estará acessível em `http://localhost:3000`.

### 3. Executando o Painel Streamlit (Interface de Operação Mobile)
Para rodar o aplicativo de auditoria móvel e geração de PDFs:

```bash
# Recomenda-se criar um ambiente virtual (venv)
python -m venv .venv
source .venv/bin/activate  # No Windows use: .venv\Scripts\activate

# Instalar as dependências necessárias
pip install streamlit pandas reportlab

# Iniciar o Streamlit
streamlit run app.py
```
A aplicação Streamlit estará acessível por padrão em `http://localhost:8501`.

---

## 🔍 Inteligência de Parsing (Expressões Regulares)

A plataforma se destaca pela facilidade de uso em dispositivos móveis por meio da área de **Copiar e Colar**. O analista de campo copia dados brutos de qualquer relatório corporativo (unidades, giros e valores imobilizados) e cola diretamente no app. 

As expressões regulares extraem as informações de forma flexível e robusta:
*   **Identificação de Lojas:** Varre o texto normalizando acentuações gráficos (como "SÃO JOSÉ" -> "SAO JOSE" ou "JOÃO DIAS" -> "JOAO DIAS") para ativação automática da unidade correspondente.
*   **Identificação de Categorias:** Varre o texto cruzando com o dicionário de 21 categorias de forma ordenada pelo comprimento do nome, mitigando conflitos de termos semelhantes (por exemplo, selecionando "LATICÍNIOS COMMODITIES" antes de "LATICÍNIOS").
*   **Captura de Giro:** Busca padrões numéricos seguidos por palavras de cobertura (como `91 dias`, `91 d`, `91g`, `91 giro`), com fallbacks numéricos inteligentes.
*   **Captura de Valor:** Processa símbolos monetários e formatação regional brasileira de moeda (ex: `R$ 1.899.003,50`, `RS 1899003` ou `1.899.003`), convertendo o texto em ponto flutuante válido de forma resiliente a erros de digitação.

---

## 🐳 Docker & Deploy Fácil (CI/CD)

Para facilitar o deploy contínuo em ambientes como Google Cloud Run, AWS App Runner ou Render, você pode utilizar containers.

### Exemplo de `Dockerfile` para Streamlit (Produção):
```dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

COPY app.py /app/app.py

RUN pip install --no-cache-dir streamlit pandas reportlab

EXPOSE 8501

HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health

ENTRYPOINT ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

---

## 🛠️ Contribuição e Versionamento (Boas Práticas de Git)

Para garantir integridade durante a colaboração em equipe via GitHub:

1.  **Proteção de Branch Principal:** Mantenha a branch `main` protegida contra commits diretos. Utilize Pull Requests (PRs).
2.  **Rastreabilidade de Alterações:** Desenvolva novos recursos ou correções em branches secundárias baseadas em tarefas:
    *   `feature/melhoria-parsing`
    *   `fix/correcao-geracao-pdf`
3.  **Clean Code:** Mantenha o código modular, limpo, bem documentado em português brasileiro e devidamente identado com **4 espaços** (Python/Streamlit).

---

## 🐍 Backend Python no Vercel (FastAPI Serverless)

Este projeto foi estendido para incluir um backend Python moderno com **FastAPI** pronto para ser implantado no **Vercel Cloud** utilizando o runtime Python (Beta) em conjunto com o frontend React/Vite ou Next.js.

### 📁 Estrutura de Arquivos da API
```
├── api/
│   ├── index.py          # Entrada ASGI principal (FastAPI)
│   └── hello.py          # Função serverless complementar independente
├── vercel.json           # Configuração de rotas e exclusões do Vercel
└── pyproject.toml        # Metadados de projeto, versão Python e dependências
```

### ⚙️ Instalação de Dependências & Ambiente Local

#### 1. Criar e Ativar Ambiente Virtual (venv)
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

#### 2. Instalar Dependências
Você pode instalar via `pip` usando o `requirements.txt` atualizado:
```bash
pip install -r requirements.txt
```

#### 3. Executar o Servidor FastAPI Localmente
Para testar e rodar o backend localmente usando **Uvicorn**:
```bash
uvicorn api.index:app --reload --port 8000
```
O backend estará acessível em `http://localhost:8000/api`.
*   Acesse a documentação interativa Swagger em: `http://localhost:8000/api/docs`

---

### ☁️ Como Fazer Deploy no Vercel

A Vercel gerencia automaticamente o lançamento de funções serverless Python ao detectar a pasta `/api`.

1.  **Instale a CLI da Vercel** (se ainda não possuir):
    ```bash
    npm install -g vercel
    ```
2.  **Inicie o deploy**:
    ```bash
    vercel
    ```
3.  **Deploy em produção**:
    ```bash
    vercel --prod
    ```

---

### 💡 Recomendações Críticas & Boas Práticas (Vercel Python Beta)

#### 1. Controle de Tamanho do Bundle (Limite de 500MB)
As funções serverless da Vercel (AWS Lambda por baixo dos panos) possuem um limite estrito de **500MB descompactado** para o ambiente completo.
*   **Ação**: Configuramos a diretiva `excludeFiles` no arquivo `vercel.json` para evitar que pastas pesadas como `node_modules`, `dist` (build do frontend), `src` e `assets` sejam enviadas no zip do Python.
*   **Configuração aplicada no `vercel.json`**:
    ```json
    "functions": {
      "api/**/*.py": {
        "runtime": "vercel-python@beta",
        "excludeFiles": "{node_modules,dist,assets,src,package-lock.json,tsconfig.json,vite.config.ts}/**"
      }
    }
    ```

#### 2. Configurando Versões do Python e Ponto de Entrada
*   **Versão do Python**: A Vercel determina a versão do Python por meio do arquivo `pyproject.toml` usando a propriedade `requires-python = ">=3.11"`. Você pode especificar a versão desejada (como Python `3.14` ou compatíveis conforme suporte do runtime Vercel).
*   **Ponto de Entrada**: O arquivo `pyproject.toml` inclui a configuração `tool.vercel.entrypoint = "api/index.py"` que instrui formalmente as ferramentas da Vercel sobre onde se localiza o core ASGI.

#### 3. Suporte a Streaming HTTP Assíncrono
O endpoint `/api/stream` exemplifica o uso de `StreamingResponse` com geradores assíncronos (`async gen`). Isso é ideal para transmitir respostas geradas por IA (tokens de LLM) ou atualizações em tempo real linha por linha sem bloquear o servidor serverless.
```python
# Exemplo de streaming de resposta HTTP assíncrona
async def generator():
    yield "data: etapa 1\n\n"
    await asyncio.sleep(1)
    yield "data: etapa 2\n\n"

@app.get("/api/stream")
async def stream():
    return StreamingResponse(generator(), media_type="text/event-stream")
```

#### 4. Múltiplas Funções em `/api`
A estrutura suporta tanto uma API monolítica centralizada (com rewrites do Vercel direcionando tudo para `/api/index.py`) quanto funções serverless isoladas. Por exemplo, criamos o arquivo `api/hello.py` que roda de forma totalmente separada do app principal para demonstrar essa modularidade.

