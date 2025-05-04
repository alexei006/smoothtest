'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function Register() {
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
              Einladungscode (optional)
            </label>
            <div className="relative">
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  referralValid === true ? 'border-green-500' : 
                  referralValid === false ? 'border-red-500' : ''
                }`}
                placeholder="Hast du einen Einladungscode?"
              />
              {referralValid === true && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {referralValid === false && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {referralValid === true && (
              <p className="text-green-600 text-xs mt-1">Gültiger Code! Du erhältst 10€ Rabatt auf deine erste Bestellung.</p>
            )}
            {referralValid === false && (
              <p className="text-red-600 text-xs mt-1">Ungültiger Einladungscode.</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <span className="text-sm">
                Ich möchte den Newsletter erhalten und über Angebote informiert werden
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <button
              type="submit"
              disabled={loading}
              className={`bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Registriere...' : 'Registrieren'}
            </button>
          </div>
          
          <p className="text-center text-gray-600 text-sm">
            Bereits ein Konto?{' '}
            <Link
              href="/auth/login"
              className="text-teal-600 hover:text-teal-800 font-semibold"
            >
              Jetzt anmelden
            </Link>
          </p>
          
          <p className="text-xs text-gray-600 mt-4">
            * Pflichtfelder
          </p>
        </form>
      </div>
    </div>
  );
} 