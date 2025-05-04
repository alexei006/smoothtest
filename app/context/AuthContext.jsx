import { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser, loginWithGoogle } from '../services/authService';
import { getCustomerByUserId, createOrUpdateCustomer } from '../services/profileService';
import supabase from '../lib/supabase';

// AuthContext erstellen
const AuthContext = createContext(null);

// AuthProvider-Komponente
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Beim Laden der Komponente den aktuellen Benutzer abrufen
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('Aktueller Benutzer beim Laden:', currentUser);
        setUser(currentUser);
        
        // Wenn ein Benutzer angemeldet ist, lade seine Kundendaten
        if (currentUser) {
          try {
            const { success, customer } = await getCustomerByUserId(currentUser.id);
            if (success && customer) {
              console.log('Kundendaten geladen:', customer);
              setCustomerData(customer);
            } else {
              console.warn('Keine Kundendaten gefunden für Benutzer:', currentUser.id);
            }
          } catch (customerError) {
            console.error('Fehler beim Laden der Kundendaten:', customerError);
          }
        }
      } catch (err) {
        console.error('Fehler beim Abrufen des Benutzers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    
    // Supabase Auth-Änderungs-Listener hinzufügen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth-Status geändert:', event);
        console.log('Session vorhanden:', !!session);
        
        if (session?.user) {
          console.log('Benutzer-Email:', session.user.email);
          console.log('Benutzer-ID:', session.user.id);
          console.log('Auth-Provider:', session.user.app_metadata?.provider);
          console.log('User Metadaten:', session.user.user_metadata);
        }
        
        if (event === 'SIGNED_IN') {
          // Wenn ein Benutzer sich anmeldet, aktualisiere den Benutzer und die Kundendaten
          const newUser = session.user;
          console.log('Benutzer angemeldet:', newUser.email);
          setUser(newUser);
          
          // Nach kurzer Verzögerung Kundendaten abrufen
          setTimeout(async () => {
            try {
              const { success, customer } = await getCustomerByUserId(newUser.id);
              if (success && customer) {
                console.log('Kundendaten nach Anmeldung geladen:', customer);
                setCustomerData(customer);
              } else {
                console.warn('Keine Kundendaten nach Anmeldung gefunden');
                
                // Bei OAuth-Anmeldungen müssen wir sicherstellen, dass ein Kundeneintrag existiert
                const isOAuthUser = newUser.app_metadata?.provider && 
                                  newUser.app_metadata.provider !== 'email';
                
                if (isOAuthUser) {
                  console.log('OAuth-Benutzer erkannt, erstelle Kundeneintrag...');
                  
                  try {
                    const customerData = {
                      name: newUser.user_metadata?.full_name || newUser.user_metadata?.name || 'Kunde',
                      email: newUser.email,
                      plz: newUser.user_metadata?.plz || '',
                      address: newUser.user_metadata?.address || '',
                      phone: newUser.user_metadata?.phone || newUser.user_metadata?.phoneNumber || '',
                      is_premium_member: false
                    };
                    
                    const createResult = await createOrUpdateCustomer(customerData, newUser.id);
                    console.log('Kundeneintrag erstellt:', createResult);
                    
                    // Erneut versuchen, Kundendaten zu laden
                    const { success, customer } = await getCustomerByUserId(newUser.id);
                    if (success && customer) {
                      console.log('Kundendaten nach Erstellung geladen:', customer);
                      setCustomerData(customer);
                    } else {
                      console.error('Konnte keine Kundendaten nach Erstellung finden!');
                    }
                  } catch (createError) {
                    console.error('Fehler beim Erstellen des Kundeneintrags:', createError);
                  }
                }
              }
            } catch (customerError) {
              console.error('Fehler beim Laden der Kundendaten nach Anmeldung:', customerError);
            }
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          // Wenn ein Benutzer sich abmeldet, setze den Benutzer und die Kundendaten zurück
          console.log('Benutzer abgemeldet');
          setUser(null);
          setCustomerData(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth-Token wurde aktualisiert');
        } else if (event === 'USER_UPDATED') {
          console.log('Benutzerdaten wurden aktualisiert');
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Passwort-Wiederherstellung eingeleitet');
        } else if (event === 'USER_DELETED') {
          console.log('Benutzer wurde gelöscht');
          setUser(null);
          setCustomerData(null);
        }
      }
    );
    
    // Cleanup-Funktion
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Anmelden
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Login-Versuch mit:', credentials.email);
      const { user: authUser } = await loginUser(credentials);
      console.log('Login erfolgreich, Benutzer:', authUser);
      setUser(authUser);
      
      // Kundendaten nach dem Login abrufen
      if (authUser) {
        try {
          const { success, customer } = await getCustomerByUserId(authUser.id);
          if (success && customer) {
            console.log('Kundendaten nach Login geladen:', customer);
            setCustomerData(customer);
          } else {
            console.warn('Keine Kundendaten gefunden nach Login');
            setCustomerData(null);
          }
        } catch (customerError) {
          console.error('Fehler beim Laden der Kundendaten nach Login:', customerError);
        }
      }
      
      return authUser;
    } catch (err) {
      console.error('Login-Fehler:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registrieren
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Registrierungsversuch mit:', {
        email: userData.email,
        name: userData.name,
        plz: userData.plz,
        address: userData.address,
        phoneNumber: userData.phoneNumber
      });
      
      const result = await registerUser(userData);
      console.log('Registrierungsergebnis von authService:', result);
      
      const authUser = result.user;
      console.log('Neuer Benutzer nach Registrierung:', authUser);
      
      if (authUser) {
        setUser(authUser);
        
        // Sofort manuell customerData setzen, ohne auf Datenbank zu warten
        console.log('Setze customerData direkt aus den Registrierungsdaten');
        
        // Umwandlung von phoneNumber zu phone für Konsistenz mit DB-Schema
        const directCustomerData = {
          user_id: authUser.id,
          name: userData.name || 'Kunde',
          email: userData.email,
          plz: userData.plz || '',
          address: userData.address || '',
          phone: userData.phoneNumber || '',  // Wichtig: phoneNumber wird zu phone
          is_premium_member: false,
          newsletter_subscribed: userData.newsletter || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Direkt gesetztes customerData:', directCustomerData);
        setCustomerData(directCustomerData);
        
        // Trotzdem versuchen, in die Datenbank zu schreiben (im Hintergrund)
        try {
          // Kurze Verzögerung
          await new Promise(resolve => setTimeout(resolve, 500)); 
          
          console.log('Versuche dennoch Kundendaten in Datenbank zu speichern...');
          const { success, customer } = await getCustomerByUserId(authUser.id);
          
          if (success && customer) {
            console.log('Kundendaten wurden doch in der Datenbank gefunden:', customer);
            setCustomerData(customer);
          }
        } catch (customerError) {
          console.error('Fehler beim Laden der Kundendaten nach Registrierung:', customerError);
          // Bleibt bei den manuell gesetzten Daten
        }
        
        return authUser;
      } else {
        console.error('Registrierung abgeschlossen, aber kein gültiges Benutzerobjekt erhalten.');
        throw new Error('Registrierung war erfolgreich, aber kein Benutzer wurde zurückgegeben');
      }
    } catch (err) {
      console.error('Registrierungsfehler im AuthContext:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Abmelden
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Abmeldeversuch für Benutzer:', user?.id);
      
      // logoutUser kann jetzt auch bei Fehler Erfolg zurückgeben
      const result = await logoutUser();
      console.log('Abmeldeergebnis:', result);
      
      // Benutzer- und Kundendaten zurücksetzen
      setUser(null);
      setCustomerData(null);
      
      return { success: true };
    } catch (err) {
      console.error('Abmeldefehler im AuthContext:', err);
      setError(err.message);
      
      // Trotzdem lokale Daten zurücksetzen
      setUser(null);
      setCustomerData(null);
      
      return { success: true, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogleProvider = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Google Login-Versuch');
      const result = await loginWithGoogle();
      console.log('Google Login initiiert:', result);
      // Bei OAuth wird der Nutzer umgeleitet, daher kein direktes Setzen von user
      return result;
    } catch (err) {
      console.error('Google Login-Fehler:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Kundendaten manuell aktualisieren
  const refreshCustomerData = async () => {
    try {
      if (!user) {
        console.warn('Keine Aktualisierung der Kundendaten möglich: Kein Benutzer angemeldet');
        return { success: false, message: 'Kein Benutzer angemeldet' };
      }
      
      console.log('Aktualisiere Kundendaten für Benutzer:', user.id);
      const { success, customer, message } = await getCustomerByUserId(user.id);
      
      if (success && customer) {
        console.log('Kundendaten erfolgreich aktualisiert:', customer);
        setCustomerData(customer);
        return { success: true, message: 'Kundendaten aktualisiert' };
      } else {
        console.warn('Fehler beim Aktualisieren der Kundendaten:', message);
        return { success: false, message };
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kundendaten:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    customerData,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle: loginWithGoogleProvider,
    isAuthenticated: !!user,
    refreshCustomerData,
    setUser,
    setCustomerData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook zum einfachen Zugriff auf den AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
};

export default AuthContext; 