'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

export default function AuthOverlay({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  
  // Login Form State
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register Form State
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    plz: '',
    address: '',
    phoneNumber: '',
    newsletter: false
  });
  
  // Passwort zurücksetzen Form State
  const [resetPasswordData, setResetPasswordData] = useState({
    email: ''
  });
  
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      await login({ 
        email: loginData.email, 
        password: loginData.password 
      });
      onClose();
    } catch (err) {
      console.error('Login-Fehler:', err);
      setError(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error('Google-Login-Fehler:', err);
      setError(err.message || 'Google-Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!resetPasswordData.email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(resetPasswordData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      // Passwort-Reset-Anfrage in der Tabelle 'customers' registrieren
      const timestamp = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('customers')
        .update({ 
          password_reset_requested_at: timestamp 
        })
        .eq('email', resetPasswordData.email);
      
      if (dbError) {
        console.error('Fehler beim Aktualisieren des Zeitstempels:', dbError);
      }
      
      setSuccess('Eine E-Mail zum Zurücksetzen Ihres Passworts wurde verschickt. Bitte prüfen Sie Ihren Posteingang.');
    } catch (err) {
      console.error('Passwort-Reset-Fehler:', err);
      setError(err.message || 'Passwort-Reset fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.name) {
      setError('Bitte füllen Sie alle Pflichtfelder aus (Name, E-Mail, Passwort)');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }
    
    if (registerData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      await register(registerData);
      onClose();
    } catch (err) {
      console.error('Registrierungsfehler:', err);
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-teal-600 text-white py-4 px-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {view === 'login' ? 'Anmelden' : view === 'register' ? 'Registrieren' : 'Passwort zurücksetzen'}
          </h2>
          <button onClick={onClose} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Login View */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="py-6 px-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="name@beispiel.de"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Passwort
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <button
                type="submit"
                disabled={loading}
                className={`bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Anmelden...' : 'Anmelden'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('reset-password');
                  setError('');
                  setResetPasswordData({ email: loginData.email });
                }}
                className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800"
              >
                Passwort vergessen?
              </button>
            </div>
            
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-600">oder</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className={`w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow flex items-center justify-center ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                  ></path>
                </svg>
                Mit Google anmelden
              </button>
            </div>
            
            <p className="text-center text-gray-600 text-sm">
              Noch kein Konto?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('register');
                  setError('');
                }}
                className="text-teal-600 hover:text-teal-800 font-semibold"
              >
                Jetzt registrieren
              </button>
            </p>
          </form>
        )}
        
        {/* Reset Password View */}
        {view === 'reset-password' && (
          <form onSubmit={handleResetPasswordSubmit} className="py-6 px-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            <p className="mb-4 text-gray-600">
              Bitte geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </p>
            
            <div className="mb-6">
              <label htmlFor="reset-email" className="block text-gray-700 text-sm font-bold mb-2">
                E-Mail
              </label>
              <input
                type="email"
                id="reset-email"
                name="email"
                value={resetPasswordData.email}
                onChange={handleResetPasswordChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="name@beispiel.de"
                required
              />
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <button
                type="submit"
                disabled={loading}
                className={`bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Senden...' : 'Link senden'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccess('');
                }}
                className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800"
              >
                Zurück zum Login
              </button>
            </div>
          </form>
        )}
        
        {/* Register View */}
        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="py-6 px-8">
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
                value={registerData.name}
                onChange={handleRegisterChange}
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
                value={registerData.email}
                onChange={handleRegisterChange}
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
                value={registerData.password}
                onChange={handleRegisterChange}
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
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
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
                value={registerData.address}
                onChange={handleRegisterChange}
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
                value={registerData.plz}
                onChange={handleRegisterChange}
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
                value={registerData.phoneNumber}
                onChange={handleRegisterChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Telefonnummer für Lieferungen"
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={registerData.newsletter}
                  onChange={handleRegisterChange}
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
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                }}
                className="text-teal-600 hover:text-teal-800 font-semibold"
              >
                Jetzt anmelden
              </button>
            </p>
            
            <p className="text-xs text-gray-600 mt-4">
              * Pflichtfelder
            </p>
          </form>
        )}
      </div>
    </div>
  );
} 