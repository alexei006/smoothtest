'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase-client';
import { Toaster, toast } from 'react-hot-toast';

// Interface für RegisterData aus dem AuthContext
interface RegisterData {
  email: string;
  password: string;
  name: string;
  plz?: string;
  address?: string;
  phoneNumber?: string;
  newsletter?: boolean;
  confirmPassword?: string;
}

// Separater Client-Komponente für das Abrufen von URL-Parametern
import { useSearchParams } from 'next/navigation';

function RegisterForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    plz: '',
    address: '',
    phoneNumber: '',
    newsletter: false,
    referralCode: refCode || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = useAuth() as any;

  useEffect(() => {
    // Prüfe den Referral-Code, wenn vorhanden
    if (formData.referralCode) {
      validateReferralCode(formData.referralCode);
    }
  }, []);

  const validateReferralCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        console.error('Fehler bei der Validierung des Referral-Codes:', error);
        setReferralValid(false);
        return false;
      }

      if (data) {
        setReferralValid(true);
        return true;
      } else {
        setReferralValid(false);
        return false;
      }
    } catch (err) {
      console.error('Fehler bei der Validierung des Referral-Codes:', err);
      setReferralValid(false);
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Überprüfe den Referral-Code bei Änderungen
    if (name === 'referralCode' && value !== '') {
      validateReferralCode(value);
    } else if (name === 'referralCode' && value === '') {
      setReferralValid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validierung
    if (!formData.email || !formData.password || !formData.name) {
      setError('Bitte füllen Sie alle Pflichtfelder aus (Name, E-Mail, Passwort)');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Register-Funktion aus dem Auth-Context aufrufen mit any-Typumwandlung
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        plz: formData.plz,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        newsletter: formData.newsletter
      };
      
      // Überprüfe, ob register als Funktion verfügbar ist
      if (auth && typeof auth.register === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await auth.register(userData);
        
        // Wenn ein gültiger Referral-Code vorhanden ist, verarbeite ihn
        if (user && formData.referralCode && referralValid) {
          // Wir rufen die Funktion auf, um die Empfehlung zu verarbeiten
          const { data, error } = await supabase.rpc(
            'process_referral',
            { 
              referral_code: formData.referralCode,
              new_customer_id: user.id
            }
          );
          
          if (error) {
            console.error('Fehler bei der Verarbeitung des Referral-Codes:', error);
          } else if (data) {
            toast.success('Willkommensrabatt für deine erste Bestellung aktiviert!');
          }
        }
        
        router.push('/');
      } else {
        setError('Register-Funktion nicht verfügbar');
      }
    } catch (err: any) {
      console.error('Registrierungsfehler:', err);
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Toaster position="top-right" />
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-teal-600 text-white py-4 px-6">
          <h2 className="text-2xl font-bold">Registrieren</h2>
          <p className="text-teal-100">Erstelle dein Smooth Bowl Konto</p>
        </div>
        
        <form onSubmit={handleSubmit} className="py-6 px-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Vor- und Nachname"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              E-Mail *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="name@beispiel.de"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Passwort *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="••••••••"
              required
            />
            <p className="text-gray-600 text-xs mt-1">Mindestens 6 Zeichen</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Passwort bestätigen *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
              Adresse
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Straße, Hausnummer"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="plz" className="block text-gray-700 text-sm font-bold mb-2">
              Postleitzahl
            </label>
            <input
              type="text"
              id="plz"
              name="plz"
              value={formData.plz}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="PLZ"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">
              Telefonnummer
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Telefonnummer für Lieferungen"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="referralCode" className="block text-gray-700 text-sm font-bold mb-2">
              Empfehlungscode (optional)
            </label>
            <input
              type="text"
              id="referralCode"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                referralValid === true ? 'border-green-500' : referralValid === false ? 'border-red-500' : ''
              }`}
              placeholder="CODE123"
            />
            {referralValid === true && (
              <p className="text-green-600 text-xs mt-1">Gültiger Empfehlungscode!</p>
            )}
            {referralValid === false && (
              <p className="text-red-600 text-xs mt-1">Ungültiger Empfehlungscode</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm">
                Ich möchte den Newsletter abonnieren
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Registrierung...' : 'Registrieren'}
            </button>
            <Link href="/auth/login" className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800">
              Bereits registriert?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Hauptkomponente mit Suspense-Wrapper
export default function Register() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 text-center">Lädt...</div>}>
      <RegisterForm />
    </Suspense>
  );
} 