"""Backend Flask para gestão de documentos."""

import os
import uuid
import httpx
from flask import Flask, render_template, request, jsonify, Response
from supabase import create_client, Client
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BUCKET_NAME = "documents"
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

_supabase_client = None

def get_supabase() -> Client:
    """Inicializa e retorna o cliente Supabase."""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas. "
                "Copie .env.example para .env e preencha com suas credenciais."
            )
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def allowed_file(filename):
    """Verifica se a extensão do arquivo é permitida."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Rotas de páginas

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload')
def upload_page():
    return render_template('upload.html')


@app.route('/document/<doc_id>')
def document_page(doc_id):
    return render_template('document.html', document_id=doc_id)


# Rotas da API

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Lista todos os documentos ordenados por data."""
    try:
        response = get_supabase().table('documents') \
            .select('*') \
            .order('created_at', desc=True) \
            .execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>', methods=['GET'])
def get_document(doc_id):
    """Retorna um documento pelo ID."""
    try:
        response = get_supabase().table('documents') \
            .select('*') \
            .eq('id', doc_id) \
            .single() \
            .execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': 'Documento não encontrado'}), 404


@app.route('/api/documents', methods=['POST'])
def upload_document():
    """Faz upload de um novo documento."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Formato não permitido. Use PDF, JPG ou PNG.'}), 400

        title = request.form.get('title', '').strip()
        if not title:
            return jsonify({'error': 'O título é obrigatório'}), 400

        description = request.form.get('description', '').strip()

        original_filename = secure_filename(file.filename)
        extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_content = file.read()

        # Upload do arquivo para o Supabase Storage
        get_supabase().storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        file_url = get_supabase().storage.from_(BUCKET_NAME).get_public_url(unique_filename)

        doc_data = {
            'title': title,
            'description': description if description else None,
            'file_url': file_url,
            'file_name': original_filename,
            'file_type': extension,
        }

        response = get_supabase().table('documents').insert(doc_data).execute()
        return jsonify(response.data[0]), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>/comments', methods=['GET'])
def get_comments(doc_id):
    """Lista comentários de um documento."""
    try:
        response = get_supabase().table('comments') \
            .select('*') \
            .eq('document_id', doc_id) \
            .order('created_at', desc=False) \
            .execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>/comments', methods=['POST'])
def add_comment(doc_id):
    """Adiciona um comentário a um documento."""
    try:
        data = request.get_json()

        if not data or not data.get('content', '').strip():
            return jsonify({'error': 'O conteúdo do comentário é obrigatório'}), 400

        comment_data = {
            'document_id': doc_id,
            'content': data['content'].strip(),
        }

        response = get_supabase().table('comments').insert(comment_data).execute()
        return jsonify(response.data[0]), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>/download', methods=['GET'])
def download_document(doc_id):
    """Proxy de download para forçar download no navegador."""
    try:
        doc = get_supabase().table('documents') \
            .select('*') \
            .eq('id', doc_id) \
            .single() \
            .execute()

        file_url = doc.data['file_url']
        file_name = doc.data['file_name']
        file_type = doc.data['file_type']

        r = httpx.get(file_url)

        content_types = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png'
        }

        return Response(
            r.content,
            headers={
                'Content-Disposition': f'attachment; filename="{file_name}"',
                'Content-Type': content_types.get(file_type, 'application/octet-stream')
            }
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    """Exclui um documento e seus comentários."""
    try:
        doc = get_supabase().table('documents') \
            .select('*') \
            .eq('id', doc_id) \
            .single() \
            .execute()

        get_supabase().table('comments') \
            .delete() \
            .eq('document_id', doc_id) \
            .execute()

        file_url = doc.data['file_url']
        filename = file_url.split('/')[-1]
        get_supabase().storage.from_(BUCKET_NAME).remove([filename])

        get_supabase().table('documents') \
            .delete() \
            .eq('id', doc_id) \
            .execute()

        return jsonify({'message': 'Documento excluído com sucesso'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
