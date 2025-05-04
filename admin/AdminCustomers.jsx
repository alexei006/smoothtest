import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaFilter, FaUser, FaTimes, FaShoppingBag, FaTicketAlt, FaSpinner, FaSort, FaSortUp, FaSortDown, FaUserCircle, FaChevronDown, FaChevronUp, FaChevronRight, FaExternalLinkAlt, FaEdit, FaSave, FaCheck, FaCrown, FaRedo, FaIdCard } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, updateUserAsAdmin } from '../../services/adminService';
import { ensureCustomerNumbers } from '../../services/customerService';
import './AdminCustomers.css';
import './CustomerDetailsOverlay.css';
import { FiEdit, FiX, FiAlertTriangle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const AdminCustomers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(null);
  
  // Paginierung
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // Sortierung
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Suche und Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasPurchases: false,
    hasTickets: false,
    isPremium: false
  });
  
  // Responsives Layout
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  
  // Bildschirmgröße überwachen
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Cleanup für die Overlay-Klasse beim Unmounten
  useEffect(() => {
    return () => {
      document.body.classList.remove('overlay-open');
      document.body.style.top = '';
      window.scrollTo(0, 0);
    };
  }, []);
  
  // Daten laden
  const loadCustomers = async () => {
    setLoading(true);
    setError(''); // Fehler zurücksetzen
    try {
      console.log('Starte Kundenabruf...');
      
      const result = await getAllUsers({
        searchTerm,
        page,
        limit,
        sortBy,
        sortOrder
      });
      
      console.log('Ergebnis des Kundenabrufs:', result);
      
      if (result.users) {
        let filteredUsers = result.users;
        
        // Füge Kundennummern hinzu, falls diese nicht existieren
        filteredUsers = ensureCustomerNumbers(filteredUsers);
        
        // Debugging-Ausgabe für jeden Benutzer
        filteredUsers.forEach((user, index) => {
          console.log(`Kunde ${index + 1}:`, {
            id: user.id,
            email: user.email,
            name: user.customerData?.name,
            customerNumber: user.customerData?.customer_number || user.customer_number,
            orders: user.orders?.length || 0,
            tickets: user.tickets?.length || 0
          });
        });
        
        // Filter anwenden
        if (filters.hasPurchases) {
          filteredUsers = filteredUsers.filter(user => user.orders && user.orders.length > 0);
        }
        
        if (filters.hasTickets) {
          filteredUsers = filteredUsers.filter(user => user.tickets && user.tickets.length > 0);
        }
        
        if (filters.isPremium) {
          filteredUsers = filteredUsers.filter(user => user.customerData?.is_premium_member);
        }
        
        setCustomers(filteredUsers);
        setTotalCustomers(result.total);
        setTotalPages(result.totalPages);
      } else {
        console.error('Keine Benutzerdaten im Ergebnis vorhanden');
        setError('Keine Benutzerdaten konnten abgerufen werden.');
      }
    } catch (err) {
      console.error('Detaillierter Fehler beim Laden der Kunden:', err);
      setError(`Fehler: ${err.message || 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Beim ersten Laden und bei Änderungen von Filtern, Seite, etc.
  useEffect(() => {
    loadCustomers();
  }, [page, limit, sortBy, sortOrder, searchTerm, 
      filters.hasPurchases, filters.hasTickets, filters.isPremium]);
  
  // Sortieren
  const handleSort = (field) => {
    if (sortBy === field) {
      // Sortierrichtung umkehren
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Neues Feld zum Sortieren
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Sortierungsicon anzeigen
  const renderSortIcon = (field) => {
    if (sortBy !== field) return <FaSort />;
    if (sortOrder === 'asc') return <FaSortUp />;
    return <FaSortDown />;
  };
  
  // Seitennavigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Funktion zum Anzeigen von Kundendetails
  const handleCustomerSelect = (customer) => {
    // Speichere aktuelle Scroll-Position
    const currentScrollPos = window.pageYOffset;
    setScrollPosition(currentScrollPos);
    
    // Blockiere Scrollen des Hintergrunds
    document.body.classList.add('overlay-open');
    document.body.style.top = `-${currentScrollPos}px`;
    
    // Kundendaten setzen
    setSelectedCustomer(customer);
    setEditedCustomer({ ...customer });
    setIsEditing(false);
    
    // Status zurücksetzen
    setSaveSuccess(null);
    setSaveError(null);
  };
  
  // Funktion zum Schließen der Kundendetails
  const closeCustomerDetails = () => {
    // Scroll-Sperre aufheben
    document.body.classList.remove('overlay-open');
    document.body.style.top = '';
    
    // Zu gespeicherter Position zurückscrolilen
    if (scrollPosition !== null) {
      window.scrollTo(0, scrollPosition);
      setScrollPosition(null);
    }
    
    // Kundendaten zurücksetzen
    setSelectedCustomer(null);
    setEditedCustomer(null);
    setIsEditing(false);
    setSaveSuccess(null);
    setSaveError(null);
  };
  
  // Ticket öffnen
  const handleTicketClick = (ticketId) => {
    navigate(`/admin/support/${ticketId}`);
  };
  
  // Neuer Handler für den "Alle Tickets anzeigen" Button
  const handleViewAllTickets = (e, email) => {
    e.stopPropagation();
    navigate(`/admin/support?search=${encodeURIComponent(email)}`);
  };
  
  // Formatiere Ticket-ID für die Anzeige
  const formatTicketId = (ticket) => {
    if (!ticket) return 'TICKET-0000';
    
    // Wenn das Ticket ein ticket_number-Feld hat, verwende dieses direkt
    if (ticket.ticket_number) {
      return ticket.ticket_number;
    }
    
    // Wenn es sich um ein Ticket-Objekt handelt, aber ohne ticket_number
    if (typeof ticket === 'object') {
      if (ticket.id) {
        // In diesem Fall müssen wir die ID formatieren
        let numericPart;
        if (ticket.id.toString().includes('-')) {
          // Für UUIDs, nehme die ersten 4 Zeichen nach dem ersten Bindestrich
          numericPart = ticket.id.toString().split('-')[1]?.substring(0, 4);
        } else {
          // Für numerische IDs, verwende die letzten 4 Ziffern oder fülle mit führenden Nullen auf
          numericPart = ticket.id.toString().slice(-4).padStart(4, '0');
        }
        return `TICKET-${numericPart || '0000'}`;
      }
      return 'TICKET-0000';
    }
    
    // Wenn es sich um eine direkte ID handelt (String oder Zahl)
    let numericPart;
    if (ticket.toString().includes('-')) {
      // Für UUIDs, nehme die ersten 4 Zeichen nach dem ersten Bindestrich
      numericPart = ticket.toString().split('-')[1]?.substring(0, 4);
    } else {
      // Für numerische IDs, verwende die letzten 4 Ziffern oder fülle mit führenden Nullen auf
      numericPart = ticket.toString().slice(-4).padStart(4, '0');
    }
    
    return `TICKET-${numericPart || '0000'}`;
  };
  
  // Datumsformatierung
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht verfügbar';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Funktionen zum Bearbeiten und Speichern der Kundendaten
  const handleEditClick = () => {
    setIsEditing(true);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSaveClick = () => {
    // Hier würde API-Aufruf zum Speichern erfolgen
    // Beispiel für erfolgreichen Speichervorgang:
    setSaveSuccess('Änderungen erfolgreich gespeichert');
    setSaveError(null);
    setIsEditing(false);
    setSelectedCustomer({ ...editedCustomer });
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedCustomer({ ...selectedCustomer });
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleInputChange = (field, value) => {
    setEditedCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Kunden-Übersichtstabelle
  const renderCustomersTable = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Kundendaten werden geladen...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadCustomers}>Erneut versuchen</button>
        </div>
      );
    }
    
    if (customers.length === 0) {
      return (
        <div className="empty-state">
          <FaUserCircle className="empty-icon" />
          <h3>Keine Kunden gefunden</h3>
          <p>Es wurden keine Kunden gefunden, die den Filterkriterien entsprechen.</p>
        </div>
      );
    }
    
    // Responsive Layout: Karten für mobile Ansicht, Tabelle für Desktop
    return (
      <>
        {/* Desktop Tabelle */}
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('customerData.name')}>
                  Kunde {renderSortIcon('customerData.name')}
                </th>
                <th onClick={() => handleSort('email')}>
                  E-Mail {renderSortIcon('email')}
                </th>
                <th onClick={() => handleSort('created_at')}>
                  Registriert am {renderSortIcon('created_at')}
                </th>
                <th>Bestellungen</th>
                <th>Tickets</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} onClick={() => handleCustomerSelect(customer)}>
                  <td>
                    <div className="customer-name">
                      <span>{customer.customerData?.name || 'Kein Name'}</span>
                    </div>
                  </td>
                  <td>{customer.email}</td>
                  <td>{formatDate(customer.created_at)}</td>
                  <td>
                    <div className="badge">
                      <FaShoppingBag />
                      <span>{customer.orders ? customer.orders.length : 0}</span>
                    </div>
                  </td>
                  <td>
                    <div className="badge">
                      <FaTicketAlt />
                      <span>{customer.tickets ? customer.tickets.length : 0}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${customer.customerData?.is_premium_member ? 'premium' : 'standard'}`}>
                      {customer.customerData?.is_premium_member ? 'Premium' : 'Standard'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Karten-Ansicht */}
        <div className="mobile-customers-list">
          {customers.map((customer) => (
            <div 
              key={customer.id} 
              className="mobile-customer-card" 
              onClick={() => handleCustomerSelect(customer)}
            >
              <div className="mobile-customer-header">
                <div className="mobile-customer-info">
                  <div className="mobile-customer-name">
                    {customer.customerData?.name || 'Kein Name'}
                  </div>
                  <div className="mobile-customer-email">
                    {customer.email}
                  </div>
                </div>
                <div className="mobile-customer-badges">
                  <span className="customer-number">
                    <FaIdCard />
                    {customer.customerData?.customer_number || customer.customer_number || '-'}
                  </span>
                  <span className={`status-badge ${customer.customerData?.is_premium_member ? 'premium' : 'standard'}`}>
                    {customer.customerData?.is_premium_member ? 'Premium' : 'Standard'}
                  </span>
                </div>
              </div>
              
              <div className="mobile-customer-details">
                <div className="mobile-customer-item">
                  <span className="mobile-customer-label">Registriert am</span>
                  <span className="mobile-customer-value">{formatDate(customer.created_at)}</span>
                </div>
                
                <div className="mobile-customer-item">
                  <span className="mobile-customer-label">Bestellungen</span>
                  <span className="mobile-customer-value">
                    <div className="badge">
                      <FaShoppingBag />
                      <span>{customer.orders ? customer.orders.length : 0}</span>
                    </div>
                  </span>
                </div>
                
                <div className="mobile-customer-item">
                  <span className="mobile-customer-label">Telefon</span>
                  <span className="mobile-customer-value">{customer.customerData?.phone || '-'}</span>
                </div>
                
                <div className="mobile-customer-item">
                  <span className="mobile-customer-label">Tickets</span>
                  <span className="mobile-customer-value">
                    <div className="badge">
                      <FaTicketAlt />
                      <span>{customer.tickets ? customer.tickets.length : 0}</span>
                    </div>
                  </span>
                </div>
              </div>
              
              <div className="mobile-customer-actions">
                <button 
                  className="mobile-customer-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewAllTickets(e, customer.email);
                  }}
                >
                  <FaTicketAlt />
                  <span>Tickets</span>
                </button>
                <button 
                  className="mobile-customer-button primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCustomerSelect(customer);
                  }}
                >
                  <FaUser />
                  <span>Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };
  
  // Seitennavigation rendern
  const renderPagination = () => {
    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(page - 1)} 
          disabled={page === 1}
          className="pagination-button"
        >
          Zurück
        </button>
        
        <span className="pagination-info">
          Seite {page} von {totalPages} (Gesamt: {totalCustomers} Kunden)
        </span>
        
        <button 
          onClick={() => handlePageChange(page + 1)} 
          disabled={page === totalPages}
          className="pagination-button"
        >
          Weiter
        </button>
      </div>
    );
  };
  
  // Filter-Bereich rendern
  const renderFilters = () => {
    return (
      <div className={`filter-container ${showFilters ? 'show' : ''}`}>
        <h3>Filter</h3>
        
        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={filters.hasPurchases}
              onChange={(e) => setFilters({...filters, hasPurchases: e.target.checked})}
            />
            Nur Kunden mit Bestellungen
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={filters.hasTickets}
              onChange={(e) => setFilters({...filters, hasTickets: e.target.checked})}
            />
            Nur Kunden mit Support-Tickets
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={filters.isPremium}
              onChange={(e) => setFilters({...filters, isPremium: e.target.checked})}
            />
            Nur Premium-Kunden
          </label>
        </div>
        
        <div className="filter-actions">
          <button 
            className="reset-filter-button"
            onClick={() => setFilters({
              hasPurchases: false,
              hasTickets: false,
              isPremium: false
            })}
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>
    );
  };
  
  // Kundendetails rendern
  const renderCustomerDetails = () => {
    if (!selectedCustomer) return null;
    
    return (
      <div className="customer-details-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) closeCustomerDetails();
      }}>
        <div className="customer-details-container">
          <div className="customer-details-header">
            <div className="customer-details-title">
              {selectedCustomer.name}
              {selectedCustomer.customer_number && (
                <span className="customer-number-header">#{selectedCustomer.customer_number}</span>
              )}
            </div>
            <div className="customer-details-actions">
              {!isEditing ? (
                <button 
                  className="btn-icon" 
                  onClick={handleEditClick}
                  title="Bearbeiten"
                >
                  <FiEdit />
                </button>
              ) : (
                <>
                  <button 
                    className="btn-icon btn-success" 
                    onClick={handleSaveClick}
                    title="Speichern"
                  >
                    <FiSave />
                  </button>
                  <button 
                    className="btn-icon btn-danger" 
                    onClick={handleCancelClick}
                    title="Abbrechen"
                  >
                    <FiX />
                  </button>
                </>
              )}
              <button 
                className="btn-icon" 
                onClick={closeCustomerDetails}
                title="Schließen"
              >
                <FiX />
              </button>
            </div>
          </div>
          
          <div className="customer-details-content">
            {saveSuccess && (
              <div className="save-message success">
                <FiCheckCircle />
                {saveSuccess}
              </div>
            )}
            
            {saveError && (
              <div className="save-message error">
                <FiAlertCircle />
                {saveError}
              </div>
            )}
            
            <div className="customer-info">
              <h3>Kundeninformationen</h3>
              
              <div className="customer-info-row">
                <div className="customer-info-label">Kundennummer</div>
                <div className="customer-info-value">
                  {editedCustomer.customer_number || '-'}
                </div>
              </div>
              
              <div className="customer-info-row">
                <div className="customer-info-label">Name</div>
                <div className="customer-info-value">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editedCustomer.name || ""}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  ) : (
                    selectedCustomer.name || "-"
                  )}
                </div>
              </div>
              
              <div className="customer-info-row">
                <div className="customer-info-label">E-Mail</div>
                <div className="customer-info-value">
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={editedCustomer.email || ""}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  ) : (
                    selectedCustomer.email || "-"
                  )}
                </div>
              </div>
              
              <div className="customer-info-row">
                <div className="customer-info-label">Telefon</div>
                <div className="customer-info-value">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editedCustomer.phone || ""}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  ) : (
                    selectedCustomer.phone || "-"
                  )}
                </div>
              </div>
              
              <div className="customer-info-row">
                <div className="customer-info-label">Registriert am</div>
                <div className="customer-info-value">
                  {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString('de-DE') : "-"}
                </div>
              </div>
              
              <div className="customer-info-row">
                <div className="customer-info-label">Premium-Status</div>
                <div className="customer-info-value">
                  {isEditing ? (
                    <div className="premium-status-toggle">
                      <input 
                        type="checkbox" 
                        checked={editedCustomer.is_premium || false}
                        onChange={(e) => handleInputChange('is_premium', e.target.checked)}
                        id="premium-toggle"
                      />
                      <label htmlFor="premium-toggle">Premium-Kunde</label>
                    </div>
                  ) : (
                    selectedCustomer.is_premium ? "Premium-Kunde" : "Standard-Kunde"
                  )}
                </div>
              </div>
            </div>
            
            <div className="customer-tickets">
              <h3>Tickets</h3>
              {selectedCustomer.tickets && selectedCustomer.tickets.length > 0 ? (
                <div className="customer-tickets-list">
                  {selectedCustomer.tickets.map(ticket => (
                    <div key={ticket.id} className="customer-ticket-item">
                      <div className="ticket-title">{ticket.title}</div>
                      <div className="ticket-date">
                        {new Date(ticket.created_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="ticket-status">{ticket.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Keine Tickets vorhanden.</p>
              )}
            </div>
            
            <div className="customer-orders">
              <h3>Bestellungen</h3>
              {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                <div className="customer-tickets-list">
                  {selectedCustomer.orders.map(order => (
                    <div key={order.id} className="customer-ticket-item">
                      <div className="ticket-title">Bestellung #{order.id}</div>
                      <div className="ticket-date">
                        {new Date(order.created_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="ticket-status">{order.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Keine Bestellungen vorhanden.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`admin-customers-page ${isMobileView ? 'show-mobile-view' : 'show-desktop-view'}`}>
      <div className="admin-customers-header">
        <div className="admin-customers-actions">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Kunden suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filter
          </button>
        </div>
      </div>
      
      <div className="admin-customers-content">
        {renderFilters()}
        
        <div className="customers-content">
          {renderCustomersTable()}
          {renderPagination()}
        </div>
      </div>
      
      {renderCustomerDetails()}
    </div>
  );
};

export default AdminCustomers; 