'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders, getOrderDetails } from '../../lib/orderService';

type Order = {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
};

type OrderDetails = Order & {
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total_price: number;
    products: {
      id: string;
      name: string;
      image_url: string;
    }
  }>;
  shipping_address: string;
  shipping_postal_code: string;
  shipping_city: string;
  phone_number: string;
  notes: string;
};

export default function OrdersList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status-Übersetzungen
  const statusLabels: { [key: string]: string } = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    shipped: 'Versendet',
    delivered: 'Geliefert',
    cancelled: 'Storniert'
  };

  // Bestellungen abrufen
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Prüfen, ob ein gültiger Benutzer mit ID vorhanden ist
        if (user && user.id && typeof user.id === 'string') {
          setLoading(true);
          setError(null);
          console.log('Rufe Bestellungen für Benutzer ab in OrdersList:', user.id);
          const userOrders = await getUserOrders(user.id);
          console.log('Erhaltene Bestellungen:', userOrders);
          setOrders(userOrders || []);
        } else {
          console.warn('Kein gültiger Benutzer verfügbar für Bestellungsabruf');
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Fehler beim Abrufen der Bestellungen:', err);
        setError('Die Bestellungen konnten nicht geladen werden: ' + (err.message || 'Unbekannter Fehler'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Bestelldetails anzeigen
  const viewOrderDetails = async (orderId: string) => {
    try {
      // Prüfen, ob ein gültiger Benutzer mit ID vorhanden ist
      if (user && user.id && typeof user.id === 'string') {
        const details = await getOrderDetails(orderId, user.id);
        setSelectedOrder(details as OrderDetails);
      } else {
        throw new Error('Kein gültiger Benutzer verfügbar');
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Bestelldetails:', err);
      setError('Die Bestelldetails konnten nicht geladen werden.');
    }
  };

  // Zurück zur Bestellübersicht
  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  // Formatieren des Datums
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  // Formatieren des Preises
  const formatPrice = (price: number): string => {
    return (price / 100).toFixed(2).replace('.', ',') + ' €';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Keine Bestellungen vorhanden</h2>
        <p className="text-gray-600">
          Sie haben noch keine Bestellungen aufgegeben.
        </p>
      </div>
    );
  }

  // Detailansicht einer Bestellung
  if (selectedOrder) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Bestellung #{selectedOrder.order_number}
          </h2>
          <button
            onClick={closeOrderDetails}
            className="text-teal-600 hover:text-teal-800"
          >
            Zurück zur Übersicht
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Bestelldetails</h3>
              <p>Datum: {formatDate(selectedOrder.created_at)}</p>
              <p>Status: {statusLabels[selectedOrder.status] || selectedOrder.status}</p>
              <p>Zahlungsmethode: {selectedOrder.payment_method}</p>
              <p>Zahlungsstatus: {selectedOrder.payment_status}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Lieferadresse</h3>
              <p>{selectedOrder.shipping_address}</p>
              <p>{selectedOrder.shipping_postal_code} {selectedOrder.shipping_city}</p>
              <p>Tel: {selectedOrder.phone_number}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Summe</h3>
              <p className="text-lg font-semibold">{formatPrice(selectedOrder.total_amount)}</p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-3">Bestellte Artikel</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left">Artikel</th>
                <th className="py-2 px-3 text-right">Einzelpreis</th>
                <th className="py-2 px-3 text-right">Menge</th>
                <th className="py-2 px-3 text-right">Gesamtpreis</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 px-3">{item.products.name}</td>
                  <td className="py-3 px-3 text-right">{formatPrice(item.price)}</td>
                  <td className="py-3 px-3 text-right">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatPrice(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={3} className="py-3 px-3 text-right">Gesamtsumme:</td>
                <td className="py-3 px-3 text-right">
                  {formatPrice(selectedOrder.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {selectedOrder.notes && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Anmerkungen</h3>
            <div className="bg-gray-50 p-3 rounded">{selectedOrder.notes}</div>
          </div>
        )}
      </div>
    );
  }

  // Übersicht aller Bestellungen
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Meine Bestellungen</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 text-left">Bestellnummer</th>
              <th className="py-2 px-3 text-left">Datum</th>
              <th className="py-2 px-3 text-right">Betrag</th>
              <th className="py-2 px-3 text-center">Status</th>
              <th className="py-2 px-3 text-center">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200">
                <td className="py-3 px-3">{order.order_number}</td>
                <td className="py-3 px-3">{formatDate(order.created_at)}</td>
                <td className="py-3 px-3 text-right">{formatPrice(order.total_amount)}</td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : order.status === 'shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => viewOrderDetails(order.id)}
                    className="text-teal-600 hover:text-teal-800 underline text-sm"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 