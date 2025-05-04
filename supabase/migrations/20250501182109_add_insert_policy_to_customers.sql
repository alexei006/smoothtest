-- Füge eine INSERT-Richtlinie für die Kundentabelle hinzu
CREATE POLICY "Benutzer können ihr eigenes Profil erstellen" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ändere die Kundentabelle, um user_id Spalte zu korrigieren
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_key;
ALTER TABLE public.customers ADD CONSTRAINT customers_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
