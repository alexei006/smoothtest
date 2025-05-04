'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createOrUpdateCustomer } from '../../lib/profileService';

type ApiResponse = {
  success: boolean;
  message: string;
  customer: any;
};

export default function Newsletter() {
  const { user, customerData, refreshCustomerData } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Newsletter-Status initialisieren
  useEffect(() => {
    if (customerData) {
      setIsSubscribed(customerData.newsletter_opt_in || false);
    }
  }, [customerData]);

  // Newsletter-Status ändern
  const handleToggleNewsletter = async () => {
    if (!user) {
      setError('Sie müssen angemeldet sein, um Newsletter-Einstellungen zu ändern');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const newSubscriptionStatus = !isSubscribed;
      
      const updateData = {
        newsletter_opt_in: newSubscriptionStatus
      };
      
      const result = await createOrUpdateCustomer(updateData, user.id) as ApiResponse;
      
      if (result.success) {
        setIsSubscribed(newSubscriptionStatus);
        setSuccess(true);
        
        // Kundendaten im Auth-Kontext aktualisieren
        if (typeof refreshCustomerData === 'function') {
          refreshCustomerData();
        }
      } else {
        setError(result.message || 'Fehler beim Aktualisieren der Newsletter-Einstellungen');
      }
    } catch (err: any) {
      console.error('Fehler beim Ändern des Newsletter-Abonnements:', err);
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Newsletter-Einstellungen</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Ihre Newsletter-Einstellungen wurden erfolgreich aktualisiert.
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Newsletter-Abonnement</h3>
            <p className="text-gray-600 mt-1">
              Erhalten Sie regelmäßige Updates zu neuen Produkten, Angeboten und Events.
            </p>
          </div>
          
          <div className="relative">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isSubscribed}
                onChange={handleToggleNewsletter}
                disabled={loading}
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer ${
                isSubscribed ? 'after:translate-x-full after:border-white bg-teal-600' : ''
              } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mt-4">
          <p>
            Durch Aktivieren des Newsletter-Abonnements stimmen Sie zu, dass wir Ihnen regelmäßig E-Mails mit 
            Informationen zu unseren Produkten, Angeboten und Services zusenden dürfen. 
            Sie können Ihre Einwilligung jederzeit durch Deaktivierung dieser Option widerrufen.
          </p>
          <p className="mt-2">
            Weitere Informationen finden Sie in unserer Datenschutzerklärung.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-3">Kontaktpräferenzen</h3>
        <p className="text-gray-600 mb-4">
          Wählen Sie aus, zu welchen Themen Sie E-Mails erhalten möchten:
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="promotions"
              type="checkbox"
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              disabled
              checked
            />
            <label htmlFor="promotions" className="ml-3 text-sm text-gray-700">
              Angebote und Rabatte
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="new-products"
              type="checkbox"
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              disabled
              checked
            />
            <label htmlFor="new-products" className="ml-3 text-sm text-gray-700">
              Neue Produkte und Dienstleistungen
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="events"
              type="checkbox"
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              disabled
              checked
            />
            <label htmlFor="events" className="ml-3 text-sm text-gray-700">
              Events und Workshops
            </label>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Diese Einstellungen können aktuell nicht individuell angepasst werden. 
            Kommende Funktionalität.
          </p>
        </div>
      </div>
    </div>
  );
} 