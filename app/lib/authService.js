import supabase from './supabase';

/**
 * Aktuellen Benutzer abrufen
 * @returns {Promise<Object|null>} - Benutzerobjekt oder null
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Fehler beim Abrufen des Benutzers:', error);
      return null;
    }
    
    return data?.user || null;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen des Benutzers:', error);
    return null;
  }
};

/**
 * Benutzeranmeldung mit E-Mail und Passwort
 * @param {Object} credentials - Anmeldedaten mit email und password
 * @returns {Promise<Object>} - Ergebnis der Anmeldung
 */
export const loginUser = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error);
    throw new Error(error.message || 'Anmeldung fehlgeschlagen');
  }
};

/**
 * Benutzerregistrierung
 * @param {Object} userData - Benutzerdaten mit email, password und weiteren Informationen
 * @returns {Promise<Object>} - Ergebnis der Registrierung
 */
export const registerUser = async (userData) => {
  try {
    const { 
      email, 
      password, 
      name, 
      plz, 
      address, 
      phoneNumber, 
      newsletter,
      referralCode 
    } = userData;
    
    // Teile den Namen in Vor- und Nachname auf
    let firstName = '';
    let lastName = '';
    
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = name;
      }
    }
    
    // Benutzer bei Supabase registrieren
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          postal_code: plz,
          address,
          phoneNumber,
          newsletter: !!newsletter,
          referralCode
        }
      }
    });
    
    if (error) {
      throw error;
    }
    
    // Kundendaten in der Datenbank speichern
    if (data.user) {
      const { error: profileError } = await supabase
        .from('customers')
        .insert([
          {
            id: data.user.id,
            first_name: firstName || 'Kunde',
            last_name: lastName || '',
            email: email,
            postal_code: plz || '',
            address: address || '',
            phone: phoneNumber || '',
            is_premium_member: false,
            newsletter_opt_in: !!newsletter
          }
        ]);
        
      if (profileError) {
        console.error('Fehler beim Speichern der Kundendaten:', profileError);
      }
    }
    
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    throw new Error(error.message || 'Registrierung fehlgeschlagen');
  }
};

/**
 * Benutzerabmeldung
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    // Zuerst einen lokalen Bereinigungsversuch durchführen
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
    // Dann versuchen, die Supabase-Sitzung zu beenden
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase Signout Fehler:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Fehler bei der Abmeldung:', error);
    // Wir geben trotzdem Erfolg zurück, damit die UI den Benutzer abmelden kann
    return { success: true, localOnly: true };
  }
};

/**
 * Google OAuth-Anmeldung
 * @returns {Promise<void>}
 */
export const loginWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Fehler bei der Google-Anmeldung:', error);
    throw new Error(error.message || 'Google-Anmeldung fehlgeschlagen');
  }
}; 