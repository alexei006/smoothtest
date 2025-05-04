'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser, loginWithGoogle } from '../lib/authService';
import { getCustomerByUserId, createOrUpdateCustomer } from '../lib/profileService';
import supabase from '../lib/supabase';

// Typdefinitionen
export interface User {
  id: string;
  email: string;
  app_metadata?: any;
  user_metadata?: any;
}

export interface Customer {
  user_id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  plz: string;
  postal_code: string;
  address: string;
  phone: string;
  is_premium_member: boolean;
  newsletter_subscribed: boolean;
  newsletter_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  plz?: string;
  address?: string;
  phoneNumber?: string;
  newsletter?: boolean;
  confirmPassword?: string; // Für Client-Validierung
}

export interface AuthContextType {
  user: User | null;
  customerData: Customer | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (userData: RegisterData) => Promise<User | null>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  setCustomerData: (data: Customer | null) => void;
  refreshCustomerData: () => Promise<RefreshCustomerResult>;
}

export interface RefreshCustomerResult {
  success: boolean;
  message?: string;
  customer?: Customer;
  error?: any;
}

interface AuthProviderProps {
  children: ReactNode;
}

// AuthContext erstellen mit DefaultValue
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider-Komponente
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Beim Laden der Komponente den aktuellen Benutzer abrufen
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Wenn ein Benutzer angemeldet ist, lade seine Kundendaten
        if (currentUser) {
          try {
            const { success, customer } = await getCustomerByUserId(currentUser.id);
            if (success && customer) {
              setCustomerData(customer);
            }
          } catch (customerError) {
            console.error('Fehler beim Laden der Kundendaten:', customerError);
          }
        }
      } catch (err: any) {
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
        if (event === 'SIGNED_IN' && session) {
          // Wenn ein Benutzer sich anmeldet, aktualisiere den Benutzer und die Kundendaten
          const newUser = session.user;
          setUser(newUser);
          
          // Kundendaten abrufen
          try {
            const { success, customer } = await getCustomerByUserId(newUser.id);
            if (success && customer) {
              setCustomerData(customer);
            } else {
              // Bei OAuth-Anmeldungen müssen wir sicherstellen, dass ein Kundeneintrag existiert
              const isOAuthUser = newUser.app_metadata?.provider && 
                                newUser.app_metadata.provider !== 'email';
              
              if (isOAuthUser) {
                try {
                  const customerData = {
                    name: newUser.user_metadata?.full_name || newUser.user_metadata?.name || 'Kunde',
                    email: newUser.email,
                    plz: newUser.user_metadata?.plz || '',
                    address: newUser.user_metadata?.address || '',
                    phone: newUser.user_metadata?.phone || newUser.user_metadata?.phoneNumber || '',
                    is_premium_member: false
                  };
                  
                  await createOrUpdateCustomer(customerData, newUser.id);
                  
                  // Erneut versuchen, Kundendaten zu laden
                  const { success, customer } = await getCustomerByUserId(newUser.id);
                  if (success && customer) {
                    setCustomerData(customer);
                  }
                } catch (createError) {
                  console.error('Fehler beim Erstellen des Kundeneintrags:', createError);
                }
              }
            }
          } catch (customerError) {
            console.error('Fehler beim Laden der Kundendaten nach Anmeldung:', customerError);
          }
        } else if (event === 'SIGNED_OUT') {
          // Wenn ein Benutzer sich abmeldet, setze den Benutzer und die Kundendaten zurück
          setUser(null);
          setCustomerData(null);
        }
      }
    );
    
    // Cleanup-Funktion
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Anmelden
  const login = async (credentials: LoginCredentials): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const { user: authUser } = await loginUser(credentials);
      setUser(authUser);
      
      // Kundendaten nach dem Login abrufen
      if (authUser) {
        try {
          const { success, customer } = await getCustomerByUserId(authUser.id);
          if (success && customer) {
            setCustomerData(customer);
          } else {
            setCustomerData(null);
          }
        } catch (customerError) {
          console.error('Fehler beim Laden der Kundendaten nach Login:', customerError);
        }
      }
      
      return authUser;
    } catch (err: any) {
      console.error('Login-Fehler:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registrieren
  const register = async (userData: RegisterData): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser(userData);
      
      const authUser = result.user;
      
      if (authUser) {
        setUser(authUser);
        
        // Sofort manuell customerData setzen, ohne auf Datenbank zu warten
        const directCustomerData: Customer = {
          user_id: authUser.id,
          name: userData.name || 'Kunde',
          email: userData.email,
          plz: userData.plz || '',
          address: userData.address || '',
          phone: userData.phoneNumber || '',
          is_premium_member: false,
          newsletter_subscribed: userData.newsletter || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCustomerData(directCustomerData);
        
        return authUser;
      } else {
        throw new Error('Registrierung war erfolgreich, aber kein Benutzer wurde zurückgegeben');
      }
    } catch (err: any) {
      console.error('Registrierungsfehler im AuthContext:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Abmelden
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setCustomerData(null);
    } catch (err: any) {
      console.error('Logout-Fehler:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Mit Google anmelden
  const loginWithGoogleProvider = async (): Promise<void> => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google-Login-Fehler:', err);
      setError(err.message);
      throw err;
    }
  };

  const refreshCustomerData = async (): Promise<RefreshCustomerResult> => {
    if (!user) {
      return { success: false, message: 'Kein Benutzer angemeldet' };
    }
    
    try {
      const result = await getCustomerByUserId(user.id);
      if (result.success && result.customer) {
        // Nur aktualisieren, wenn sich die Daten tatsächlich geändert haben
        if (!customerData || JSON.stringify(customerData) !== JSON.stringify(result.customer)) {
          setCustomerData(result.customer);
        }
        return { 
          success: true, 
          customer: result.customer,
          message: 'Kundendaten erfolgreich aktualisiert' 
        };
      }
      return { 
        success: false, 
        message: result.message || 'Kunde nicht gefunden' 
      };
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Kundendaten:', error);
      return { 
        success: false, 
        message: error.message || 'Unbekannter Fehler',
        error 
      };
    }
  };

  const value: AuthContextType = {
    user,
    customerData,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle: loginWithGoogleProvider,
    setCustomerData,
    refreshCustomerData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook für den einfachen Zugriff auf den Auth-Kontext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
}; 