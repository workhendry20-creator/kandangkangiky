-- ==========================================
-- KANDANG KANG IKY - SUPABASE DATABASE SCHEMA
-- ==========================================

-- 1. TABEL SHEEP
CREATE TABLE IF NOT EXISTS public.sheep (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    breed VARCHAR(50) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Jantan', 'Betina')),
    initial_weight NUMERIC(5,2) NOT NULL,
    target_weight NUMERIC(5,2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Penitipan' CHECK (status IN ('Penitipan', 'Selesai/Terkirim', 'Terjual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheep_tracking_code ON public.sheep(tracking_code);

-- 2. TABEL PROGRESS_LOGS
CREATE TABLE IF NOT EXISTS public.progress_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sheep_id UUID REFERENCES public.sheep(id) ON DELETE CASCADE,
    update_type VARCHAR(15) CHECK (update_type IN ('Harian', 'Mingguan', 'Bulanan')),
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_weight NUMERIC(5,2) NOT NULL,
    health_status VARCHAR(50) DEFAULT 'Sehat',
    notes TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_logs_sheep_id ON public.progress_logs(sheep_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.sheep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Public can read sheep and progress logs (for public tracking by token/code)
CREATE POLICY "Allow public read access on sheep"
    ON public.sheep FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on sheep"
    ON public.sheep FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sheep"
    ON public.sheep FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete on sheep"
    ON public.sheep FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Allow public read access on progress_logs"
    ON public.progress_logs FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on progress_logs"
    ON public.progress_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on progress_logs"
    ON public.progress_logs FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete on progress_logs"
    ON public.progress_logs FOR DELETE
    TO authenticated
    USING (true);

-- 4. STORAGE BUCKET CONFIGURATION (sheep-media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sheep-media', 'sheep-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read sheep-media"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'sheep-media');

CREATE POLICY "Authenticated upload sheep-media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'sheep-media');
