-- ==========================================
-- MarketSpace: Storage Buckets & Policies (#7)
-- ==========================================

-- 1. Create the buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('shop-banners', 'shop-banners', true),
  ('shop-avatars', 'shop-avatars', true),
  ('product-images', 'product-images', true),
  ('ad-images', 'ad-images', true),
  ('payment-qr-codes', 'payment-qr-codes', false) -- Private bucket
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies
-- Allow public read access to all public buckets
CREATE POLICY "Public Read Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id IN ('shop-banners', 'shop-avatars', 'product-images', 'ad-images'));

-- Allow authenticated users to upload files to any bucket
CREATE POLICY "Authenticated Users can Upload" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated Users can Update" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = owner);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated Users can Delete" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (auth.uid() = owner);

-- (Private bucket read access for QR codes is handled by the PHP backend via Signed URLs)
