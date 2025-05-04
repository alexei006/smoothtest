import supabase from './supabase';

/**
 * Kundendaten anhand der Benutzer-ID abrufen
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Object>} - Ergebnis der Abfrage
 */
export const getCustomerByUserId = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'Keine Benutzer-ID angegeben', customer: null };
    }
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Fehler beim Abrufen der Kundendaten:', error);
      return { success: false, message: error.message, customer: null };
    }
    
    // Füge berechnetes Name-Feld für die Rückwärtskompatibilität hinzu
    if (data) {
      data.name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      
      // Stelle sicher, dass newsletter_subscribed für die Rückwärtskompatibilität gesetzt ist
      data.newsletter_subscribed = data.newsletter_opt_in;
    }
    
    return { success: true, message: 'Kundendaten erfolgreich abgerufen', customer: data };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Kundendaten:', error);
    return { success: false, message: error.message, customer: null };
  }
};

/**
 * Kundendaten erstellen oder aktualisieren
 * @param {Object} customerData - Kundendaten
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
export const createOrUpdateCustomer = async (customerData, userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'Keine Benutzer-ID angegeben', customer: null };
    }
    
    // Debug-Ausgabe der empfangenen Daten
    console.log('Empfangene Kundendaten:', customerData);
    
    // Prüfen, ob Kunde bereits existiert
    const { customer: existingCustomer } = await getCustomerByUserId(userId);
    
    // Verarbeite Name-Feld, wenn vorhanden
    let firstName = customerData.first_name;
    let lastName = customerData.last_name;
    
    if (customerData.name && !firstName && !lastName) {
      const nameParts = customerData.name.split(' ');
      if (nameParts.length > 1) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = customerData.name;
        lastName = '';
      }
    }
    
    // PLZ aus den verschiedenen möglichen Quellen holen
    const plzValue = customerData.postal_code || customerData.plz || '';
    console.log('Verwendete PLZ:', plzValue);
    
    // Newsletter-Opt-In-Status konvertieren
    const newsletter_opt_in = customerData.newsletter_opt_in !== undefined 
      ? customerData.newsletter_opt_in 
      : customerData.newsletter_subscribed;
    
    if (existingCustomer) {
      // Kunde aktualisieren
      const { data, error } = await supabase
        .from('customers')
        .update({
          first_name: firstName || existingCustomer.first_name || '',
          last_name: lastName || existingCustomer.last_name || '',
          name: customerData.name || existingCustomer.name || `${firstName || existingCustomer.first_name || ''} ${lastName || existingCustomer.last_name || ''}`.trim(),
          email: customerData.email || existingCustomer.email,
          postal_code: plzValue || existingCustomer.postal_code || null,
          address: customerData.address || existingCustomer.address,
          phone: customerData.phone || existingCustomer.phone,
          is_premium_member: customerData.is_premium_member !== undefined 
            ? customerData.is_premium_member 
            : existingCustomer.is_premium_member,
          newsletter_opt_in: newsletter_opt_in !== undefined 
            ? newsletter_opt_in 
            : existingCustomer.newsletter_opt_in,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Fehler beim Aktualisieren der Kundendaten:', error);
        return { success: false, message: error.message, customer: null };
      }
      
      // Füge berechnetes Name-Feld hinzu
      if (data) {
        data.name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        data.newsletter_subscribed = data.newsletter_opt_in;
      }
      
      return { success: true, message: 'Kundendaten erfolgreich aktualisiert', customer: data };
    } else {
      // Neuen Kunden erstellen
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            id: userId,
            user_id: userId,
            name: `${firstName || 'Kunde'} ${lastName || ''}`.trim(),
            first_name: firstName || 'Kunde',
            last_name: lastName || '',
            email: customerData.email || '',
            postal_code: plzValue || null,
            address: customerData.address || '',
            phone: customerData.phone || '',
            is_premium_member: customerData.is_premium_member || false,
            newsletter_opt_in: newsletter_opt_in || false
          }
        ])
        .select()
        .single();
        
      if (error) {
        console.error('Fehler beim Erstellen des Kundenprofils:', error);
        return { success: false, message: error.message, customer: null };
      }
      
      // Füge berechnetes Name-Feld hinzu
      if (data) {
        data.name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        data.newsletter_subscribed = data.newsletter_opt_in;
      }
      
      return { success: true, message: 'Kundenprofil erfolgreich erstellt', customer: data };
    }
  } catch (error) {
    console.error('Unerwarteter Fehler beim Bearbeiten der Kundendaten:', error);
    return { success: false, message: error.message, customer: null };
  }
}; 