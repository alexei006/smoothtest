'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { BsBoxSeam, BsGear, BsPerson, BsEnvelope, BsPersonPlus } from 'react-icons/bs';
import { Toaster } from 'react-hot-toast';

// Komponenten
import OrdersList from './components/OrdersList';
import PersonalData from './components/PersonalData';
import AccountSettings from './components/AccountSettings';
import Newsletter from './components/Newsletter';
import AffiliateProgram from './components/AffiliateProgram';

export default function ProfilePage() {
  const { user, customerData, loading, refreshCustomerData } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [pageReady, setPageReady] = useState(false);
  const dataRefreshedRef = useRef(false);

  // Sofortige Prüfung beim ersten Rendern und bei jeder Änderung der Abhängigkeiten
  useEffect(() => {
    // Wenn Authentifizierungsdaten bereits geladen sind, Seite sofort bereit setzen
    if (!loading) {
      if (user && user?.id) {
        console.log('Benutzer bereits geladen, zeige Profilseite');
        setPageReady(true);
        
        // Aktualisiere die Kundendaten NUR EINMAL beim ersten Besuch der Profilseite
        if (!dataRefreshedRef.current) {
          dataRefreshedRef.current = true;
          refreshCustomerData().then(result => {
            console.log('Kundendaten aktualisiert:', result);
          }).catch(err => {
            console.error('Fehler beim Aktualisieren der Kundendaten:', err);
          });
        }
      } else {
        // Wenn kein Benutzer vorhanden ist und das Laden abgeschlossen ist,
        // umleiten zur Startseite oder Login-Seite
        console.log('Kein Benutzer vorhanden, Umleitung erforderlich');
        window.location.href = '/';
      }
    }
  }, [loading, user]);

  // Wenn die Seite noch nicht bereit ist, zeigen wir einen Ladeindikator
  if (!pageReady) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Profildaten werden geladen...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'orders', label: 'Meine Bestellungen', icon: <BsBoxSeam className="mr-2" /> },
    { id: 'personal', label: 'Persönliche Daten', icon: <BsPerson className="mr-2" /> },
    { id: 'affiliate', label: 'Freunde einladen', icon: <BsPersonPlus className="mr-2" /> },
    { id: 'settings', label: 'Kontoeinstellungen', icon: <BsGear className="mr-2" /> },
    { id: 'newsletter', label: 'Newsletter', icon: <BsEnvelope className="mr-2" /> },
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersList />;
      case 'personal':
        return <PersonalData />;
      case 'settings':
        return <AccountSettings />;
      case 'newsletter':
        return <Newsletter />;
      case 'affiliate':
        return <AffiliateProgram />;
      default:
        return <OrdersList />;
    }
  };

  return (
    <div className="bg-white min-h-screen py-6 px-4">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-8 text-teal-700">Mein Profil</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="md:w-1/4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 mb-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="font-semibold text-lg">
                Hallo, {customerData?.name || user?.email || 'Gast'}
              </h2>
              <p className="text-gray-500 text-sm">{user?.email || 'Keine E-Mail-Adresse verfügbar'}</p>
            </div>
            
            <nav>
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left py-2 px-3 rounded-md flex items-center transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-teal-100 text-teal-700 font-medium border border-teal-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent hover:shadow-sm'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:w-3/4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-shadow duration-300">
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
} 