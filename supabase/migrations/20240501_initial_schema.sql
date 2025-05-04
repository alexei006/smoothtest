-- Erstelle die Tabelle für Kunden
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plz TEXT,
  address TEXT,
  phone TEXT,
  is_premium_member BOOLEAN DEFAULT false,
  newsletter_subscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Produkte (Smoothies und Bowls)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('smoothie', 'bowl')),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Zutaten
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_allergen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Verbindungstabelle zwischen Produkten und Zutaten
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity TEXT,
  UNIQUE (product_id, ingredient_id)
);

-- Erstelle die Tabelle für Warenkörbe
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ordered', 'abandoned')),
  total_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Warenkorb-Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Bestellungen
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  shipping_address TEXT,
  shipping_postal_code TEXT,
  shipping_city TEXT,
  phone_number TEXT,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'paypal')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Bestellpositionen
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Support-Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'in_bearbeitung', 'geschlossen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erstelle die Tabelle für Ticket-Antworten
CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Berechtigungen einrichten
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;

-- Standardberechtigungen für Produkte und Zutaten (öffentlich lesbar)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- Richtlinien für Kunden
CREATE POLICY "Benutzer können nur ihr eigenes Profil lesen" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Benutzer können nur ihr eigenes Profil aktualisieren" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Richtlinien für Warenkörbe
CREATE POLICY "Benutzer können nur ihre eigenen Warenkörbe lesen" ON public.carts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Benutzer können nur ihre eigenen Warenkörbe aktualisieren" ON public.carts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Benutzer können nur ihre eigenen Warenkörbe erstellen" ON public.carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Richtlinien für Warenkorb-Items
CREATE POLICY "Benutzer können nur ihre eigenen Warenkorb-Items lesen" ON public.cart_items
  FOR SELECT USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));
  
CREATE POLICY "Benutzer können nur ihre eigenen Warenkorb-Items aktualisieren" ON public.cart_items
  FOR UPDATE USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));
  
CREATE POLICY "Benutzer können nur ihre eigenen Warenkorb-Items erstellen" ON public.cart_items
  FOR INSERT WITH CHECK (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));
  
CREATE POLICY "Benutzer können nur ihre eigenen Warenkorb-Items löschen" ON public.cart_items
  FOR DELETE USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));

-- Richtlinien für Bestellungen
CREATE POLICY "Benutzer können nur ihre eigenen Bestellungen lesen" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Benutzer können nur ihre eigenen Bestellungen erstellen" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Richtlinien für Bestellpositionen
CREATE POLICY "Benutzer können nur ihre eigenen Bestellpositionen lesen" ON public.order_items
  FOR SELECT USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Richtlinien für Support-Tickets
CREATE POLICY "Benutzer können nur ihre eigenen Support-Tickets lesen" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  
CREATE POLICY "Benutzer können Support-Tickets erstellen" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

-- Richtlinien für Ticket-Antworten
CREATE POLICY "Benutzer können nur Antworten auf ihre eigenen Tickets lesen" ON public.ticket_responses
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) 
    AND NOT is_internal
  );

-- Öffentliche Richtlinien für Produkte und Zutaten
CREATE POLICY "Produkte sind öffentlich lesbar" ON public.products
  FOR SELECT USING (true);
  
CREATE POLICY "Zutaten sind öffentlich lesbar" ON public.ingredients
  FOR SELECT USING (true);
  
CREATE POLICY "Produkt-Zutaten sind öffentlich lesbar" ON public.product_ingredients
  FOR SELECT USING (true);

-- Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_modtime
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
CREATE TRIGGER update_products_modtime
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
CREATE TRIGGER update_ingredients_modtime
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
CREATE TRIGGER update_carts_modtime
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
CREATE TRIGGER update_cart_items_modtime
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
CREATE TRIGGER update_orders_modtime
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
CREATE TRIGGER update_support_tickets_modtime
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column(); 