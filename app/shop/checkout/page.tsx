'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart } from '../../lib/cartService';
import { createOrder } from '../../lib/orderService';
import { useAuth } from '../../context/AuthContext';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  total_price: number;
  products: {
    name: string;
    price: number;
  };
}

interface Cart {
  id: string;
  total_amount: number;
  items: CartItem[];
}

export default function Checkout() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    address: '',
    postalCode: '',
    city: '',
    phoneNumber: '',
    notes: '',
    paymentMethod: 'cash'
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const { user, customerData } = useAuth();
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
          
          // Vorfüllen, wenn Kundendaten verfügbar sind
          if (customerData) {
            setFormData(prevState => ({
              ...prevState,
              address: customerData.address || '',
              postalCode: customerData.plz || '',
              phoneNumber: customerData.phone || ''
            }));
          }
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
  }, [user, customerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !cart) return;
    
    // Validierung
    if (!formData.address || !formData.postalCode || !formData.city || !formData.phoneNumber) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }
    
    try {
      setPlacingOrder(true);
      setError('');
      
      const { success, order, message } = await createOrder(user.id, formData);
      
      if (success && order) {
        // Weiterleitung zur Bestellbestätigung
        router.push(`/shop/order-confirmation?id=${order.id}`);
      } else {
        setError(message || 'Fehler beim Erstellen der Bestellung');
      }
    } catch (err) {
      console.error('Fehler beim Erstellen der Bestellung:', err);
      setError('Fehler beim Erstellen der Bestellung. Bitte versuchen Sie es später erneut.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Lieferkosten und Gesamtbetrag berechnen
  const getShippingCost = () => {
    if (!cart) return 0;
    return cart.total_amount >= 20 ? 0 : 3.99;
  };
  
  const getTotalAmount = () => {
    if (!cart) return 0;
    return cart.total_amount + getShippingCost();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Checkout</h1>
          <p className="text-center text-gray-600 mb-8">
            Bitte melden Sie sich an, um Ihre Bestellung abzuschließen
          </p>
          <div className="flex justify-center">
            <Link
              href="/auth/login?redirect=/shop/checkout"
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart && cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Checkout</h1>
          <p className="text-center text-gray-600 mb-8">
            Ihr Warenkorb ist leer. Bitte fügen Sie Produkte hinzu, bevor Sie zur Kasse gehen.
          </p>
          <div className="flex justify-center">
            <Link
              href="/shop/menu"
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Zum Menü
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout-Formular */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Lieferinformationen</h2>
              
              <div className="mb-4">
                <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
                  Adresse *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Straße, Hausnummer"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="postalCode" className="block text-gray-700 text-sm font-bold mb-2">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="PLZ"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">
                    Stadt *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Stadt"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Für Lieferungen und Rückfragen"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
                  Anmerkungen zur Bestellung
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Besondere Wünsche oder Hinweise zur Lieferung"
                  rows={3}
                />
              </div>
              
              <h2 className="text-xl font-semibold mb-4 mt-8">Zahlungsmethode</h2>
              
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="cash" className="text-gray-700">
                    Barzahlung bei Lieferung
                  </label>
                </div>
                
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="card" className="text-gray-700">
                    Kartenzahlung bei Lieferung
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="paypal" className="text-gray-700">
                    PayPal
                  </label>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={placingOrder}
                className={`w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline ${
                  placingOrder ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {placingOrder ? 'Bestellung wird aufgegeben...' : 'Bestellung aufgeben'}
              </button>
              
              <p className="text-xs text-gray-600 mt-4">
                * Pflichtfelder
              </p>
            </form>
          </div>
          
          {/* Zusammenfassung */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Zusammenfassung</h2>
              
              {cart && (
                <>
                  <div className="max-h-64 overflow-y-auto mb-4">
                    <ul className="divide-y divide-gray-200">
                      {cart.items.map((item) => (
                        <li key={item.id} className="py-3 flex justify-between">
                          <div>
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-sm text-gray-600">{item.quantity} x {item.price.toFixed(2)} €</p>
                          </div>
                          <p className="font-medium">{item.total_price.toFixed(2)} €</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zwischensumme</span>
                      <span>{cart.total_amount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lieferkosten</span>
                      <span>{getShippingCost() === 0 ? 'Kostenlos' : `${getShippingCost().toFixed(2)} €`}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between font-bold">
                      <span>Gesamt</span>
                      <span>{getTotalAmount().toFixed(2)} €</span>
                    </div>
                  </div>
                </>
              )}
              
              <Link
                href="/shop/cart"
                className="block text-center text-teal-600 hover:text-teal-800"
              >
                Zurück zum Warenkorb
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 