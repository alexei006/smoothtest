'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createOrUpdateCustomer } from '../../lib/profileService';

type CustomerFormData = {
  name: string;
  email: string;
  plz: string;
  address: string;
  phone: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  customer: any;
};

export default function PersonalData() {
  const { user, customerData, refreshCustomerData } = useAuth();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    plz: '',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const formInitializedRef = useRef(false);

  // Formular nur einmal mit aktuellen Daten initialisieren
  useEffect(() => {
    // Verhindern, dass das Formular mehrfach initialisiert wird
    if (formInitializedRef.current) {
      return;
    }

    if (customerData) {
      // Hier die korrekten Feldnamen verwenden und kombinieren
      const fullName = [customerData.first_name || '', customerData.last_name || ''].filter(Boolean).join(' ');
      
      setFormData({
        name: fullName || '',
        email: customerData.email || '',
        plz: customerData.postal_code || '',
        address: customerData.address || '',
        phone: customerData.phone || ''
      });
      
      formInitializedRef.current = true;
      setIsFormInitialized(true);
    } else if (user) {
      // Hier die korrekten Feldnamen aus den Metadaten verwenden
      const fullName = [
        user.user_metadata?.first_name || '', 
        user.user_metadata?.last_name || ''
      ].filter(Boolean).join(' ');
      
      setFormData({
        name: fullName || user.user_metadata?.name || '',
        email: user.email || '',
        plz: user.user_metadata?.postal_code || user.user_metadata?.plz || '',
        address: user.user_metadata?.address || '',
        phone: user.user_metadata?.phoneNumber || user.user_metadata?.phone || ''
      });
      
      formInitializedRef.current = true;
      setIsFormInitialized(true);
    }
  }, [customerData, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Erfolgs- und Fehlermeldungen zurücksetzen, wenn das Formular geändert wird
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prüfen, ob der Benutzer gültig ist
    if (!user || !user.id) {
      setError('Sie müssen angemeldet sein, um Ihre Daten zu aktualisieren');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Name in Vor- und Nachname aufteilen für die API
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Angepasste Daten für die API - beide Feldnamen für PLZ übergeben
      const apiData = {
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        postal_code: formData.plz, // für Backend-Kompatibilität
        plz: formData.plz, // für alte Backend-Funktionen
        address: formData.address,
        phone: formData.phone
      };
      
      console.log('Sende aktualisierte Daten:', apiData);
      const result = await createOrUpdateCustomer(apiData, user.id) as ApiResponse;
      
      if (result.success) {
        console.log('Daten erfolgreich gespeichert:', result);
        setSuccess(true);
        
        // Kurze Verzögerung, damit die Erfolgsmeldung sichtbar ist
        setTimeout(() => {
          // Kundendaten im Auth-Kontext aktualisieren, aber nicht das Formular zurücksetzen
          if (typeof refreshCustomerData === 'function') {
            refreshCustomerData()
              .then(result => {
                console.log('Kundendaten aktualisiert nach Speichern:', result);
              })
              .catch(err => {
                console.error('Fehler beim Aktualisieren nach Speichern:', err);
              });
          }
        }, 300);
      } else {
        console.error('Fehler beim Speichern der Daten:', result);
        setError(result.message || 'Fehler beim Aktualisieren der Daten');
      }
    } catch (err: any) {
      console.error('Fehler beim Aktualisieren der persönlichen Daten:', err);
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  // Rendering erst, wenn Formular initialisiert wurde
  if (!isFormInitialized && user) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Persönliche Daten</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Ihre persönlichen Daten wurden erfolgreich aktualisiert.
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="profile-section">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="profile-input"
              required
            />
          </div>
          
          <div className="profile-section">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="profile-input"
              required
            />
          </div>
          
          <div className="profile-section">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="profile-input"
              placeholder="Straße und Hausnummer"
            />
          </div>
          
          <div className="profile-section">
            <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-1">
              Postleitzahl
            </label>
            <input
              type="text"
              id="plz"
              name="plz"
              value={formData.plz}
              onChange={handleChange}
              className="profile-input"
              placeholder="z.B. 10115"
              maxLength={10}
            />
            <p className="mt-1 text-xs text-gray-500">
              Bitte geben Sie Ihre Postleitzahl ein.
            </p>
          </div>
          
          <div className="profile-section">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefonnummer
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="profile-input"
              placeholder="z.B. 0160 1234567"
            />
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Wird gespeichert...' : 'Daten speichern'}
          </button>
        </div>
      </form>
    </div>
  );
} 