'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabase';

export default function AccountSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passwort zurücksetzen
  const handleResetPassword = async () => {
    if (!user?.email) {
      setError('Keine E-Mail-Adresse gefunden');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Fehler beim Zurücksetzen des Passworts:', err);
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Kontoeinstellungen</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Eine E-Mail zum Zurücksetzen Ihres Passworts wurde an {user?.email} gesendet. Bitte prüfen Sie Ihren Posteingang.
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-lg font-medium mb-3">Passwort ändern</h3>
        <p className="text-gray-600 mb-4">
          Wenn Sie Ihr Passwort ändern möchten, senden wir Ihnen eine E-Mail mit einem Link zum Zurücksetzen.
        </p>
        
        <button
          onClick={handleResetPassword}
          disabled={loading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'E-Mail wird gesendet...' : 'Passwort zurücksetzen'}
        </button>
      </div>
      
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-lg font-medium mb-3">Konto löschen</h3>
        <p className="text-gray-600 mb-4">
          Wenn Sie Ihr Konto löschen, werden alle Ihre persönlichen Daten gelöscht.
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        
        <button 
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={() => alert('Diese Funktion ist noch nicht verfügbar.')}
        >
          Konto löschen
        </button>
      </div>
    </div>
  );
}