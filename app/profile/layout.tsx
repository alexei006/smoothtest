'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Nur weiterleiten, wenn der Ladevorgang abgeschlossen ist und kein Benutzer vorhanden ist
    if (!loading) {
      setIsInitialized(true);
      
      if (!user && !redirecting) {
        setRedirecting(true);
        console.log('Kein Benutzer gefunden, leite zur Startseite weiter');
        router.push('/');
      }
    }
  }, [user, loading, router, redirecting]);

  // Zeige Ladeindikator, wenn die Authentifizierung noch lädt oder die Seite noch nicht initialisiert ist
  if (loading || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  // Benutzer ist nicht authentifiziert
  if (!user) {
    // Zeigen Sie einen Ladeindikator während der Weiterleitung
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Sie werden weitergeleitet...</p>
        </div>
      </div>
    );
  }

  // Benutzer ist authentifiziert, zeige das Layout
  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
} 