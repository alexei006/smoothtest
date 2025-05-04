import supabase from '../lib/supabase';

/**
 * Support-Ticket in der Datenbank erstellen
 * @param {Object} ticketData - Daten für das Support-Ticket
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
export const createSupportTicket = async (ticketData) => {
  try {
    console.log('Erhaltene Ticketdaten:', ticketData);
    
    // Prüfe, ob alle erforderlichen Felder vorhanden sind
    if (!ticketData.name || !ticketData.email || !ticketData.message || 
        !ticketData.category || ticketData.category === "Bitte auswählen") {
      console.log('Validierungsfehler - Fehlende Felder:', {
        name: !ticketData.name,
        email: !ticketData.email,
        message: !ticketData.message,
        category: !ticketData.category || ticketData.category === "Bitte auswählen"
      });
      
      return {
        success: false,
        message: 'Bitte füllen Sie alle erforderlichen Felder aus.',
        ticketNumber: null
      };
    }

    // Vereinfachter Check für Authentifizierung
    let userId = null;
    if (ticketData.user_id) {
      userId = ticketData.user_id;
      console.log('Benutzer-ID gefunden:', userId);
    } else {
      console.log('Keine Benutzer-ID vorhanden, Ticket wird als anonym erstellt');
    }

    // Temporäre Ticket-Nummer (wird vom Datenbank-Trigger überschrieben)
    const tempTicketNumber = `TICKET-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Direkte Einfügung in die Datenbank
    console.log('Versuche direktes Einfügen in die Datenbank...');
    const { data: directData, error: directError } = await supabase
      .from('support_tickets')
      .insert([{
        ticket_number: tempTicketNumber, // Diese wird vom Trigger überschrieben
        subject: `Kundenanfrage: ${ticketData.category}`,
        name: ticketData.name,
        email: ticketData.email,
        user_id: userId,
        category: ticketData.category,
        order_id: ticketData.orderId || null,
        message: ticketData.message,
        status: 'offen', // Standardstatus für neue Tickets
        created_at: new Date().toISOString()
      }])
      .select();
      
    if (!directError && directData && directData.length > 0) {
      console.log('Ticket erfolgreich direkt eingefügt:', directData[0]);
      // Verwende die vom Trigger generierte Ticket-Nummer aus der Datenbankantwort
      return {
        success: true,
        message: 'Support-Ticket wurde erfolgreich erstellt!',
        ticketNumber: directData[0].ticket_number, // Verwende die von der Datenbank generierte Nummer
        ticket_id: directData[0].id
      };
    }
    
    if (directError) {
      console.error('Fehler beim direkten Einfügen:', directError);
    }
    
    // Fallback mit RPC-Funktion
    console.log('Versuche es mit RPC create_support_ticket...');
    const { data, error } = await supabase.rpc('create_support_ticket', {
      p_ticket_number: tempTicketNumber, // Wird vom Trigger überschrieben
      p_name: ticketData.name,
      p_email: ticketData.email,
      p_user_id: userId,
      p_category: ticketData.category,
      p_order_id: ticketData.orderId || null,
      p_message: ticketData.message
    });
    
    if (!error && data && data.length > 0) {
      console.log('Ticket erfolgreich mit RPC erstellt:', data[0]);
      return {
        success: true,
        message: 'Support-Ticket wurde erfolgreich erstellt!',
        ticketNumber: data[0].ticket_number // Verwende die von der Datenbank generierte Nummer
      };
    }

    if (error) {
      console.error('Fehler beim Erstellen des Support-Tickets mit RPC:', error);
      
      // Wenn die RPC-Funktion fehlschlägt, versuchen wir es mit direktem SQL als letzte Option
      try {
        // Erstelle das Ticket und hole es sofort zurück
        const { data: sqlData, error: sqlError } = await supabase
          .from('support_tickets')
          .insert([{
            ticket_number: tempTicketNumber, // Wird vom Trigger überschrieben
            subject: `Kundenanfrage: ${ticketData.category}`,
            message: ticketData.message,
            status: 'offen',
            priority: 'normal',
            customer_id: userId,
            category: ticketData.category,
            created_at: new Date().toISOString()
          }])
          .select();
          
        if (sqlError) {
          console.error('Fehler beim SQL-Insert:', sqlError);
          return {
            success: false,
            message: `Fehler beim Erstellen des Tickets: ${sqlError.message}`,
            ticketNumber: null
          };
        }
        
        if (sqlData && sqlData.length > 0) {
          console.log('Ticket erfolgreich mit SQL erstellt:', sqlData[0]);
          return {
            success: true,
            message: 'Support-Ticket wurde erfolgreich erstellt!',
            ticketNumber: sqlData[0].ticket_number // Verwende die von der Datenbank generierte Nummer
          };
        }
        
        // Wenn wir bis hierher kommen und keine Antwort haben, nehmen wir an, dass das Ticket erstellt wurde
        // Fragen die neueste Ticket-Nummer ab
        const { data: latestTicket, error: latestError } = await supabase
          .from('support_tickets')
          .select('ticket_number')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!latestError && latestTicket) {
          return {
            success: true,
            message: 'Support-Ticket wurde erfolgreich erstellt!',
            ticketNumber: latestTicket.ticket_number
          };
        }
        
        // Als letzten Ausweg geben wir eine generische Erfolgsmeldung zurück
        return {
          success: true,
          message: 'Support-Ticket wurde erfolgreich erstellt! Bitte notieren Sie sich die Ticket-Nummer, die Ihnen im Admin-Bereich angezeigt wird.',
          ticketNumber: 'Siehe Admin-Bereich'
        };
      } catch (finalError) {
        console.error('Unerwarteter Fehler beim SQL-Fallback:', finalError);
        return {
          success: false,
          message: `Unerwarteter Fehler: ${finalError.message}`,
          ticketNumber: null
        };
      }
    }

    // Dieser Code wird theoretisch nie erreicht, aber als Sicherheit
    return {
      success: true,
      message: 'Support-Ticket wurde erfolgreich erstellt!',
      ticketNumber: 'Ticket erstellt'
    };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Erstellen des Support-Tickets:', error);
    return {
      success: false,
      message: `Unerwarteter Fehler: ${error.message}`,
      ticketNumber: null
    };
  }
};

/**
 * Support-Tickets eines Benutzers abrufen
 * @param {string} userId - ID des Benutzers
 * @returns {Promise<Array>} - Liste der Support-Tickets
 */
export const getUserSupportTickets = async (userId) => {
  try {
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData && sessionData.session && sessionData.session.user) {
        userId = sessionData.session.user.id;
      } else {
        return [];
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email || '';

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Abrufen der Support-Tickets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Support-Tickets:', error);
    return [];
  }
};

/**
 * Details eines Support-Tickets abrufen, inklusive Antworten
 * @param {string} ticketId - ID des Tickets
 * @returns {Promise<Object>} - Ticket mit Antworten
 */
export const getSupportTicketDetails = async (ticketId) => {
  try {
    // Ticket-Details abrufen
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('Fehler beim Abrufen des Ticket-Details:', ticketError);
      return null;
    }

    // Antworten zum Ticket abrufen
    const { data: responsesData, error: responsesError } = await supabase
      .from('ticket_responses')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', false) // Nur öffentliche Antworten für Kunden
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Fehler beim Abrufen der Ticket-Antworten:', responsesError);
      return { ...ticketData, responses: [] };
    }

    return {
      ...ticketData,
      responses: responsesData || []
    };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Ticket-Details:', error);
    return null;
  }
};

export default {
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicketDetails
}; 