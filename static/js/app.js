// Frontend JavaScript - Gestão de Documentos

const API_BASE = '/api';

// Utilidades

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getBadgeClass(fileType) {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return 'file-badge file-badge--pdf';
    return 'file-badge file-badge--jpg';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast--exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Listagem de documentos

async function loadDocuments() {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('documents-grid');

    try {
        const response = await fetch(`${API_BASE}/documents`);
        const documents = await response.json();

        loading.style.display = 'none';

        if (!documents.length) {
            emptyState.style.display = 'flex';
            return;
        }

        grid.innerHTML = documents.map(doc => `
            <div class="doc-card" onclick="window.location.href='/document/${doc.id}'">
                <div class="doc-card__header">
                    <span class="${getBadgeClass(doc.file_type)}">${doc.file_type.toUpperCase()}</span>
                    <h3 class="doc-card__title">${escapeHtml(doc.title)}</h3>
                </div>
                ${doc.description ? `<p class="doc-card__description">${escapeHtml(doc.description)}</p>` : ''}
                <div class="doc-card__footer">
                    <span class="doc-card__date">${formatDateShort(doc.created_at)}</span>
                    <div class="doc-card__actions">
                        <a href="${doc.file_url}" target="_blank" class="btn doc-card__action btn--secondary" onclick="event.stopPropagation()">Visualizar</a>
                        <a href="/api/documents/${doc.id}/download" class="btn doc-card__action btn--primary" onclick="event.stopPropagation()">Download</a>
                    </div>
                </div>
                <div class="doc-card__hint">
                    <span>Ver detalhes</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            </div>
        `).join('');

        grid.style.display = 'grid';
    } catch (error) {
        loading.style.display = 'none';
        showToast('Erro ao carregar documentos', 'error');
        console.error('Erro:', error);
    }
}

// Upload de documentos

function setupUploadForm() {
    const form = document.getElementById('upload-form');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');

    let selectedFile = null;

    // Clique na drop zone abre o seletor de arquivos
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.add('drop-zone--active');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drop-zone--active');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            selectedFile = files[0];
            showFilePreview(selectedFile);
        }
    });

    // Seletor de arquivos
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            selectedFile = fileInput.files[0];
            showFilePreview(selectedFile);
        }
    });

    // Remover arquivo
    document.getElementById('remove-file').addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        filePreview.style.display = 'none';
        dropZone.style.display = 'flex';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            showToast('Selecione um arquivo', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitText.textContent = 'Enviando...';

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);

        try {
            const response = await fetch(`${API_BASE}/documents`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Documento enviado com sucesso!', 'success');
                setTimeout(() => window.location.href = '/', 1000);
            } else {
                showToast(data.error || 'Erro ao enviar documento', 'error');
                submitBtn.disabled = false;
                submitText.textContent = 'Enviar Documento';
            }
        } catch (error) {
            showToast('Erro ao enviar documento', 'error');
            submitBtn.disabled = false;
            submitText.textContent = 'Enviar Documento';
            console.error('Erro:', error);
        }
    });
}

function showFilePreview(file) {
    const dropZone = document.getElementById('drop-zone');
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileIcon = document.getElementById('file-icon');

    const ext = file.name.split('.').pop().toUpperCase();
    fileIcon.textContent = ext;
    fileIcon.className = getBadgeClass(ext.toLowerCase());
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    dropZone.style.display = 'none';
    preview.style.display = 'flex';
}

// Detalhes do documento

async function loadDocument(docId) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('document-content');

    try {
        const response = await fetch(`${API_BASE}/documents/${docId}`);

        if (!response.ok) {
            loading.style.display = 'none';
            showToast('Documento não encontrado', 'error');
            setTimeout(() => window.location.href = '/', 1500);
            return;
        }

        const doc = await response.json();

        document.getElementById('doc-title').textContent = doc.title;
        document.getElementById('doc-filename').textContent = doc.file_name;
        document.getElementById('doc-date').textContent = `Enviado em ${formatDate(doc.created_at)}`;
        document.getElementById('doc-description').textContent = doc.description || 'Sem descrição';

        const badge = document.getElementById('doc-badge');
        badge.textContent = doc.file_type.toUpperCase();
        badge.className = getBadgeClass(doc.file_type);

        document.getElementById('doc-view').href = doc.file_url;
        document.getElementById('doc-download').href = `/api/documents/${docId}/download`;
        document.getElementById('doc-download').setAttribute('download', doc.file_name);

        // Preview de imagem (se for JPG/PNG)
        if (['jpg', 'jpeg', 'png'].includes(doc.file_type.toLowerCase())) {
            const previewSection = document.getElementById('doc-preview');
            const previewImg = document.getElementById('doc-preview-img');
            previewImg.src = doc.file_url;
            previewImg.alt = doc.title;
            previewSection.style.display = 'flex';
        }

        document.getElementById('doc-delete').addEventListener('click', () => deleteDocument(docId));

        loading.style.display = 'none';
        content.style.display = 'block';

        loadComments(docId);
        setupCommentForm(docId);

    } catch (error) {
        loading.style.display = 'none';
        showToast('Erro ao carregar documento', 'error');
        console.error('Erro:', error);
    }
}

async function loadComments(docId) {
    const list = document.getElementById('comments-list');
    const count = document.getElementById('comments-count');

    try {
        const response = await fetch(`${API_BASE}/documents/${docId}/comments`);
        const comments = await response.json();

        count.textContent = comments.length;

        if (!comments.length) {
            list.innerHTML = '<div class="comments-empty"><p>Nenhum comentário ainda. Seja o primeiro a comentar!</p></div>';
            return;
        }

        list.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <p class="comment-item__content">${escapeHtml(comment.content)}</p>
                <span class="comment-item__date">${formatDate(comment.created_at)}</span>
            </div>
        `).join('');

    } catch (error) {
        showToast('Erro ao carregar comentários', 'error');
        console.error('Erro:', error);
    }
}

function setupCommentForm(docId) {
    const form = document.getElementById('comment-form');
    const input = document.getElementById('comment-input');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = input.value.trim();
        if (!content) {
            showToast('Escreva um comentário', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/documents/${docId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                input.value = '';
                showToast('Comentário adicionado!', 'success');
                loadComments(docId);
            } else {
                const data = await response.json();
                showToast(data.error || 'Erro ao adicionar comentário', 'error');
            }
        } catch (error) {
            showToast('Erro ao adicionar comentário', 'error');
            console.error('Erro:', error);
        } finally {
            submitBtn.disabled = false;
        }
    });
}

async function deleteDocument(docId) {
    if (!confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/documents/${docId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Documento excluído com sucesso!', 'success');
            setTimeout(() => window.location.href = '/', 1000);
        } else {
            showToast('Erro ao excluir documento', 'error');
        }
    } catch (error) {
        showToast('Erro ao excluir documento', 'error');
        console.error('Erro:', error);
    }
}

// Roteamento por página

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    switch (page) {
        case 'index':
            loadDocuments();
            break;
        case 'upload':
            setupUploadForm();
            break;
        case 'document':
            if (typeof DOCUMENT_ID !== 'undefined') {
                loadDocument(DOCUMENT_ID);
            }
            break;
    }
});
