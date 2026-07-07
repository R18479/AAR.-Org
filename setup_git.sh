#!/bin/bash
# =============================================================================
# MASTER VAREJO - SCRIPT DE AUTOMATIZAÇÃO GIT (setup_git.sh)
# Powered by MASTER VAREJO A.I.A
# =============================================================================

# Configuração de cores para output elegante
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}🔼 MASTER VAREJO — Powered by AIA Core Engine${NC}"
echo -e "${BLUE}Script de Inicialização e Configuração Git Automática${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# 1. Verificar se o repositório git já foi inicializado
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Repositório Git local já inicializado nesta pasta.${NC}"
else
    echo -e "${YELLOW}🔧 Inicializando Git local...${NC}"
    git init
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Git inicializado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao inicializar o Git. Certifique-se de que o Git está instalado.${NC}"
        exit 1
    fi
fi

# 2. Configurar o arquivo .gitignore se não existir
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}🔧 Arquivo .gitignore não encontrado. Criando padrão...${NC}"
    cat <<EOT > .gitignore
# Node.js
node_modules/
dist/
.env
.env.local
.env.production.local
.env.development.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Python / Virtual Environment
.venv/
venv/
ENV/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt
pip-delete-this-directory.txt
audit_log.csv
EOT
    echo -e "${GREEN}✅ .gitignore criado com sucesso.${NC}"
fi

# 3. Adicionar arquivos para a área de stage
echo -e "${YELLOW}📦 Adicionando arquivos ao Git Stage...${NC}"
git add .
git status -s

# 4. Commit inicial
echo -e "${YELLOW}💾 Realizando commit inicial...${NC}"
git commit -m "feat: commit inicial do Master Varejo com dashboard React, Streamlit e chatbot AIA"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Commit inicial realizado com sucesso!${NC}"
else
    echo -e "${YELLOW}⚠️  Nada para commitar ou commit falhou (talvez os arquivos já estivessem commitados).${NC}"
fi

# 5. Configuração da branch principal para main
echo -e "${YELLOW}🌿 Renomeando branch principal para 'main'...${NC}"
git branch -M main

# 6. Configuração de URL remota do GitHub
echo ""
echo -e "${BLUE}🔗 CONFIGURAÇÃO DO REPOSITÓRIO REMOTO GITHUB${NC}"
echo -e "Por favor, insira a URL do seu repositório remoto do GitHub."
echo -e "Exemplo: ${BLUE}https://github.com/seu-usuario/seu-repositorio.git${NC}"
read -p "URL Remota: " REMOTE_URL

if [ -z "$REMOTE_URL" ]; then
    echo -e "${RED}❌ URL remota não informada. O script será encerrado sem configurar o push remoto.${NC}"
    echo -e "Você poderá configurar manualmente mais tarde usando: ${YELLOW}git remote add origin <URL>${NC}"
    exit 1
fi

# Remover origin antigo se houver
git remote remove origin 2>/dev/null

echo -e "${YELLOW}🔧 Adicionando remoto origin: $REMOTE_URL...${NC}"
git remote add origin "$REMOTE_URL"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Repositório remoto configurado com sucesso!${NC}"
else
    echo -e "${RED}❌ Falha ao adicionar repositório remoto.${NC}"
    exit 1
fi

# 7. Push inicial para o GitHub
echo ""
echo -e "${YELLOW}🚀 Enviando código para o GitHub (branch main)...${NC}"
echo -e "Se for solicitado, insira suas credenciais de acesso ou Token de Acesso Pessoal (PAT)."
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${GREEN}🎉 SUCESSO COMPLETO!${NC}"
    echo -e "Seu projeto Master Varejo foi inicializado, commitado"
    echo -e "e enviado para o seu GitHub!"
    echo -e "${GREEN}======================================================${NC}"
else
    echo -e "${YELLOW}⚠️  O push direto falhou.${NC}"
    echo -e "Isso pode ocorrer caso o repositório remoto não esteja vazio (ex: tenha README ou LICENSE)."
    echo -e "Se for o caso, tente rodar: ${YELLOW}git pull origin main --rebase${NC} e depois ${YELLOW}git push -u origin main${NC}"
fi
