'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCart, removeFromCart, clearCart } from '../../lib/cartService';
import { useAuth } from '../../context/AuthContext';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  total_price: number;
  notes: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
  };
}

interface Cart {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  // Warenkorb laden
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { success, cart: cartData } = await getCart(user.id);
        
        if (success && cartData) {
          setCart(cartData);
        } else {
          setError('Fehler beim Laden des Warenkorbs');
        }
      } catch (err) {
        console.error('Fehler beim Laden des Warenkorbs:', err);
        setError('Fehler beim Laden des Warenkorbs. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  // Item aus dem Warenkorb entfernen
  const handleRemoveItem = async (itemId: string) => {
    if (!user || !cart) return;

    try {
      setLoading(true);
      const { success } = await removeFromCart(user.id, itemId);
      
      if (success) {
        // Warenkorb aktualisieren
        const updatedItems = cart.items.filter(item => item.id !== itemId);
        const updatedTotalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
        
        setCart({
          ...cart,
          items: updatedItems,
          total_amount: updatedTotalAmount
        });
      } else {
        setError('Fehler beim Entfernen des Produkts');
      }
    } catch (err) {
      console.error('Fehler beim Entfernen des Produkts:', err);
      setError('Fehler beim Entfernen des Produkts. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Warenkorb leeren
  const handleClearCart = async () => {
    if (!user || !cart) return;

    if (window.confirm('Möchten Sie wirklich den gesamten Warenkorb leeren?')) {
      try {
        setLoading(true);
        const { success } = await clearCart(user.id);
        
        if (success) {
          setCart({
            ...cart,
            items: [],
            total_amount: 0
          });
        } else {
          setError('Fehler beim Leeren des Warenkorbs');
        }
      } catch (err) {
        console.error('Fehler beim Leeren des Warenkorbs:', err);
        setError('Fehler beim Leeren des Warenkorbs. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Zur Kasse gehen
  const handleCheckout = () => {
    router.push('/shop/checkout');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Warenkorb</h1>
          <p className="text-center text-gray-600 mb-8">
            Bitte melden Sie sich an, um Ihren Warenkorb anzuzeigen
          </p>
          <div className="flex justify-center">
            <Link
              href="/auth/login?redirect=/shop/cart"
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-8">Warenkorb</h1>

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
          {cart && cart.items.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Artikelliste */}
              <div className="lg:w-2/3">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b">
                    <h2 className="text-lg font-semibold">Ihre Produkte</h2>
                  </div>
                  
                  <ul className="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex flex-col md:flex-row p-4 gap-4">
                        <div className="md:w-24 h-24 bg-gray-200 rounded-md relative overflow-hidden flex-shrink-0">
                          {item.products.image_url ? (
                            <Image
                              src={item.products.image_url}
                              alt={item.products.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Kein Bild
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="font-semibold text-gray-800">{item.products.name}</h3>
                          <p className="text-sm text-gray-600">{item.products.description}</p>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div>
                              <p className="text-gray-600">
                                {item.quantity} x {item.price.toFixed(2)} €
                              </p>
                              <p className="font-bold text-gray-800">
                                {item.total_price.toFixed(2)} €
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              Entfernen
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="p-4 border-t flex justify-end">
                    <button
                      onClick={handleClearCart}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      Warenkorb leeren
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Zusammenfassung */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4">Zusammenfassung</h2>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zwischensumme</span>
                      <span>{cart.total_amount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lieferkosten</span>
                      <span>{cart.total_amount >= 20 ? 'Kostenlos' : '3,99 €'}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between font-bold">
                      <span>Gesamt</span>
                      <span>
                        {(cart.total_amount + (cart.total_amount >= 20 ? 0 : 3.99)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition"
                  >
                    Zur Kasse
                  </button>
                  
                  <Link
                    href="/shop/menu"
                    className="block text-center text-teal-600 hover:text-teal-800 mt-4"
                  >
                    Weiter einkaufen
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Dein Warenkorb ist leer</h2>
              <p className="text-gray-600 mb-6">
                Füge einige leckere Smoothies oder Bowls hinzu!
              </p>
              <Link
                href="/shop/menu"
                className="bg-teal-600 text-white py-2 px-6 rounded-lg hover:bg-teal-700 transition inline-block"
              >
                Zum Menü
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
} 