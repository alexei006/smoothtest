import supabase from './supabase';
import { getProductById } from './productService';

/**
 * Warenkorb für einen Benutzer abrufen
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Object>} - Warenkorb mit Items
 */
export const getCart = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'Keine Benutzer-ID angegeben', cart: null };
    }
    
    // Aktiven Warenkorb abrufen
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    if (cartError && cartError.code !== 'PGRST116') {
      console.error('Fehler beim Abrufen des Warenkorbs:', cartError);
      return { success: false, message: cartError.message, cart: null };
    }
    
    // Wenn kein Warenkorb gefunden wurde, einen neuen erstellen
    if (!cart) {
      const { data: newCart, error: newCartError } = await supabase
        .from('carts')
        .insert([
          {
            user_id: userId,
            status: 'active',
            total_amount: 0
          }
        ])
        .select()
        .single();
        
      if (newCartError) {
        console.error('Fehler beim Erstellen eines neuen Warenkorbs:', newCartError);
        return { success: false, message: newCartError.message, cart: null };
      }
      
      return { success: true, message: 'Neuer Warenkorb erstellt', cart: { ...newCart, items: [] } };
    }
    
    // Warenkorb-Items abrufen
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(*)
      `)
      .eq('cart_id', cart.id);
      
    if (itemsError) {
      console.error('Fehler beim Abrufen der Warenkorb-Items:', itemsError);
      return { success: true, message: 'Warenkorb gefunden, aber Fehler bei Items', cart: { ...cart, items: [] } };
    }
    
    return { success: true, message: 'Warenkorb erfolgreich abgerufen', cart: { ...cart, items: items || [] } };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen des Warenkorbs:', error);
    return { success: false, message: error.message, cart: null };
  }
};

/**
 * Produkt zum Warenkorb hinzufügen
 * @param {string} userId - ID des Benutzers
 * @param {Object} itemData - Daten des hinzuzufügenden Items
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
export const addToCart = async (userId, itemData) => {
  try {
    if (!userId || !itemData.product_id) {
      return { success: false, message: 'Benutzer-ID oder Produkt-ID fehlt' };
    }
    
    // Warenkorb abrufen oder erstellen
    const { success, cart } = await getCart(userId);
    
    if (!success || !cart) {
      return { success: false, message: 'Warenkorb konnte nicht abgerufen werden' };
    }
    
    // Produkt-Details abrufen für den Preis
    const product = await getProductById(itemData.product_id);
    
    if (!product) {
      return { success: false, message: 'Produkt nicht gefunden' };
    }
    
    const quantity = itemData.quantity || 1;
    const price = product.price;
    const total_price = price * quantity;
    
    // Prüfen, ob das Produkt bereits im Warenkorb ist
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', itemData.product_id)
      .single();
      
    if (existingItemError && existingItemError.code !== 'PGRST116') {
      console.error('Fehler beim Prüfen vorhandener Warenkorb-Items:', existingItemError);
    }
    
    let result;
    
    // Preis der Extras berechnen
    let extrasCost = 0;
    if (itemData.customization && itemData.customization.extras && itemData.customization.extras.length > 0) {
      extrasCost = itemData.customization.extras.reduce((sum, extra) => sum + extra.price, 0);
    }
    
    // Gesamtpreis mit Extras berechnen
    const itemPrice = price + extrasCost;
    const itemTotalPrice = itemPrice * quantity;
    
    // Anpassungsdetails als JSON speichern
    const customizationData = itemData.customization || {};
    
    if (existingItem) {
      // Bei existierendem Item einfach ein neues anlegen, da Anpassungen anders sein können
      // Neues Item hinzufügen
      result = await supabase
        .from('cart_items')
        .insert([
          {
            cart_id: cart.id,
            product_id: itemData.product_id,
            quantity: quantity,
            price: itemPrice,
            total_price: itemTotalPrice,
            notes: itemData.notes || '',
            customization: customizationData
          }
        ])
        .select();
    } else {
      // Neues Item hinzufügen
      result = await supabase
        .from('cart_items')
        .insert([
          {
            cart_id: cart.id,
            product_id: itemData.product_id,
            quantity: quantity,
            price: itemPrice,
            total_price: itemTotalPrice,
            notes: itemData.notes || '',
            customization: customizationData
          }
        ])
        .select();
    }
    
    const { error: resultError } = result;
    
    if (resultError) {
      console.error('Fehler beim Hinzufügen zum Warenkorb:', resultError);
      return { success: false, message: resultError.message };
    }
    
    // Gesamtbetrag des Warenkorbs aktualisieren
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('total_price')
      .eq('cart_id', cart.id);
      
    const newTotalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);
    
    await supabase
      .from('carts')
      .update({ total_amount: newTotalAmount })
      .eq('id', cart.id);
    
    return { success: true, message: 'Produkt erfolgreich zum Warenkorb hinzugefügt' };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Hinzufügen zum Warenkorb:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Item aus dem Warenkorb entfernen
 * @param {string} userId - ID des Benutzers
 * @param {string} itemId - ID des zu entfernenden Items
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
export const removeFromCart = async (userId, itemId) => {
  try {
    if (!userId || !itemId) {
      return { success: false, message: 'Benutzer-ID oder Item-ID fehlt' };
    }
    
    // Warenkorb abrufen
    const { success, cart } = await getCart(userId);
    
    if (!success || !cart) {
      return { success: false, message: 'Warenkorb konnte nicht abgerufen werden' };
    }
    
    // Item entfernen
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cart.id);
      
    if (error) {
      console.error('Fehler beim Entfernen aus dem Warenkorb:', error);
      return { success: false, message: error.message };
    }
    
    // Gesamtbetrag des Warenkorbs aktualisieren
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('total_price')
      .eq('cart_id', cart.id);
      
    const newTotalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);
    
    await supabase
      .from('carts')
      .update({ total_amount: newTotalAmount })
      .eq('id', cart.id);
    
    return { success: true, message: 'Produkt erfolgreich aus dem Warenkorb entfernt' };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Entfernen aus dem Warenkorb:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Warenkorb leeren
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
export const clearCart = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'Keine Benutzer-ID angegeben' };
    }
    
    // Warenkorb abrufen
    const { success, cart } = await getCart(userId);
    
    if (!success || !cart) {
      return { success: false, message: 'Warenkorb konnte nicht abgerufen werden' };
    }
    
    // Alle Items löschen
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);
      
    if (error) {
      console.error('Fehler beim Leeren des Warenkorbs:', error);
      return { success: false, message: error.message };
    }
    
    // Gesamtbetrag zurücksetzen
    await supabase
      .from('carts')
      .update({ total_amount: 0 })
      .eq('id', cart.id);
    
    return { success: true, message: 'Warenkorb erfolgreich geleert' };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Leeren des Warenkorbs:', error);
    return { success: false, message: error.message };
  }
}; 