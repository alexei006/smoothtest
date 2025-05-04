-- Zutaten einfügen
INSERT INTO public.ingredients (id, name, description, is_allergen)
VALUES 
  ('d1e8c2f0-0b8a-4a0c-9a1e-2a5d8e3c4b5a', 'Banane', 'Frische reife Banane', false),
  ('c2f9d3e0-1c8b-5b1d-0a2e-3b6c4d5e7f8a', 'Erdbeere', 'Süße saftige Erdbeeren', false),
  ('b3e0c4f1-2d9c-6c2e-1b3f-4c5d6e7f8a9b', 'Mango', 'Exotische reife Mango', false),
  ('a4f1d5e2-3e0d-7d3f-2c4g-5d6e7f8a9b0c', 'Spinat', 'Frischer Blattspinat', false),
  ('e2f3g4h5-4f1e-8e4f-3d5h-6e7f8a9b0c1d', 'Haferflocken', 'Vollkorn-Haferflocken', false),
  ('f3g4h5i6-5g2f-9f5g-4e6i-7f8a9b0c1d2e', 'Mandelmilch', 'Pflanzliche Mandelmilch', true),
  ('g4h5i6j7-6h3g-0g6h-5f7j-8a9b0c1d2e3f', 'Kokosmilch', 'Cremige Kokosmilch', false),
  ('h5i6j7k8-7i4h-1h7i-6g8k-9b0c1d2e3f4g', 'Chiasamen', 'Nährstoffreiche Chiasamen', false),
  ('i6j7k8l9-8j5i-2i8j-7h9l-0c1d2e3f4g5h', 'Açaí-Beere', 'Tiefgefrorenes Açaí-Püree', false),
  ('j7k8l9m0-9k6j-3j9k-8i0m-1d2e3f4g5h6i', 'Blaubeere', 'Frische Heidelbeeren', false),
  ('k8l9m0n1-0l7k-4k0l-9j1n-2e3f4g5h6i7j', 'Himbeere', 'Frische Himbeeren', false),
  ('l9m0n1o2-1m8l-5l1m-0k2o-3f4g5h6i7j8k', 'Ananas', 'Frische Ananas-Stücke', false),
  ('m0n1o2p3-2n9m-6m2n-1l3p-4g5h6i7j8k9l', 'Joghurt', 'Naturjoghurt', true),
  ('n1o2p3q4-3o0n-7n3o-2m4q-5h6i7j8k9l0m', 'Honig', 'Natürlicher Honig', false),
  ('o2p3q4r5-4p1o-8o4p-3n5r-6i7j8k9l0m1n', 'Agavendicksaft', 'Natürlicher Süßungsmittel', false),
  ('p3q4r5s6-5q2p-9p5q-4o6s-7j8k9l0m1n2o', 'Granola', 'Hausgemachtes Granola', true);

-- Smoothies einfügen
INSERT INTO public.products (id, name, description, price, image_url, category, is_featured)
VALUES 
  ('a1b2c3d4-9e8f-7g6h-5i4j-3k2l1m0n9o8', 'Beeren Traum', 'Ein köstlicher Mix aus Erdbeeren, Blaubeeren und Himbeeren', 6.99, '/images/smoothies/beeren-traum.jpg', 'smoothie', true),
  ('b2c3d4e5-0f9g-8h7i-6j5k-4l3m2n1o0p9', 'Tropical Paradise', 'Erfrischender Mix aus Mango, Ananas und Kokosmilch', 7.49, '/images/smoothies/tropical-paradise.jpg', 'smoothie', true),
  ('c3d4e5f6-1g0h-9i8j-7k6l-5m4n3o2p1q0', 'Green Energy', 'Gesunder Mix aus Spinat, Banane und Apfel', 6.99, '/images/smoothies/green-energy.jpg', 'smoothie', false),
  ('d4e5f6g7-2h1i-0j9k-8l7m-6n5o4p3q2r1', 'Protein Power', 'Proteinreicher Smoothie mit Banane, Erdnussbutter und Haferflocken', 7.99, '/images/smoothies/protein-power.jpg', 'smoothie', false),
  ('e5f6g7h8-3i2j-1k0l-9m8n-7o6p5q4r3s2', 'Detox Delight', 'Entgiftender Smoothie mit grünem Tee, Gurke und Zitrone', 6.99, '/images/smoothies/detox-delight.jpg', 'smoothie', false);

-- Bowls einfügen
INSERT INTO public.products (id, name, description, price, image_url, category, is_featured)
VALUES 
  ('f6g7h8i9-4j3k-2l1m-0n9o-8p7q6r5s4t3', 'Açaí Dream Bowl', 'Klassische Açaí-Bowl mit gemischten Beeren und Granola', 9.99, '/images/bowls/acai-dream-bowl.jpg', 'bowl', true),
  ('g7h8i9j0-5k4l-3m2n-1o0p-9q8r7s6t5u4', 'Tropical Bowl', 'Exotische Bowl mit Mango, Ananas und Kokosflocken', 10.49, '/images/bowls/tropical-bowl.jpg', 'bowl', true),
  ('h8i9j0k1-6l5m-4n3o-2p1q-0r9s8t7u6v5', 'Dragon Fruit Bowl', 'Pitaya-Bowl mit exotischen Früchten und Chiasamen', 11.99, '/images/bowls/dragon-fruit-bowl.jpg', 'bowl', false),
  ('i9j0k1l2-7m6n-5o4p-3q2r-1s0t9u8v7w6', 'Green Bowl', 'Energiereiche Bowl mit Spinat, Kiwi und Avocado', 10.99, '/images/bowls/green-bowl.jpg', 'bowl', false),
  ('j0k1l2m3-8n7o-6p5q-4r3s-2t1u0v9w8x7', 'Protein Bowl', 'Proteinreiche Bowl mit Joghurt, Banane und Nüssen', 10.99, '/images/bowls/protein-bowl.jpg', 'bowl', false);

-- Produkt-Zutaten-Verknüpfungen für Smoothies
-- Beeren Traum
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
VALUES 
  ('a1b2c3d4-9e8f-7g6h-5i4j-3k2l1m0n9o8', 'c2f9d3e0-1c8b-5b1d-0a2e-3b6c4d5e7f8a', '100g'), -- Erdbeere
  ('a1b2c3d4-9e8f-7g6h-5i4j-3k2l1m0n9o8', 'j7k8l9m0-9k6j-3j9k-8i0m-1d2e3f4g5h6i', '50g'),  -- Blaubeere
  ('a1b2c3d4-9e8f-7g6h-5i4j-3k2l1m0n9o8', 'k8l9m0n1-0l7k-4k0l-9j1n-2e3f4g5h6i7j', '50g'),  -- Himbeere
  ('a1b2c3d4-9e8f-7g6h-5i4j-3k2l1m0n9o8', 'f3g4h5i6-5g2f-9f5g-4e6i-7f8a9b0c1d2e', '200ml'); -- Mandelmilch

-- Tropical Paradise
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
VALUES 
  ('b2c3d4e5-0f9g-8h7i-6j5k-4l3m2n1o0p9', 'b3e0c4f1-2d9c-6c2e-1b3f-4c5d6e7f8a9b', '100g'), -- Mango
  ('b2c3d4e5-0f9g-8h7i-6j5k-4l3m2n1o0p9', 'l9m0n1o2-1m8l-5l1m-0k2o-3f4g5h6i7j8k', '100g'), -- Ananas
  ('b2c3d4e5-0f9g-8h7i-6j5k-4l3m2n1o0p9', 'g4h5i6j7-6h3g-0g6h-5f7j-8a9b0c1d2e3f', '200ml'); -- Kokosmilch

-- Green Energy
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
VALUES 
  ('c3d4e5f6-1g0h-9i8j-7k6l-5m4n3o2p1q0', 'a4f1d5e2-3e0d-7d3f-2c4g-5d6e7f8a9b0c', '50g'),  -- Spinat
  ('c3d4e5f6-1g0h-9i8j-7k6l-5m4n3o2p1q0', 'd1e8c2f0-0b8a-4a0c-9a1e-2a5d8e3c4b5a', '1 Stück'); -- Banane

-- Protein Power
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
VALUES 
  ('d4e5f6g7-2h1i-0j9k-8l7m-6n5o4p3q2r1', 'd1e8c2f0-0b8a-4a0c-9a1e-2a5d8e3c4b5a', '1 Stück'), -- Banane
  ('d4e5f6g7-2h1i-0j9k-8l7m-6n5o4p3q2r1', 'e2f3g4h5-4f1e-8e4f-3d5h-6e7f8a9b0c1d', '30g'); -- Haferflocken

-- Produkt-Zutaten-Verknüpfungen für Bowls
-- Açaí Dream Bowl
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
VALUES 
  ('f6g7h8i9-4j3k-2l1m-0n9o-8p7q6r5s4t3', 'i6j7k8l9-8j5i-2i8j-7h9l-0c1d2e3f4g5h', '200g'), -- Açaí
  ('f6g7h8i9-4j3k-2l1m-0n9o-8p7q6r5s4t3', 'p3q4r5s6-5q2p-9p5q-4o6s-7j8k9l0m1n2o', '50g'),  -- Granola
  ('f6g7h8i9-4j3k-2l1m-0n9o-8p7q6r5s4t3', 'c2f9d3e0-1c8b-5b1d-0a2e-3b6c4d5e7f8a', '50g'),  -- Erdbeere
  ('f6g7h8i9-4j3k-2l1m-0n9o-8p7q6r5s4t3', 'd1e8c2f0-0b8a-4a0c-9a1e-2a5d8e3c4b5a', '1/2 Stück'); -- Banane

-- Tropical Bowl
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
VALUES 
  ('g7h8i9j0-5k4l-3m2n-1o0p-9q8r7s6t5u4', 'b3e0c4f1-2d9c-6c2e-1b3f-4c5d6e7f8a9b', '100g'), -- Mango
  ('g7h8i9j0-5k4l-3m2n-1o0p-9q8r7s6t5u4', 'l9m0n1o2-1m8l-5l1m-0k2o-3f4g5h6i7j8k', '100g'), -- Ananas
  ('g7h8i9j0-5k4l-3m2n-1o0p-9q8r7s6t5u4', 'd1e8c2f0-0b8a-4a0c-9a1e-2a5d8e3c4b5a', '1 Stück'), -- Banane
  ('g7h8i9j0-5k4l-3m2n-1o0p-9q8r7s6t5u4', 'p3q4r5s6-5q2p-9p5q-4o6s-7j8k9l0m1n2o', '50g'); -- Granola 