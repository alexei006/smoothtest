"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Pages.css';
import '../styles/Kontakt.css';
import { createSupportTicket } from '../services/supportService';
import { getUserOrders } from '../services/orderService';

// Problemkategorien für Support-Tickets
const problemCategories = [
  "Bitte auswählen",
  "Zustellung",
  "Zahlungsabwicklung",
  "Artikelqualität",
  "Rückerstattung",
  "Bestelländerung",
  "Website-Probleme",
  "Sonstiges"
];

const Kontakt = () => {
  const { user, customerData } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: problemCategories[0],
    orderId: '',
    message: ''
  });
  const [orders, setOrders] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);

  // Funktion, um den aktuellen Benutzernamen zu ermitteln
  const getUserName = useCallback(() => {
    if (customerData && customerData.name) {
      return customerData.name;
    } else if (customerData && customerData.first_name && customerData.last_name) {
      return `${customerData.first_name} ${customerData.last_name}`;
    } else if (user && user.name) {
      return user.name;
    } else if (user && user.displayName) {
      return user.displayName;
    } else if (user && user.user_metadata && user.user_metadata.name) {
      return user.user_metadata.name;
    } else if (user && user.user_metadata && user.user_metadata.full_name) {
      return user.user_metadata.full_name;
    } else {
      return '';
    }
  }, [user, customerData]);

  // Laden der Bestellungen und Benutzerdaten, wenn der Benutzer eingeloggt ist
  useEffect(() => {
    console.log('Kontakt: Haupteffekt ausgeführt');
    let isMounted = true;
    
    const loadUserData = async () => {
      console.log('Kontakt: loadUserData aufgerufen', { user, customerData });
      
      try {
        if (user) {
          // Immer die Bestellungen des Benutzers laden
          console.log('Versuche Bestellungen zu laden für Benutzer ID:', user.id);
          try {
            const userOrders = await getUserOrders(user.id);
            console.log('Benutzerbestellungen geladen:', userOrders);
            if (isMounted) {
              setOrders(userOrders || []);
            }
          } catch (ordersError) {
            console.error('Fehler beim Laden der Bestellungen:', ordersError);
            // Leere Liste, damit wir später Dummy-Daten anzeigen können
            if (isMounted) {
              setOrders([]);
            }
          }

          // Benutzerdaten für die Formularfelder ermitteln
          let userName = getUserName();
          
          console.log('Gefundener Benutzername:', userName);
          
          if (isMounted) {
            // Formular mit den verfügbaren Daten aktualisieren
            setFormData(prev => ({
              ...prev,
              name: userName || '',
              email: user.email || ''
            }));
            
            setUserDataLoaded(true);
          }
        } else {
          console.log('Kein Benutzer - Setze leere Standardwerte');
          // Wenn kein Benutzer vorhanden ist, setzen wir die leeren Standardwerte
          if (isMounted) {
            setOrders([]);
            setFormData({
              name: '',
              email: '',
              category: problemCategories[0],
              orderId: '',
              message: ''
            });
          }
        }
        
        // Markiere das Formular als bereit, unabhängig davon, ob ein Benutzer angemeldet ist oder nicht
        if (isMounted) {
          setFormReady(true);
          console.log('Formular ist jetzt bereit');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        if (isMounted) {
          setFormReady(true); // Trotz Fehler das Formular als bereit markieren
        }
      }
    };

    loadUserData();
    
    // Cleanup-Funktion
    return () => {
      isMounted = false;
    };
  }, [user, customerData, getUserName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verhindere doppeltes Absenden
    if (isSubmitting) {
      console.log('Formular wird bereits gesendet, Aktion abgebrochen');
      return;
    }
    
    console.log('Formular wird abgesendet - formReady:', formReady);
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Stelle sicher, dass das Formular bereit ist, bevor fortgefahren wird
      if (!formReady) {
        throw new Error('Das Formular ist noch nicht bereit. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
      }
      
      console.log('Formular wird abgesendet mit Daten:', formData);
      
      // Hier senden wir das Support-Ticket an den Server
      const result = await createSupportTicket({
        name: formData.name,
        email: formData.email,
        category: formData.category,
        orderId: formData.orderId,
        message: formData.message,
        user_id: user?.id
      });
      
      console.log('Support-Ticket-Ergebnis:', result);
      
      if (result.success) {
        setTicketNumber(result.ticketNumber);
        setSubmitted(true);
      } else {
        setSubmitError(result.message || 'Fehler beim Erstellen des Support-Tickets');
      }
    } catch (error) {
      console.error('Fehler beim Senden des Support-Tickets:', error);
      setSubmitError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Erzeugen von Dummy-Bestellungen, wenn keine vorhanden sind
  const getDisplayOrders = () => {
    if (user && orders.length === 0) {
      // Dummy-Bestellungen, falls keine aus der Datenbank geladen wurden
      return [
        { id: 'ORD-2024-001', order_number: 'ORD-2024-001', date: '15.03.2024', total: 24.90, created_at: '2024-03-15T10:30:00Z', status: 'geliefert' },
        { id: 'ORD-2024-002', order_number: 'ORD-2024-002', date: '02.04.2024', total: 18.50, created_at: '2024-04-02T08:15:00Z', status: 'bestätigt' },
        { id: 'ORD-2024-003', order_number: 'ORD-2024-003', date: '20.04.2024', total: 32.75, created_at: '2024-04-20T14:45:00Z', status: 'neu' }
      ];
    }
    return orders;
  };

  // Bestimmt, ob die Bestellungsauswahl angezeigt werden soll
  const shouldShowOrderSelection = () => {
    return user !== null; // Zeigen die Auswahl immer an, wenn ein Benutzer angemeldet ist
  };

  return (
    <div className="kontakt-container">
      <div className="kontakt-content">
        <h1>Kontakt & Support</h1>
        
        {submitted ? (
          <div className="ticket-success">
            <div className="success-icon">✓</div>
            <h2>Vielen Dank für Ihre Anfrage!</h2>
            <p>Ihre Ticket-Nummer lautet: <strong>{ticketNumber}</strong></p>
            <p>Wir werden uns so schnell wie möglich bei Ihnen melden.</p>
            <button 
              className="new-ticket-btn"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: getUserName(),
                  email: user ? user.email || '' : '',
                  category: problemCategories[0],
                  orderId: '',
                  message: ''
                });
              }}
            >
              Neues Ticket erstellen
            </button>
          </div>
        ) : (
          <>
            <p className="kontakt-intro">
              Haben Sie Fragen oder Probleme? Füllen Sie das untenstehende Formular aus, 
              und unser Team wird sich schnellstmöglich mit Ihnen in Verbindung setzen.
            </p>

            <form className="kontakt-form" onSubmit={handleSubmit}>
              {!formReady && (
                <div className="info-message">
                  <p>Formular wird geladen...</p>
                </div>
              )}

              {submitError && (
                <div className="error-message">
                  <p>{submitError}</p>
                </div>
              )}
            
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  required
                  disabled={user && formData.name} // Deaktivieren, wenn der Benutzer eingeloggt ist und Name vorhanden
                  className={user && formData.name ? 'disabled-input' : ''}
                />
                {user && <small className="field-info">Automatisch ausgefüllt basierend auf Ihrem Konto</small>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">E-Mail</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  required
                  disabled={user} // Deaktivieren, wenn der Benutzer eingeloggt ist
                  className={user ? 'disabled-input' : ''}
                />
                {user && <small className="field-info">Automatisch ausgefüllt basierend auf Ihrem Konto</small>}
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Problemkategorie</label>
                <select 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  required
                >
                  {problemCategories.map((category, index) => (
                    <option 
                      key={index} 
                      value={category} 
                      disabled={index === 0}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              {shouldShowOrderSelection() && (
                <div className="form-group">
                  <label htmlFor="orderId">Betroffene Bestellung (optional)</label>
                  <select 
                    id="orderId" 
                    name="orderId" 
                    value={formData.orderId} 
                    onChange={handleInputChange}
                  >
                    <option value="">Bitte auswählen (optional)</option>
                    {getDisplayOrders().map(order => (
                      <option key={order.id} value={order.order_number}>
                        {order.order_number} - {order.date} ({order.total.toFixed(2).replace('.', ',')} €)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="message">Problembeschreibung</label>
                <textarea 
                  id="message" 
                  name="message" 
                  value={formData.message} 
                  onChange={handleInputChange}
                  required
                  rows="5"
                  placeholder="Bitte beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting || formData.category === problemCategories[0] || !formReady}
              >
                {isSubmitting ? 'Wird gesendet...' : 'Support-Ticket senden'}
              </button>
              
              {isSubmitting && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Ticket wird erstellt...</p>
                </div>
              )}
            </form>
          </>
        )}
        
        <div className="kontakt-info">
          <h2>Direkter Kontakt</h2>
          <div className="info-items">
            <div className="info-item">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <h3>Telefon</h3>
                <p>+49 123 456 789 00</p>
                <small>Mo-Fr: 8:00 - 18:00 Uhr</small>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">✉️</div>
              <div className="info-content">
                <h3>E-Mail</h3>
                <p>support@fruehstuecksexpress.de</p>
                <small>Antwort innerhalb von 24 Stunden</small>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">🏢</div>
              <div className="info-content">
                <h3>Adresse</h3>
                <p>Musterstraße 123<br />12345 Musterstadt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kontakt; 