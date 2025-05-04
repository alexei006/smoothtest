import React, { useState } from 'react';
import { FaSave, FaEnvelope, FaStore, FaUser, FaLock, FaCreditCard, FaTruck, FaCog } from 'react-icons/fa';
import './AdminSettings.css';

const AdminSettings = () => {
  // Verschiedene Einstellungskategorien
  const [activeTab, setActiveTab] = useState('general');
  
  // Allgemeine Einstellungen
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Restaurant Lieferservice',
    description: 'Frisches Essen direkt zu Ihnen nach Hause geliefert',
    email: 'kontakt@restaurant-lieferservice.de',
    phone: '+49 1234 567890',
    address: 'Musterstraße 123, 12345 Musterstadt',
    logo: '/path/to/logo.png',
    currency: 'EUR',
    timezone: 'Europe/Berlin'
  });
  
  // E-Mail-Einstellungen
  const [emailSettings, setEmailSettings] = useState({
    provider: 'sendgrid',
    apiKey: '**************',
    senderName: 'Restaurant Lieferservice',
    senderEmail: 'noreply@restaurant-lieferservice.de',
    templates: {
      orderConfirmation: 'template_123',
      accountCreation: 'template_456',
      passwordReset: 'template_789'
    }
  });
  
  // Lieferungs-Einstellungen
  const [deliverySettings, setDeliverySettings] = useState({
    minOrderValue: 15,
    freeDeliveryThreshold: 30,
    deliveryFee: 3.50,
    deliveryTime: '30-45',
    deliveryRadius: 10,
    allowedZipCodes: ['44135', '44137', '44139', '44227', '44229', '44263']
  });
  
  // Zahlungs-Einstellungen
  const [paymentSettings, setPaymentSettings] = useState({
    enabledMethods: {
      card: true,
      paypal: true,
      sofort: false,
      klarna: true,
      cash: true
    },
    stripePublicKey: 'pk_test_...',
    stripeSecretKey: '**************',
    paypalClientId: 'client_id...',
    paypalClientSecret: '**************'
  });
  
  // Benutzereinstellungen
  const [userSettings, setUserSettings] = useState({
    requireAccountForCheckout: false,
    allowGuestCheckout: true,
    sendWelcomeEmail: true,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireUppercase: true,
    passwordRequireNumber: true
  });
  
  // Formularänderungen verarbeiten
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDeliveryChange = (e) => {
    const { name, value, type } = e.target;
    setDeliverySettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };
  
  const handlePaymentMethodToggle = (method) => {
    setPaymentSettings(prev => ({
      ...prev,
      enabledMethods: {
        ...prev.enabledMethods,
        [method]: !prev.enabledMethods[method]
      }
    }));
  };
  
  const handleUserSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Einstellungen speichern
  const saveSettings = () => {
    // Hier würde der API-Aufruf zum Speichern der Einstellungen sein
    alert('Einstellungen wurden gespeichert!');
  };
  
  // Zipcode zur Liste hinzufügen
  const addZipCode = (zipCode) => {
    if (!deliverySettings.allowedZipCodes.includes(zipCode) && zipCode.trim() !== '') {
      setDeliverySettings(prev => ({
        ...prev,
        allowedZipCodes: [...prev.allowedZipCodes, zipCode]
      }));
    }
  };
  
  // Zipcode aus der Liste entfernen
  const removeZipCode = (zipCode) => {
    setDeliverySettings(prev => ({
      ...prev,
      allowedZipCodes: prev.allowedZipCodes.filter(code => code !== zipCode)
    }));
  };
  
  return (
    <div className="admin-settings-container">
      <div className="admin-settings-header">
        <h2>Einstellungen</h2>
        <button className="save-settings-button" onClick={saveSettings}>
          <FaSave /> Alle Einstellungen speichern
        </button>
      </div>
      
      <div className="admin-settings-content">
        {/* Tabs für die verschiedenen Einstellungskategorien */}
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FaCog /> Allgemein
          </button>
          <button 
            className={`settings-tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <FaEnvelope /> E-Mail
          </button>
          <button 
            className={`settings-tab ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            <FaTruck /> Lieferung
          </button>
          <button 
            className={`settings-tab ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <FaCreditCard /> Zahlungen
          </button>
          <button 
            className={`settings-tab ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            <FaUser /> Benutzer
          </button>
        </div>
        
        {/* Einstellungsinhalte */}
        <div className="settings-panel">
          {/* Allgemeine Einstellungen */}
          {activeTab === 'general' && (
            <div className="settings-form">
              <h3>Allgemeine Einstellungen</h3>
              <div className="form-group">
                <label htmlFor="siteName">Webseitenname</label>
                <input 
                  type="text" 
                  id="siteName" 
                  name="siteName" 
                  value={generalSettings.siteName} 
                  onChange={handleGeneralChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Beschreibung</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={generalSettings.description} 
                  onChange={handleGeneralChange}
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">E-Mail-Adresse</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={generalSettings.email} 
                    onChange={handleGeneralChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Telefonnummer</label>
                  <input 
                    type="text" 
                    id="phone" 
                    name="phone" 
                    value={generalSettings.phone} 
                    onChange={handleGeneralChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Adresse</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  value={generalSettings.address} 
                  onChange={handleGeneralChange}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currency">Währung</label>
                  <select 
                    id="currency" 
                    name="currency" 
                    value={generalSettings.currency} 
                    onChange={handleGeneralChange}
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">US-Dollar ($)</option>
                    <option value="GBP">Britisches Pfund (£)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="timezone">Zeitzone</label>
                  <select 
                    id="timezone" 
                    name="timezone" 
                    value={generalSettings.timezone} 
                    onChange={handleGeneralChange}
                  >
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Europe/London">London</option>
                    <option value="America/New_York">New York</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* E-Mail-Einstellungen */}
          {activeTab === 'email' && (
            <div className="settings-form">
              <h3>E-Mail-Einstellungen</h3>
              <div className="form-group">
                <label htmlFor="provider">E-Mail-Anbieter</label>
                <select 
                  id="provider" 
                  name="provider" 
                  value={emailSettings.provider} 
                  onChange={handleEmailChange}
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                  <option value="smtp">SMTP</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="apiKey">API-Schlüssel</label>
                <input 
                  type="password" 
                  id="apiKey" 
                  name="apiKey" 
                  value={emailSettings.apiKey} 
                  onChange={handleEmailChange}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="senderName">Absendername</label>
                  <input 
                    type="text" 
                    id="senderName" 
                    name="senderName" 
                    value={emailSettings.senderName} 
                    onChange={handleEmailChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="senderEmail">Absender-E-Mail</label>
                  <input 
                    type="email" 
                    id="senderEmail" 
                    name="senderEmail" 
                    value={emailSettings.senderEmail} 
                    onChange={handleEmailChange}
                  />
                </div>
              </div>
              
              <h4>E-Mail-Vorlagen</h4>
              <div className="form-group">
                <label htmlFor="orderConfirmation">Bestellbestätigung-Vorlage-ID</label>
                <input 
                  type="text" 
                  id="orderConfirmation" 
                  name="orderConfirmation" 
                  value={emailSettings.templates.orderConfirmation} 
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    templates: {
                      ...prev.templates,
                      orderConfirmation: e.target.value
                    }
                  }))}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="accountCreation">Kontoerstellung-Vorlage-ID</label>
                <input 
                  type="text" 
                  id="accountCreation" 
                  name="accountCreation" 
                  value={emailSettings.templates.accountCreation} 
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    templates: {
                      ...prev.templates,
                      accountCreation: e.target.value
                    }
                  }))}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="passwordReset">Passwort-Zurücksetzen-Vorlage-ID</label>
                <input 
                  type="text" 
                  id="passwordReset" 
                  name="passwordReset" 
                  value={emailSettings.templates.passwordReset} 
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    templates: {
                      ...prev.templates,
                      passwordReset: e.target.value
                    }
                  }))}
                />
              </div>
            </div>
          )}
          
          {/* Lieferungseinstellungen */}
          {activeTab === 'delivery' && (
            <div className="settings-form">
              <h3>Lieferungseinstellungen</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minOrderValue">Mindestbestellwert (€)</label>
                  <input 
                    type="number" 
                    id="minOrderValue" 
                    name="minOrderValue" 
                    value={deliverySettings.minOrderValue} 
                    onChange={handleDeliveryChange}
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="deliveryFee">Liefergebühr (€)</label>
                  <input 
                    type="number" 
                    id="deliveryFee" 
                    name="deliveryFee" 
                    value={deliverySettings.deliveryFee} 
                    onChange={handleDeliveryChange}
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="freeDeliveryThreshold">Grenze für kostenlose Lieferung (€)</label>
                  <input 
                    type="number" 
                    id="freeDeliveryThreshold" 
                    name="freeDeliveryThreshold" 
                    value={deliverySettings.freeDeliveryThreshold} 
                    onChange={handleDeliveryChange}
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="deliveryTime">Lieferzeit (Minuten)</label>
                  <input 
                    type="text" 
                    id="deliveryTime" 
                    name="deliveryTime" 
                    value={deliverySettings.deliveryTime} 
                    onChange={handleDeliveryChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryRadius">Lieferradius (km)</label>
                <input 
                  type="number" 
                  id="deliveryRadius" 
                  name="deliveryRadius" 
                  value={deliverySettings.deliveryRadius} 
                  onChange={handleDeliveryChange}
                  step="0.1"
                />
              </div>
              
              <div className="form-group">
                <label>Erlaubte Postleitzahlen</label>
                <div className="zipcode-input-container">
                  <input 
                    type="text" 
                    id="zipcode" 
                    placeholder="PLZ hinzufügen..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addZipCode(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={(e) => {
                      const input = document.getElementById('zipcode');
                      addZipCode(input.value);
                      input.value = '';
                    }}
                  >
                    Hinzufügen
                  </button>
                </div>
                <div className="zipcode-tags">
                  {deliverySettings.allowedZipCodes.map(code => (
                    <div key={code} className="zipcode-tag">
                      {code}
                      <button 
                        type="button" 
                        className="remove-tag" 
                        onClick={() => removeZipCode(code)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Zahlungseinstellungen */}
          {activeTab === 'payment' && (
            <div className="settings-form">
              <h3>Zahlungseinstellungen</h3>
              <div className="payment-methods">
                <h4>Zahlungsmethoden</h4>
                <div className="payment-method-toggle">
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.enabledMethods.card} 
                      onChange={() => handlePaymentMethodToggle('card')}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Kreditkarte</span>
                  </label>
                </div>
                
                <div className="payment-method-toggle">
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.enabledMethods.paypal} 
                      onChange={() => handlePaymentMethodToggle('paypal')}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">PayPal</span>
                  </label>
                </div>
                
                <div className="payment-method-toggle">
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.enabledMethods.sofort} 
                      onChange={() => handlePaymentMethodToggle('sofort')}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Sofort</span>
                  </label>
                </div>
                
                <div className="payment-method-toggle">
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.enabledMethods.klarna} 
                      onChange={() => handlePaymentMethodToggle('klarna')}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Klarna</span>
                  </label>
                </div>
                
                <div className="payment-method-toggle">
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.enabledMethods.cash} 
                      onChange={() => handlePaymentMethodToggle('cash')}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Barzahlung bei Lieferung</span>
                  </label>
                </div>
              </div>
              
              <h4>Stripe-Einstellungen</h4>
              <div className="form-group">
                <label htmlFor="stripePublicKey">Öffentlicher Schlüssel</label>
                <input 
                  type="text" 
                  id="stripePublicKey" 
                  name="stripePublicKey" 
                  value={paymentSettings.stripePublicKey} 
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    stripePublicKey: e.target.value
                  }))}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="stripeSecretKey">Geheimer Schlüssel</label>
                <input 
                  type="password" 
                  id="stripeSecretKey" 
                  name="stripeSecretKey" 
                  value={paymentSettings.stripeSecretKey} 
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    stripeSecretKey: e.target.value
                  }))}
                />
              </div>
              
              <h4>PayPal-Einstellungen</h4>
              <div className="form-group">
                <label htmlFor="paypalClientId">Client-ID</label>
                <input 
                  type="text" 
                  id="paypalClientId" 
                  name="paypalClientId" 
                  value={paymentSettings.paypalClientId} 
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    paypalClientId: e.target.value
                  }))}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="paypalClientSecret">Client-Secret</label>
                <input 
                  type="password" 
                  id="paypalClientSecret" 
                  name="paypalClientSecret" 
                  value={paymentSettings.paypalClientSecret} 
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    paypalClientSecret: e.target.value
                  }))}
                />
              </div>
            </div>
          )}
          
          {/* Benutzereinstellungen */}
          {activeTab === 'user' && (
            <div className="settings-form">
              <h3>Benutzereinstellungen</h3>
              <div className="form-toggle">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    name="requireAccountForCheckout" 
                    checked={userSettings.requireAccountForCheckout} 
                    onChange={handleUserSettingChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Konto für Bestellung erforderlich</span>
                </label>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    name="allowGuestCheckout" 
                    checked={userSettings.allowGuestCheckout} 
                    onChange={handleUserSettingChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Gastbestellung erlauben</span>
                </label>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    name="sendWelcomeEmail" 
                    checked={userSettings.sendWelcomeEmail} 
                    onChange={handleUserSettingChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Willkommens-E-Mail senden</span>
                </label>
              </div>
              
              <h4>Passwort-Anforderungen</h4>
              <div className="form-group">
                <label htmlFor="passwordMinLength">Minimale Länge</label>
                <input 
                  type="number" 
                  id="passwordMinLength" 
                  name="passwordMinLength" 
                  value={userSettings.passwordMinLength} 
                  onChange={handleUserSettingChange}
                  min="6"
                  max="20"
                />
              </div>
              
              <div className="form-toggle">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    name="passwordRequireSpecialChar" 
                    checked={userSettings.passwordRequireSpecialChar} 
                    onChange={handleUserSettingChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Sonderzeichen erforderlich</span>
                </label>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    name="passwordRequireUppercase" 
                    checked={userSettings.passwordRequireUppercase} 
                    onChange={handleUserSettingChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Großbuchstaben erforderlich</span>
                </label>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    name="passwordRequireNumber" 
                    checked={userSettings.passwordRequireNumber} 
                    onChange={handleUserSettingChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Zahlen erforderlich</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 