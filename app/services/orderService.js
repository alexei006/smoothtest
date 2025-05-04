import supabase from '../lib/supabase';

/**
 * Bestellungen eines Benutzers abrufen
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Array>} - Liste der Bestellungen
 */
export const getUserOrders = async (userId) => {
  // Dummy-Daten für die Entwicklung - werden angezeigt, wenn keine echten Bestellungen vorliegen
  const dummyOrders = [
    { id: 'ORD-2024-001', order_number: 'ORD-2024-001', date: '15.03.2024', total: 24.90, created_at: '2024-03-15T10:30:00Z', status: 'geliefert' },
    { id: 'ORD-2024-002', order_number: 'ORD-2024-002', date: '02.04.2024', total: 18.50, created_at: '2024-04-02T08:15:00Z', status: 'bestätigt' },
    { id: 'ORD-2024-003', order_number: 'ORD-2024-003', date: '20.04.2024', total: 32.75, created_at: '2024-04-20T14:45:00Z', status: 'neu' }
  ];

  try {
    if (!userId) {
      console.log('Keine Benutzer-ID angegeben');
      return [];
    }
    
    console.log('Rufe Bestellungen für Benutzer ab:', userId);
    
    // In einer echten Anwendung würden wir die Daten aus der Datenbank abrufen
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Fehler beim Abrufen der Bestellungen:', error);
      // Immer Dummy-Daten zurückgeben, wenn die DB-Abfrage fehlschlägt
      return dummyOrders;
    }
    
    // Wenn keine Daten vorhanden sind, geben wir Dummy-Daten zurück
    if (!data || data.length === 0) {
      console.log('Keine Bestellungen in der Datenbank, verwende Dummy-Daten');
      return dummyOrders;
    }
    
    // Daten in das richtige Format umwandeln
    return data.map(order => ({
      id: order.id,
      order_number: order.order_number,
      date: new Date(order.created_at).toLocaleDateString('de-DE'),
      total: parseFloat(order.total || 0),
      created_at: order.created_at,
      status: order.status
    }));
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Bestellungen:', error);
    // Immer Dummy-Daten zurückgeben bei allgemeinen Fehlern
    return dummyOrders;
  }
}; 