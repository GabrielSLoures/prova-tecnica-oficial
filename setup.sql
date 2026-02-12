-- Executar no SQL Editor do Supabase

-- Tabela de documentos
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comentários (vinculada a documentos)
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_document_id ON comments(document_id);

-- Desabilitar RLS (sem autenticação)
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Políticas de Storage (criar bucket "documents" como público antes de rodar)
CREATE POLICY "Permitir upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Permitir leitura" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Permitir exclusão" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents');
