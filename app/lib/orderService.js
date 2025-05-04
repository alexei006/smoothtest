import supabase from './supabase';
import { getCart, clearCart } from './cartService';

/**
 * Bestellung erstellen
 * @param {string} userId - ID des Benutzers
 * @param {Object} orderData - Zusätzliche Bestelldaten (Lieferadresse, Notizen, etc.)
 * @returns {Promise<Object>} - Ergebnis der Bestellung
 */
export const createOrder = async (userId, orderData) => {
  try {
    if (!userId) {
      return { success: false, message: 'Keine Benutzer-ID angegeben', order: null };
    }
    
    // Warenkorb abrufen
    const { success: cartSuccess, cart } = await getCart(userId);
    
    if (!cartSuccess || !cart) {
      return { success: false, message: 'Warenkorb konnte nicht abgerufen werden', order: null };
    }
    
    // Prüfen, ob der Warenkorb leer ist
    if (!cart.items || cart.items.length === 0) {
      return { success: false, message: 'Der Warenkorb ist leer', order: null };
    }
    
    // Bestellung erstellen
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          order_number: orderNumber,
          total_amount: cart.total_amount,
          status: 'pending',
          shipping_address: orderData.address || '',
          shipping_postal_code: orderData.postalCode || '',
          shipping_city: orderData.city || '',
          phone_number: orderData.phoneNumber || '',
          notes: orderData.notes || '',
          payment_method: orderData.paymentMethod || 'cash',
          payment_status: 'pending'
        }
      ])
      .select()
      .single();
      
    if (orderError) {
      console.error('Fehler beim Erstellen der Bestellung:', orderError);
      return { success: false, message: orderError.message, order: null };
    }
    
    // Bestellpositionen erstellen
    const orderItems = cart.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total_price: item.total_price,
      notes: item.notes || ''
    }));
    
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
      
    if (orderItemsError) {
      console.error('Fehler beim Erstellen der Bestellpositionen:', orderItemsError);
      
      // Bestellung löschen, da die Bestellpositionen fehlgeschlagen sind
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
        
      return { success: false, message: orderItemsError.message, order: null };
    }
    
    // Warenkorb leeren
    await clearCart(userId);
    
    // Warenkorb-Status auf "ordered" setzen
    await supabase
      .from('carts')
      .update({ status: 'ordered' })
      .eq('id', cart.id);
    
    return { success: true, message: 'Bestellung erfolgreich erstellt', order };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Erstellen der Bestellung:', error);
    return { success: false, message: error.message, order: null };
  }
};

/**
 * Bestellungen eines Benutzers abrufen
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Array>} - Liste der Bestellungen
 */
export const getUserOrders = async (userId) => {
  try {
    // Überprüfen, ob userId ein gültiger Wert ist
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn('Keine gültige Benutzer-ID angegeben:', userId);
      return [];
    }
    
    console.log('Versuche Bestellungen für Benutzer abzurufen:', userId);
    
    // Zuerst versuchen, mit user_id zu suchen
    let { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Fehler beim Abrufen der Bestellungen mit user_id:', error);
      error = null; // Zurücksetzen für den nächsten Versuch
    }
    
    // Wenn keine Daten gefunden wurden, mit customer_id versuchen
    if (!data || data.length === 0) {
      console.log('Keine Bestellungen mit user_id gefunden, versuche customer_id...');
      const result = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
        
      data = result.data;
      error = result.error;
      
      if (error) {
        console.error('Fehler beim Abrufen der Bestellungen mit customer_id:', error);
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellungen mit user_id:', userId, error);
    return [];
  }
};

/**
 * Details einer Bestellung abrufen
 * @param {string} orderId - ID der Bestellung
 * @param {string} userId - ID des Benutzers (für Zugriffskontrolle)
 * @returns {Promise<Object|null>} - Bestelldetails oder null
 */
export const getOrderDetails = async (orderId, userId) => {
  try {
    if (!orderId) {
      return null;
    }
    
    // Bestellung abrufen
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (orderError) {
      console.error('Fehler beim Abrufen der Bestellung:', orderError);
      return null;
    }
    
    // Prüfen, ob der Benutzer Zugriff auf diese Bestellung hat
    if (userId && order.user_id !== userId) {
      console.error('Zugriff verweigert: Benutzer ist nicht der Eigentümer der Bestellung');
      return null;
    }
    
    // Bestellpositionen abrufen
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products(*)
      `)
      .eq('order_id', orderId);
      
    if (itemsError) {
      console.error('Fehler beim Abrufen der Bestellpositionen:', itemsError);
      return { ...order, items: [] };
    }
    
    return { ...order, items: items || [] };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Bestelldetails:', error);
    return null;
  }
};

/**
 * Bestellstatus aktualisieren
 * @param {string} orderId - ID der Bestellung
 * @param {string} status - Neuer Status
 * @returns {Promise<Object>} - Ergebnis der Aktualisierung
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId || !status) {
      return { success: false, message: 'Bestellungs-ID oder Status fehlt' };
    }
    
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
      
    if (error) {
      console.error('Fehler beim Aktualisieren des Bestellstatus:', error);
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'Bestellstatus erfolgreich aktualisiert' };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Aktualisieren des Bestellstatus:', error);
    return { success: false, message: error.message };
  }
}; 