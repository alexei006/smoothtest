'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabase';

// Typdefinitionen
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  category_id: string;
  category_name: string;
  ingredients?: string;
  allergens?: string;
  preparation_time?: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function Bestellen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Kategorien und Produkte laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Kategorien laden
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (categoriesError) {
          throw new Error(`Fehler beim Laden der Kategorien: ${categoriesError.message}`);
        }

        // Produkte mit Kategorienamen laden
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories(name)
          `)
          .eq('is_available', true)
          .order('sort_order');

        if (productsError) {
          throw new Error(`Fehler beim Laden der Produkte: ${productsError.message}`);
        }

        // Produkte mit Kategorienamen formatieren
        const formattedProducts = productsData.map(product => ({
          ...product,
          category_name: product.categories?.name || 'Unkategorisiert'
        }));

        setCategories(categoriesData);
        setProducts(formattedProducts);
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Produkte nach Kategorie und Suchbegriff filtern
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Produkte nach Kategorien gruppieren
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const category = product.category_id;
    if (!groups[category]) {
      groups[category] = {
        id: category,
        name: product.category_name,
        products: []
      };
    }
    groups[category].products.push(product);
    return groups;
  }, {} as Record<string, { id: string; name: string; products: Product[] }>);

  // Kategorien nach sort_order sortieren
  const sortedCategories = Object.values(groupedProducts).sort((a, b) => {
    const categoryA = categories.find(cat => cat.id === a.id);
    const categoryB = categories.find(cat => cat.id === b.id);
    return (categoryA?.sort_order || 0) - (categoryB?.sort_order || 0);
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-4">Unsere Produkte</h1>
      <p className="text-center text-gray-600 mb-8">
        Entdecke unsere leckeren Smoothies und nahrhaften Bowls
      </p>

      {/* Filteroptionen */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === null
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alle
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === category.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Fehlermeldung */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Ladeanzeige */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <>
          {/* Produktliste nach Kategorien */}
          {sortedCategories.length > 0 ? (
            <div className="space-y-12">
              {sortedCategories.map(category => (
                <div key={category.id} className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 text-teal-700 border-b pb-2">
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {category.products.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <Link href={`/shop/bestellen/${product.id}`} className="block">
                          <div className="h-48 w-full bg-gray-200 relative">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            {product.is_featured && (
                              <span className="absolute top-2 right-2 bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                Beliebt
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link href={`/shop/bestellen/${product.id}`} className="block">
                            <h3 className="text-lg font-semibold text-gray-800 hover:text-teal-600 transition-colors">{product.name}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                          </Link>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-teal-600">{Number(product.price).toFixed(2)} €</span>
                            <Link 
                              href={`/shop/bestellen/${product.id}`}
                              className="bg-teal-500 text-white py-1 px-3 rounded hover:bg-teal-600 transition"
                            >
                              Anpassen
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Keine Produkte gefunden.</p>
            </div>
          )}
        </>
      )}

      {/* CTA-Bereich */}
      <div className="mt-16 bg-teal-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Spezielle Wünsche?</h2>
        <p className="text-gray-600 mb-6">
          Hast du spezielle Diätanforderungen oder Allergien? Kontaktiere uns für
          individuelle Bestellungen!
        </p>
        <Link
          href="/kontakt"
          className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-teal-700 transition duration-300"
        >
          Kontakt aufnehmen
        </Link>
      </div>
    </div>
  );
} 