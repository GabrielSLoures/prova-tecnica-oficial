# 📄 DocManager - Gestão de Documentos

Sistema web para gestão de documentos com upload de arquivos e histórico de comentários.

## 🚀 Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Backend** | Python 3 + Flask |
| **Banco de Dados** | Supabase (PostgreSQL) |
| **Armazenamento** | Supabase Storage |
| **Deploy** | Render.com |

## ✨ Funcionalidades

- **Upload de Documentos**: Envio de arquivos PDF, JPG e PNG com título e descrição opcional
- **Listagem de Documentos**: Visualização de todos os documentos com título, data e ações
- **Visualização/Download**: Abrir ou baixar documentos diretamente
- **Comentários**: Histórico de comentários por documento com data e hora
- **Exclusão**: Remoção de documentos e comentários associados
- **Drag & Drop**: Upload por arrastar e soltar
- **Design Responsivo**: Interface adaptável para mobile e desktop

## 📋 Pré-requisitos

- Python 3.8+
- Conta no [Supabase](https://supabase.com)
- Git

## 🔧 Configuração do Supabase

### 1. Criar projeto no Supabase
Acesse [supabase.com](https://supabase.com), crie uma conta e um novo projeto.

### 2. Criar tabelas
No **SQL Editor** do Supabase, execute o conteúdo do arquivo `setup.sql` deste projeto.

### 3. Criar bucket de Storage
1. Vá em **Storage** no painel do Supabase
2. Clique em **New bucket**
3. Nome: `documents`
4. Marque como **Public bucket**
5. Clique em **Create bucket**

### 4. Obter credenciais
1. Vá em **Settings** → **API**
2. Copie a **Project URL** e a **anon public key**

## 🏃 Execução Local

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd ProvaParaEstagio
```

### 2. Criar ambiente virtual
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

### 3. Instalar dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do Supabase:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-anon-key-aqui
```

### 5. Executar a aplicação

```bash
flask run --port 5001
```

Acesse: [http://localhost:5001](http://localhost:5001)

## 🌐 Deploy (Render.com)

1. Faça push do código para o GitHub
2. Acesse [render.com](https://render.com) e crie um **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Adicione as variáveis de ambiente (`SUPABASE_URL` e `SUPABASE_KEY`)
6. Deploy!

## 📁 Estrutura do Projeto

```
ProvaParaEstagio/
├── app.py                  # Backend Flask (rotas da API)
├── requirements.txt        # Dependências Python
├── setup.sql               # Script de criação das tabelas
├── Procfile                # Configuração para deploy
├── .env.example            # Template de variáveis de ambiente
├── .gitignore              # Arquivos ignorados pelo Git
├── README.md               # Este arquivo
├── static/
│   ├── css/
│   │   └── style.css       # Estilos da aplicação
│   └── js/
│       └── app.js          # Lógica do frontend
└── templates/
    ├── base.html            # Template base (layout)
    ├── index.html           # Listagem de documentos
    ├── upload.html          # Formulário de upload
    └── document.html        # Detalhes e comentários
```

## ⚠️ Observações e Limitações

- **Sem autenticação**: Conforme especificado, não há controle de acesso
- **Tamanho máximo**: Arquivos de até 16MB
- **Formatos aceitos**: PDF, JPG e PNG apenas
- **Banco gratuito**: O plano gratuito do Supabase possui limites de armazenamento (500MB de banco + 1GB de storage)
