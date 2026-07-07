from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Cada arquivo na pasta /api pode hospedar sua própria instância de app ASGI independente
app = FastAPI(
    title="Master Varejo - Hello Function",
    description="Função serverless complementar para demonstração de rotas adicionais na Vercel",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/hello")
async def hello_handler():
    """
    Handler independente na pasta /api que demonstra modularidade do ecossistema de funções serverless do Vercel.
    """
    return {
        "status": "online",
        "message": "Olá! Esta resposta vem de um arquivo serverless Python independente: /api/hello.py",
        "doc_info": "Você pode registrar múltiplos arquivos na pasta /api para isolar funcionalidades menores em lambdas separadas."
    }
