'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import supabase from '../../../lib/supabase';

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
  category: string;
  is_active: boolean;
  category_name?: string;
  ingredients?: string;
  allergens?: string;
  preparation_time?: number;
}

// Interface für die Daten von der API
interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_active: boolean;
  is_featured: boolean;
  [key: string]: any; // Für alle weiteren Eigenschaften
}

interface CartResult {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface Ingredient {
  id: string;
  name: string;
  price: number;
  category: 'smoothie' | 'bowl' | 'both';
}

interface Topping {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface CartItem {
  product_id: string;
  quantity: number;
  customization: {
    extras: { id: string; name: string; price: number }[];
    removedIngredients: string[];
    notes?: string;
  };
}

// Toppings für verschiedene Kategorien
const TOPPINGS_BY_CATEGORY: Record<string, Topping[]> = {
  // Fruchtsmoothies
  '47a5cd79-f0e9-4808-b793-4bf365efc167': [
    { id: 't1', name: 'Chiasamen', price: 0.5, selected: false },
    { id: 't2', name: 'Leinsamen', price: 0.5, selected: false },
    { id: 't3', name: 'Proteinpulver', price: 1.5, selected: false },
    { id: 't4', name: 'Honig', price: 0.5, selected: false },
    { id: 't5', name: 'Agavendicksaft', price: 0.5, selected: false },
    { id: 't6', name: 'Haferflocken', price: 0.5, selected: false },
    { id: 't7', name: 'Extra Frucht', price: 1.0, selected: false },
  ],
  // Grüne Smoothies
  '9cabfc77-5577-4d59-b992-e503853f714e': [
    { id: 't1', name: 'Chiasamen', price: 0.5, selected: false },
    { id: 't2', name: 'Leinsamen', price: 0.5, selected: false },
    { id: 't8', name: 'Ingwer', price: 0.5, selected: false },
    { id: 't9', name: 'Kurkuma', price: 0.5, selected: false },
    { id: 't10', name: 'Spirulina', price: 1.0, selected: false },
    { id: 't11', name: 'Hanfprotein', price: 1.5, selected: false },
  ],
  // Protein Smoothies
  'e560a4a6-0f05-47b1-86f2-1d1cfcd1f1a0': [
    { id: 't3', name: 'Extra Proteinpulver', price: 1.5, selected: false },
    { id: 't12', name: 'Erdnussbutter', price: 1.0, selected: false },
    { id: 't13', name: 'Mandelmus', price: 1.0, selected: false },
    { id: 't14', name: 'Kokosflocken', price: 0.5, selected: false },
    { id: 't15', name: 'MCT-Öl', price: 1.0, selected: false },
  ],
  // Açaí Bowls
  '014ef8b6-596a-43b3-9093-e1aa71ed5e70': [
    { id: 't16', name: 'Extra Granola', price: 1.0, selected: false },
    { id: 't17', name: 'Kokosflocken', price: 0.5, selected: false },
    { id: 't18', name: 'Frische Beeren', price: 1.5, selected: false },
    { id: 't19', name: 'Banane', price: 0.5, selected: false },
    { id: 't20', name: 'Honig', price: 0.5, selected: false },
    { id: 't21', name: 'Nüsse', price: 1.0, selected: false },
  ],
  // Protein Bowls
  'bd81dac1-e489-420a-ba18-313fc40b6b15': [
    { id: 't3', name: 'Extra Proteinpulver', price: 1.5, selected: false },
    { id: 't12', name: 'Erdnussbutter', price: 1.0, selected: false },
    { id: 't13', name: 'Mandelmus', price: 1.0, selected: false },
    { id: 't16', name: 'Extra Granola', price: 1.0, selected: false },
    { id: 't21', name: 'Nüsse', price: 1.0, selected: false },
    { id: 't22', name: 'Kakao-Nibs', price: 1.0, selected: false },
  ],
  // Smoothie Bowls
  '5735577e-d79c-4983-9771-35c28b981ebc': [
    { id: 't16', name: 'Extra Granola', price: 1.0, selected: false },
    { id: 't17', name: 'Kokosflocken', price: 0.5, selected: false },
    { id: 't18', name: 'Frische Beeren', price: 1.5, selected: false },
    { id: 't19', name: 'Banane', price: 0.5, selected: false },
    { id: 't20', name: 'Honig', price: 0.5, selected: false },
    { id: 't21', name: 'Nüsse', price: 1.0, selected: false },
    { id: 't23', name: 'Chiasamen', price: 0.5, selected: false },
  ],
  // Standardtoppings für unbekannte Kategorien
  'default': [
    { id: 't1', name: 'Chiasamen', price: 0.5, selected: false },
    { id: 't2', name: 'Leinsamen', price: 0.5, selected: false },
    { id: 't3', name: 'Proteinpulver', price: 1.5, selected: false },
    { id: 't4', name: 'Honig', price: 0.5, selected: false },
  ]
};

// Konstante Zutaten für verschiedene Produkte
const DEFAULT_INGREDIENTS: Record<string, string[]> = {
  smoothie1: ['Erdbeere', 'Banane', 'Joghurt', 'Honig'],
  smoothie2: ['Mango', 'Ananas', 'Kokosmilch', 'Agavendicksaft'],
  smoothie3: ['Spinat', 'Apfel', 'Banane', 'Ingwer'],
  bowl1: ['Açaí', 'Banane', 'Erdbeere', 'Granola'],
  bowl2: ['Joghurt', 'Beeren', 'Chia-Samen', 'Nüsse'],
  bowl3: ['Griechischer Joghurt', 'Honig', 'Walnüsse', 'Banane']
};

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);

  // Gesamtpreis berechnen
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    
    const basePrice = Number(product.price);
    const toppingsPrice = toppings.reduce((sum, topping) => {
      return sum + (topping.selected ? topping.price : 0);
    }, 0);
    
    return (basePrice + toppingsPrice) * quantity;
  }, [product, toppings, quantity]);

  // Produkt und Toppings laden
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        // Produkt mit Kategorienamen laden
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            categories(name)
          `)
          .eq('id', params.id)
          .single();
        
        if (productError) {
          throw new Error(`Fehler beim Laden des Produkts: ${productError.message}`);
        }
        
        if (!productData) {
          setError('Produkt nicht gefunden');
          return;
        }
        
        // Formatieren mit Kategorienamen
        const formattedProduct: Product = {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image_url: productData.image_url,
          category: productData.category || '',
          is_active: productData.is_active,
          is_featured: productData.is_featured,
          category_id: productData.category_id || '',
          category_name: productData.categories?.name || 'Unbekannt',
          ingredients: productData.ingredients || '',
          allergens: productData.allergens || '',
          preparation_time: productData.preparation_time || 0,
          is_available: productData.is_available || true
        };
        
        setProduct(formattedProduct);
        
        // Zutaten als Array aufteilen, wenn vorhanden
        if (formattedProduct.ingredients) {
          const ingredientsArray = formattedProduct.ingredients
            .split(',')
            .map(ingredient => ingredient.trim());
          
          // Vorbereitung für entfernbare Zutaten
          setRemovedIngredients([]);
        }
        
        // Toppings aus der Datenbank laden
        // Wir holen sowohl die allgemeinen Toppings (category_id IS NULL) als auch
        // die kategoriespezifischen Toppings
        const { data: toppingsData, error: toppingsError } = await supabase
          .from('toppings')
          .select('*')
          .eq('is_available', true)
          .or(`category_id.is.null,category_id.eq.${formattedProduct.category_id}`)
          .order('sort_order');
        
        if (toppingsError) {
          console.error('Fehler beim Laden der Toppings:', toppingsError);
        }
        
        // Toppings formatieren und mit selected-Property versehen
        if (toppingsData && toppingsData.length > 0) {
          const formattedToppings = toppingsData.map(topping => ({
            id: topping.id,
            name: topping.name,
            price: Number(topping.price),
            selected: false
          }));
          
          setToppings(formattedToppings);
        }
      } catch (err) {
        console.error('Fehler beim Laden des Produkts:', err);
        setError('Fehler beim Laden des Produkts. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  // Topping umschalten
  const toggleTopping = (id: string) => {
    setToppings(prev => 
      prev.map(topping => 
        topping.id === id ? { ...topping, selected: !topping.selected } : topping
      )
    );
  };
  
  // Zutat entfernen umschalten
  const toggleRemoveIngredient = (ingredient: string) => {
    setRemovedIngredients(prev => {
      if (prev.includes(ingredient)) {
        return prev.filter(ing => ing !== ingredient);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  // Zum Warenkorb hinzufügen
  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!user) {
      // Benutzer ist nicht angemeldet, weiterleiten zur Anmeldeseite
      router.push('/auth/login?redirect=' + encodeURIComponent(`/shop/bestellen/${params.id}`));
      return;
    }

    try {
      setIsAddingToCart(true);
      
      const selectedToppings = toppings
        .filter(t => t.selected)
        .map(t => ({ id: t.id, name: t.name, price: t.price }));
      
      // Warenkorb abrufen oder erstellen
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (cartError && cartError.code !== 'PGRST116') {
        throw new Error(`Fehler beim Abrufen des Warenkorbs: ${cartError.message}`);
      }
      
      let cartId;
      
      // Wenn kein Warenkorb gefunden wurde, einen neuen erstellen
      if (!cart) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert([
            {
              user_id: user.id,
              status: 'active',
              total_amount: 0
            }
          ])
          .select()
          .single();
          
        if (newCartError) {
          throw new Error(`Fehler beim Erstellen eines neuen Warenkorbs: ${newCartError.message}`);
        }
        
        cartId = newCart.id;
      } else {
        cartId = cart.id;
      }
      
      // Preis für Extras berechnen
      const extrasCost = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
      
      // Gesamtpreis mit Extras berechnen
      const itemPrice = Number(product.price) + extrasCost;
      const itemTotalPrice = itemPrice * quantity;
      
      // Anpassungsdetails als JSON für Datenbank
      const customizationData = {
        extras: selectedToppings,
        removedIngredients,
        notes: notes.trim()
      };
      
      // Item zum Warenkorb hinzufügen
      const { error: addItemError } = await supabase
        .from('cart_items')
        .insert([
          {
            cart_id: cartId,
            product_id: product.id,
            quantity: quantity,
            price: itemPrice,
            total_price: itemTotalPrice,
            notes: notes,
            customization: customizationData
          }
        ]);
        
      if (addItemError) {
        throw new Error(`Fehler beim Hinzufügen zum Warenkorb: ${addItemError.message}`);
      }
      
      // Gesamtbetrag des Warenkorbs aktualisieren
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('total_price')
        .eq('cart_id', cartId);
        
      const newTotalAmount = (cartItems || []).reduce((sum, item) => sum + item.total_price, 0);
      
      await supabase
        .from('carts')
        .update({ total_amount: newTotalAmount })
        .eq('id', cartId);
      
      setAddToCartSuccess(true);
      
      // Kurz warten und dann zum Warenkorb weiterleiten
      setTimeout(() => {
        router.push('/shop/cart');
      }, 1500);
      
    } catch (err) {
      console.error('Fehler beim Hinzufügen zum Warenkorb:', err);
      alert('Fehler beim Hinzufügen zum Warenkorb. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Produkt nicht gefunden'}
        </div>
        <div className="text-center py-4">
          <Link href="/shop/bestellen" className="text-teal-600 hover:text-teal-700">
            Zurück zur Produktübersicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-6">
        <Link href="/shop/bestellen" className="text-teal-600 hover:text-teal-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Zurück zur Übersicht
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Produktbild */}
          <div className="md:w-1/2 h-64 md:h-auto relative">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Produktinformationen und Anpassungsoptionen */}
          <div className="md:w-1/2 p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>

            {/* Preis und Vorbereitunszeit */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-teal-600">{Number(product.price).toFixed(2)} €</span>
              {product.preparation_time && (
                <span className="text-sm text-gray-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Zubereitung: ca. {product.preparation_time} Min.
                </span>
              )}
            </div>

            {/* Zutaten und Allergene */}
            {product.ingredients && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-1">Zutaten:</h3>
                <p className="text-gray-600 text-sm">{product.ingredients}</p>
              </div>
            )}

            {product.allergens && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-1">Allergene:</h3>
                <p className="text-gray-600 text-sm">{product.allergens}</p>
              </div>
            )}

            {/* Trennlinie */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Quantität */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Menge:</h3>
              <div className="flex items-center">
                <button
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="bg-gray-200 text-gray-700 py-1 px-3 rounded-l hover:bg-gray-300"
                >
                  -
                </button>
                <span className="bg-gray-100 py-1 px-6">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-gray-200 text-gray-700 py-1 px-3 rounded-r hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Toppings */}
            {toppings.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Extras und Toppings:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {toppings.map((topping) => (
                    <div key={topping.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`topping-${topping.id}`}
                        checked={topping.selected}
                        onChange={() => toggleTopping(topping.id)}
                        className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor={`topping-${topping.id}`} className="text-sm text-gray-700 flex-grow">
                        {topping.name}
                      </label>
                      <span className="text-sm text-gray-600">+{topping.price.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zutaten entfernen - basierend auf product.ingredients */}
            {product.ingredients && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Zutaten entfernen:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.ingredients.split(',').map((ingredient, index) => {
                    const trimmedIngredient = ingredient.trim();
                    return (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`remove-${index}`}
                          checked={removedIngredients.includes(trimmedIngredient)}
                          onChange={() => toggleRemoveIngredient(trimmedIngredient)}
                          className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor={`remove-${index}`} className="text-sm text-gray-700">
                          Ohne {trimmedIngredient}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spezielle Anweisungen */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Spezielle Anweisungen:</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Spezielle Wünsche oder Anpassungen..."
                rows={3}
                maxLength={200}
              ></textarea>
            </div>

            {/* Gesamtpreis und Warenkorb-Button */}
            <div className="flex flex-col space-y-4">
              <div className="font-bold text-lg">
                Gesamtpreis: <span className="text-teal-600">{totalPrice.toFixed(2)} €</span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || addToCartSuccess}
                className={`w-full py-3 px-4 flex justify-center items-center rounded-lg font-semibold transition ${
                  addToCartSuccess 
                    ? 'bg-green-500 text-white' 
                    : isAddingToCart 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                {isAddingToCart ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Wird hinzugefügt...
                  </div>
                ) : addToCartSuccess ? (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Zum Warenkorb hinzugefügt!
                  </div>
                ) : (
                  'In den Warenkorb'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}