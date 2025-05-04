'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Login-Funktion aus dem Auth-Context aufrufen
      if (typeof login === 'function') {
        await login({ email, password });
        router.push('/');
      } else {
        setError('Login-Funktion nicht verfügbar');
      }
    } catch (err: any) {
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
      
      // Google-Login-Funktion aus dem Auth-Context aufrufen
      if (typeof loginWithGoogle === 'function') {
        await loginWithGoogle();
        // Redirect erfolgt automatisch
      } else {
        setError('Google-Login-Funktion nicht verfügbar');
      }
    } catch (err: any) {
      console.error('Google-Login-Fehler:', err);
      setError(err.message || 'Google-Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-teal-600 text-white py-4 px-6">
          <h2 className="text-2xl font-bold">Anmelden</h2>
          <p className="text-teal-100">Bei deinem Smooth Bowl Konto anmelden</p>
        </div>
        
        <form onSubmit={handleSubmit} className="py-6 px-8">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Link
              href="/auth/reset-password"
              className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800"
            >
              Passwort vergessen?
            </Link>
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
            <Link
              href="/auth/register"
              className="text-teal-600 hover:text-teal-800 font-semibold"
            >
              Jetzt registrieren
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
} 