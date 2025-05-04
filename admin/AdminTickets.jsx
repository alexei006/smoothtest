import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FaEye, FaTimes, FaCheck, FaPlus, FaDatabase, FaFilter, FaTools, FaSync, FaSortAmountDown, FaSortAmountUp, FaSearch, FaTicketAlt, FaEyeSlash } from 'react-icons/fa';
import {
  getAllSupportTickets,
  getSupportTicketDetails,
  updateSupportTicketStatus,
  addSupportTicketResponse
} from '../../services/dashboardService';
import './AdminTickets.css';

// Inline-Styles für die UI-Elemente (Fallback, wenn CSS nicht richtig geladen wird)
const styles = {
  searchBarContainer: {
    width: '100%',
    marginBottom: '1rem'
  },
  searchBar: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    border: '1px solid #dfe1e5',
    borderRadius: '5px',
    overflow: 'hidden',
    width: '100%',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  searchIcon: {
    color: '#5f6368',
    marginLeft: '10px',
    fontSize: '1rem'
  },
  searchInput: {
    flexGrow: 1,
    border: 'none',
    padding: '12px 15px 12px 8px',
    fontSize: '0.95rem',
    color: '#3e4852',
    background: 'transparent',
    outline: 'none'
  },
  searchCategorySelect: {
    marginLeft: 'auto',
    padding: '10px 15px',
    border: 'none',
    borderLeft: '1px solid #dfe1e5',
    backgroundColor: '#f8f9fa',
    color: '#3e4852',
    fontSize: '0.9rem',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '120px'
  },
  toggleClosedButton: {
    padding: '0.6rem 1.1rem',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #dfe1e5',
    backgroundColor: '#fff',
    color: '#3e4852',
    height: '40px',
    minWidth: '180px'
  },
  actionButtonsRow: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    gap: '10px',
    alignItems: 'center'
  },
  actionButtonsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }
};

// Status-Optionen
const TICKET_STATUS_OPTIONS = [
  "offen",
  "in Bearbeitung",
  "beantwortet",
  "geschlossen",
  "wartet auf Kundenantwort"
];

const AdminTickets = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State für Details wiederherstellen
  const [responseMessage, setResponseMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // NEU: State für Hintergrundaktualisierung
  
  // Pagination und Filter State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20); // Standardlimit
  const [filters, setFilters] = useState({ 
    status: 'all', 
    startDate: '', 
    endDate: '',
    hideClosedTickets: false
  });
  const [filterForm, setFilterForm] = useState({ 
    status: 'all', 
    startDate: '', 
    endDate: '',
    hideClosedTickets: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // State für erweiterte Suche und Sortierung
  const [sortBy, setSortBy] = useState('created_at_desc'); // Standard: Neueste zuerst
  const [searchTerm, setSearchTerm] = useState(''); // State für Live-Suche
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // State für debounced Suche

  // URL-Parameter für die Suche verarbeiten
  useEffect(() => {
    // URL-Parameter auslesen
    const searchParams = new URLSearchParams(location.search);
    const searchFromURL = searchParams.get('search');
    
    if (searchFromURL) {
      console.log('Suchbegriff aus URL gefunden:', searchFromURL);
      setSearchTerm(searchFromURL);
      // SearchTerm wird automatisch in debouncedSearchTerm umgewandelt durch den anderen useEffect
    }
  }, [location.search]); // Nur bei Änderung der URL ausführen

  // Debounce für die Suche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms Verzögerung

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // --- Standard Datenladefunktion (angepasst für Suche und Hintergrund-Refresh) --- 
  const loadTickets = async (isBackgroundRefresh = false) => { // NEU: Parameter hinzugefügt
    try {
      const sortField = 'created_at';
      const sortOrder = sortBy === 'created_at_desc' ? 'desc' : 'asc';
      const sortLabel = sortBy === 'created_at_desc' ? 'Neueste zuerst' : 'Älteste zuerst';

      console.log(`### START: Lade Tickets ###`, { page, filters, searchTerm: debouncedSearchTerm, sortBy: sortLabel, isBackgroundRefresh });
      
      // Nur bei normalen Ladevorgängen den Loading-Zustand setzen
      if (!isBackgroundRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true); // Für Hintergrundaktualisierung separaten State verwenden
      }
      
      setError('');

      // Erweiterte Filter anwenden
      const enhancedFilters = { ...filters };
      
      // Geschlossene Tickets ausblenden, wenn Option aktiviert
      if (filters.hideClosedTickets) {
        enhancedFilters.excludeStatus = 'geschlossen';
      }

      // Rufe die Service-Funktion mit Suchbegriff (ohne Kategorie - sucht in allen Feldern)
      const result = await getAllSupportTickets(
          enhancedFilters, 
          page, 
          limit, 
          sortField,
          sortOrder,
          debouncedSearchTerm // Suchbegriff übergeben (ohne Kategorie-Parameter)
      );

      if (!result || !result.tickets) {
        console.warn('!!! Keine gültigen Daten von getAllSupportTickets erhalten !!!');
        setError('Konnte Tickets nicht laden oder keine Tickets gefunden.');
        setTickets([]);
        setTotalPages(1);
        if (!isBackgroundRefresh) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
        return;
      }

      console.log(`### EMPFANGEN (${result.tickets.length} Tickets, ${result.totalPages} Seiten) ###`);

      // Bei Hintergrundaktualisierung die Tickets nur aktualisieren, wenn sich etwas geändert hat
      if (isBackgroundRefresh) {
        // Vergleiche die neuen Tickets mit den aktuellen - nur aktualisieren wenn nötig
        const ticketsChanged = JSON.stringify(result.tickets) !== JSON.stringify(tickets);
        
        if (ticketsChanged) {
          console.log('Neue Ticketdaten erkannt, aktualisiere UI');
          setTickets(result.tickets);
          setTotalPages(result.totalPages || 1);
        } else {
          console.log('Keine Änderungen an Tickets erkannt, UI bleibt unverändert');
        }
      } else {
        // Normales Laden: Immer aktualisieren
        setTickets(result.tickets);
        setTotalPages(result.totalPages || 1);
      }

    } catch (err) {
      console.error('!!! FEHLER BEIM LADEN DER TICKETS über Service:', err);
      setError(`Fehler beim Laden: ${err.message || 'Unbekannter Fehler'}`);
      setTickets([]);
      setTotalPages(1);
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // --- useEffect für initiales Laden und bei Filter/Seiten/Sortierungs/Suche wechsel ---
  useEffect(() => {
    console.log('useEffect Triggered: Lade Tickets (Abhängigkeit geändert: page, filters, sortBy, debouncedSearchTerm)...');
    loadTickets(false); // Explizit als normales Laden kennzeichnen
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [page, filters, sortBy, debouncedSearchTerm]);

  // Neue automatische Aktualisierung alle 30 Sekunden
  useEffect(() => {
    console.log('Auto-Refresh aktiviert: Tickets werden alle 30 Sekunden aktualisiert');
    // Initialer Ladevorgang bereits durch andere useEffect abgedeckt
    
    // Interval für automatische Aktualisierung
    const refreshInterval = setInterval(() => {
      console.log('Auto-Refresh: Lade Tickets im Hintergrund...');
      loadTickets(true); // NEU: Parameter für Hintergrund-Refresh übergeben
    }, 30000); // 30 Sekunden
    
    // Cleanup-Funktion
    return () => {
      console.log('Auto-Refresh deaktiviert');
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Leeres Dependency-Array = nur beim ersten Laden ausführen

  // === NEU: useEffect für automatische Filteranwendung ===
  useEffect(() => {
    console.log('Filter Form changed, applying filters automatically:', filterForm);
    setFilters(filterForm); // Aktualisiere den tatsächlichen Filter-State
    setPage(1); // Immer zur ersten Seite, wenn Filter geändert werden
  }, [filterForm]); // Abhängigkeit vom filterForm-State

  // --- Hilfsfunktionen --- 
  
  // Details laden (vereinfacht)
  const loadTicketDetails = async (ticketId) => {
    setLoading(true); 
    try {
        const details = await getSupportTicketDetails(ticketId);
        if(details) {
            setSelectedTicket(details);
            setNewStatus(details.status);
            setError('');
        } else {
             setError('Ticket-Details konnten nicht geladen werden.');
        }
    } catch(err) {
         setError('Fehler beim Laden der Ticket-Details.');
         console.error("Detail Load Error:", err);
    } finally {
        setLoading(false);
    }
  };
  
  // Antwort senden
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !responseMessage.trim()) return;
    setIsSubmitting(true);
    setError(''); // Fehler zurücksetzen
    setSuccessMessage(''); // Erfolgsmeldung zurücksetzen

    try {
        // Schritt 1: Antwort in DB speichern
        console.log('Versuche Antwort zu speichern...', { ticketId: selectedTicket.id, isInternal: isInternalNote });
        await addSupportTicketResponse(selectedTicket.id, {
            message: responseMessage,
            fromAdmin: true, // Admin antwortet
            isInternal: isInternalNote
        });
        
        // Wenn wir hier ankommen, war das Speichern erfolgreich
        console.log('Antwort erfolgreich in DB gespeichert.');
        setResponseMessage('');
        setIsInternalNote(false);
        setSuccessMessage('Antwort gespeichert. (E-Mail-Versand erfolgt im Hintergrund)');
        
        // Details neu laden, um Antwort zu sehen
        loadTicketDetails(selectedTicket.id); 
        // Ticketliste neu laden, falls sich Status geändert hat
        loadTickets(); 
        
    } catch (err) {
        // Detaillierte Fehlermeldung
        console.error("Fehler beim Speichern/Verarbeiten der Antwort:", err);
        let errorMessage = 'Fehler beim Speichern der Antwort.';
        if (err.message) {
            // Versuche, spezifischere Fehler zu erkennen
            if (err.message.toLowerCase().includes('email') || err.message.toLowerCase().includes('smtp') || err.message.toLowerCase().includes('send')) {
                errorMessage = 'Antwort wurde gespeichert, aber Fehler beim E-Mail-Versand im Hintergrund. Bitte E-Mail-Einstellungen prüfen.';
            } else {
                errorMessage = `Fehler beim Speichern: ${err.message}`;
            }
        }
        setError(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Status aktualisieren
  const handleUpdateStatus = async () => {
    if (!selectedTicket || isSubmitting || newStatus === selectedTicket.status) return;
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
        await updateSupportTicketStatus(selectedTicket.id, newStatus);
        setSuccessMessage(`Status erfolgreich auf "${newStatus}" geändert.`);
        setSelectedTicket({...selectedTicket, status: newStatus});
        loadTickets(); // Tickets in der Liste aktualisieren
    } catch (err) {
        setError('Fehler beim Aktualisieren des Status.');
        console.error('Status-Update-Error:', err);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Ein Ticket für die Detailansicht auswählen
  const selectTicket = (ticket) => {
      // Zuerst Grunddaten setzen (für schnelles UI-Feedback, aber ggf. veraltet)
      setSelectedTicket(ticket); 
      setNewStatus(ticket.status);
      setError('');
      setResponseMessage('');
      setIsInternalNote(false);
      
      // === WICHTIG: Sofort die aktuellsten Details laden ===
      console.log(`Ticket ausgewählt (ID: ${ticket.id}), lade aktuelle Details...`);
      loadTicketDetails(ticket.id); // Lädt Ticket + Antworten neu
      
      // Klasse zum Body hinzufügen, um den Toggle Button auszublenden
      document.body.classList.add('ticket-overlay-active'); 
  };

  // Status-Änderung im Formular
  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  // Sortierungsänderung
  const handleSortChange = () => {
    setSortBy(prevSortBy =>
      prevSortBy === 'created_at_desc' ? 'created_at_asc' : 'created_at_desc'
    );
    setPage(1); // Bei Sortierungsänderung immer zur Seite 1
  };

  // Toggle für geschlossene Tickets
  const toggleHideClosedTickets = () => {
    const newValue = !filterForm.hideClosedTickets;
    setFilterForm(prev => ({ ...prev, hideClosedTickets: newValue }));
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    const initialFilters = { 
      status: 'all', 
      startDate: '', 
      endDate: '',
      hideClosedTickets: false
    };
    setFilterForm(initialFilters); // Formular zurücksetzen (löst useEffect aus)
    
    // Suchfeld nicht zurücksetzen, wenn es von einem URL-Parameter gesetzt wurde
    const searchParams = new URLSearchParams(location.search);
    const searchFromURL = searchParams.get('search');
    if (!searchFromURL) {
      setSearchTerm(''); // Suchfeld nur zurücksetzen, wenn es nicht von der URL gesetzt wurde
    }
  };
  
  // Filter Formular Änderungen
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Paginierung
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Datum formatieren
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute: '2-digit' });
    } catch { return dateString; }
  };

  // Text kürzen
  const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Status Badge
  const getStatusBadge = (status) => {
     const statusMap = {
      'offen': { color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.1)' },
      'in Bearbeitung': { color: '#fd7e14', bgColor: 'rgba(253, 126, 20, 0.1)' },
      'beantwortet': { color: '#007bff', bgColor: 'rgba(0, 123, 255, 0.1)' },
      'geschlossen': { color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.1)' },
      'wartet auf Kundenantwort': { color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.1)' }
    };
    const statusInfo = statusMap[status] || { color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.1)' };
    return (
      <span className="status-badge" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}>
        {status}
      </span>
    );
  };

  // Detailansicht schließen
  const closeTicketDetails = () => {
    setSelectedTicket(null);
    // Klasse vom Body entfernen
    document.body.classList.remove('ticket-overlay-active');
  };

  // Funktion zum Setzen/Entfernen der Scroll-Sperre für den Body
  useEffect(() => {
    // Wenn das Ticket-Detail-Overlay aktiv ist, Scroll sperren
    if (selectedTicket) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Andernfalls normale Scrollfunktion wiederherstellen
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    // Cleanup-Funktion für useEffect
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [selectedTicket]);

  // --- JSX RENDERING --- 
  return (
    <div className="admin-tickets-container">
      {/* Header und Filter-Bereich */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="admin-tickets-header" style={{padding: '10px 15px 5px 15px'}}>
          {/* Fehlermeldungen */}
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
        
        {/* Kompakterer Filter-Bereich */}
        <div style={{
          padding: '10px 15px 15px 15px', /* Reduziertes Padding */
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px'
        }}>
          {/* Suchleiste */}
          <div className="search-container" style={{marginBottom: '12px'}}>
            <FaSearch className="search-icon" />
            <input 
              type="text"
              className="search-input"
              placeholder="Suche nach Ticketnummer, Betreff, Kunde, Status oder Datum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Aktionsbuttons - kompaktere Version */}
          <div className="action-buttons-row">
            {/* Alle Buttons in einer Reihe */}
            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between'}}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="filter-button"
              >
                <FaFilter /> Filter {showFilters ? 'ausblenden' : 'einblenden'}
              </button>
              
              <button 
                onClick={toggleHideClosedTickets}
                className="filter-button"
              >
                {filterForm.hideClosedTickets ? (
                  <><FaEye /> <span>Geschlossen einblenden</span></>
                ) : (
                  <><FaEyeSlash /> <span>Geschlossen ausblenden</span></>
                )}
              </button>
              
              <button 
                onClick={handleSortChange}
                className="filter-button"
              >
                {sortBy === 'created_at_desc' ? (
                  <><FaSortAmountDown /> <span>Neueste zuerst</span></>
                ) : (
                  <><FaSortAmountUp /> <span>Älteste zuerst</span></>
                )}
              </button>
            </div>
          </div>
          
          {/* Erweiterter Filter-Dialog - kompakter */}
          {showFilters && (
            <div className="filter-panel compact" style={{marginTop: '12px'}}>
              <div className="filter-row">
                <div className="filter-group">
                  <label>Status</label>
                  <select 
                    name="status" 
                    value={filterForm.status} 
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '6px 8px', /* Reduziertes Padding */
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '0.85rem' /* Kleinere Schrift */
                    }}
                  >
                    <option value="all">Alle Status</option>
                    {TICKET_STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Von Datum</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={filterForm.startDate} 
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '6px 8px', /* Reduziertes Padding */
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '0.85rem' /* Kleinere Schrift */
                    }}
                  />
                </div>
                <div className="filter-group">
                  <label>Bis Datum</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={filterForm.endDate} 
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '6px 8px', /* Reduziertes Padding */
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '0.85rem' /* Kleinere Schrift */
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '10px' /* Reduzierter Abstand */
              }}>
                <button 
                  onClick={resetFilters}
                  style={{
                    padding: '6px 12px', /* Reduziertes Padding */
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dae0e5',
                    borderRadius: '4px',
                    fontSize: '0.85rem', /* Kleinere Schrift */
                    cursor: 'pointer'
                  }}
                >
                  Filter zurücksetzen
                </button>
                <button 
                  onClick={() => {
                    setFilters({...filterForm});
                    setPage(1);
                    loadTickets();
                  }}
                  style={{
                    padding: '6px 12px', /* Reduziertes Padding */
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    fontSize: '0.85rem', /* Kleinere Schrift */
                    cursor: 'pointer'
                  }}
                >
                  Anwenden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Ticketliste */}
      <div className="tickets-content">
        {loading && !tickets.length ? (
          <div className="loading-indicator">Tickets werden geladen...</div>
        ) : tickets.length === 0 ? (
          <div className="no-tickets-message">Keine Support-Tickets gefunden (mit aktuellen Filtern).</div>
        ) : (
          <>
          {/* Ticket-Zähler - Über den Tickets sichtbar auf allen Geräten */}
          <div style={{
            marginBottom: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f0f4f8',
            padding: '10px 15px',
            borderRadius: '5px',
            fontSize: '0.9rem',
            position: 'relative'
          }}>
            <div>
              <strong>Tickets: {tickets.length}</strong> von {totalPages * limit} 
              {totalPages > 1 && <span> (Seite {page} von {totalPages})</span>}
            </div>
            {isRefreshing && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 10px',
                borderRadius: '15px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <FaSync style={{ animation: 'spin 1s linear infinite' }} /> Aktualisiere...
              </div>
            )}
            {totalPages > 1 && (
              <div className="pagination-mobile" style={{
                display: 'flex',
                gap: '10px'
              }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePageChange(page - 1); }} 
                  disabled={page === 1}
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: page === 1 ? '#f1f1f1' : '#fff',
                    opacity: page === 1 ? 0.7 : 1
                  }}
                >←</button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePageChange(page + 1); }} 
                  disabled={page === totalPages}
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: page === totalPages ? '#f1f1f1' : '#fff',
                    opacity: page === totalPages ? 0.7 : 1
                  }}
                >→</button>
              </div>
            )}
          </div>

          {/* Mobile Ansicht (Karten) */}
          <div className="tickets-list-mobile">
            {tickets.map(ticket => (
              <div key={ticket.id} className="ticket-card clickable-row" onClick={() => selectTicket(ticket)}>
                <div className="ticket-card-header">
                  <span className="ticket-card-number">{ticket.ticketNumber || 'Unbekannt'}</span>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="ticket-card-subject">{truncateText(ticket.subject, 50)}</div>
                <div className="ticket-card-customer">{truncateText(ticket.customerName, 30)}</div>
                <div className="ticket-card-date">{formatDate(ticket.createdAt)}</div>
              </div>
            ))}
          </div>

          {/* Desktop Ansicht (Tabelle) */}
          <div className="tickets-list-container desktop-only">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Ticket-Nr.</th>
                  <th>Betreff</th>
                  <th>Kunde</th>
                  <th>Datum</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="ticket-row clickable-row" onClick={() => selectTicket(ticket)}>
                    <td>{ticket.ticketNumber || 'Unbekannt'}</td>
                    <td>{truncateText(ticket.subject)}</td>
                    <td>{truncateText(ticket.customerName)}</td>
                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Verbesserte Paginierung - Nur für Desktop sichtbar und größere Buttons */}
          {totalPages > 1 && (
            <div className="pagination desktop-only" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0',
              gap: '10px'
            }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePageChange(1); }} 
                disabled={page === 1}
                style={{
                  padding: '8px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa'
                }}
              >«</button>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePageChange(page - 1); }} 
                disabled={page === 1}
                style={{
                  padding: '8px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa'
                }}
              >Vorherige</button>
              
              {/* Seitenzahlen */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    // Weniger als 5 Seiten: Zeige alle Seitenzahlen
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    // Nahe am Anfang
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    // Nahe am Ende
                    pageNum = totalPages - 4 + i;
                  } else {
                    // In der Mitte: Zeige 2 Seiten vor und nach der aktuellen
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={(e) => { e.stopPropagation(); handlePageChange(pageNum); }}
                      style={{
                        padding: '8px 15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: page === pageNum ? '#007bff' : '#f8f9fa',
                        color: page === pageNum ? 'white' : 'inherit',
                        fontWeight: page === pageNum ? 'bold' : 'normal'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handlePageChange(page + 1); }} 
                disabled={page === totalPages}
                style={{
                  padding: '8px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa'
                }}
              >Nächste</button>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePageChange(totalPages); }} 
                disabled={page === totalPages}
                style={{
                  padding: '8px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa'
                }}
              >»</button>
              
              <span style={{ 
                marginLeft: '15px', 
                fontSize: '0.9rem',
                color: '#6c757d'
              }}>
                Seite {page} von {totalPages} ({tickets.length} von {totalPages * limit} Tickets)
              </span>
            </div>
          )}
          </>
        )}
      </div>

      {/* Ticket-Details */} 
      {selectedTicket && (
        <div className="ticket-details-overlay scroll-lock-overlay" onClick={closeTicketDetails}>
           <div 
              className="ticket-details-container" 
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-button" onClick={closeTicketDetails}>×</button>
              <h2>{selectedTicket.ticketNumber}: {selectedTicket.subject}</h2>
               <div className="ticket-info-section">
                 <div className="ticket-info-row">
                   <span className="info-label">Kunde:</span>
                   <span className="info-value">{selectedTicket.customerName}</span>
                 </div>
                 <div className="ticket-info-row">
                   <span className="info-label">E-Mail:</span>
                   <span className="info-value">{selectedTicket.email}</span>
                 </div>
                 <div className="ticket-info-row">
                   <span className="info-label">Erstellt am:</span>
                   <span className="info-value">{formatDate(selectedTicket.createdAt)}</span>
                 </div>
                 <div className="ticket-info-row">
                   <span className="info-label">Betreff:</span>
                   <span className="info-value">{selectedTicket.subject}</span>
                 </div>
                 <div className="ticket-info-row super-compact-status-row">
                   <span className="info-label">STATUS:</span>
                   <div className="compact-status-content">
                     <select 
                       value={newStatus} 
                       onChange={handleStatusChange}
                       className="status-select"
                     >
                       {TICKET_STATUS_OPTIONS.map(status => (
                         <option key={status} value={status}>{status}</option>
                       ))}
                     </select>
                     <button 
                       className="save-status-button"
                       onClick={handleUpdateStatus}
                       disabled={isSubmitting || newStatus === selectedTicket.status}
                     >
                       <FaCheck />
                     </button>
                   </div>
                 </div>
               </div>
               <div className="ticket-message-section">
                 <h4>Ursprüngliche Nachricht</h4>
                 <div className="ticket-message">{selectedTicket.message || 'Keine Nachricht'}</div>
               </div>
                {/* Antworten anzeigen (falls vorhanden) */}
                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                    <div className="ticket-responses-section">
                        <h4>Verlauf</h4>
                        <div className="ticket-responses">
                            {selectedTicket.responses
                              // Sortiere Antworten nach Zeitstempel (älteste zuerst)
                              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                              .map((response, index) => (
                                <div 
                                    key={response.id || `resp-${index}`} 
                                    // Klassen für Styling basierend auf Sender und Typ
                                    className={`response-item ${response.fromAdmin ? 'admin-response' : 'customer-response'} ${response.isInternal ? 'internal-note' : ''}`}
                                >
                                    <div className="response-header">
                                        <span className="response-author">
                                            {response.isInternal 
                                                ? 'Interne Notiz (Admin)' 
                                                : response.fromAdmin 
                                                    ? 'Admin' 
                                                    : selectedTicket.customerName}
                                        </span>
                                        <span className="response-date">{formatDate(response.timestamp)}</span>
                                        {/* Badge für interne Notizen */}
                                        {response.isInternal && <span className="internal-badge">Nur für Admins</span>}
                                    </div>
                                    <div className="response-content">{response.message}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
               {/* Antwortbereich */} 
               <div className="ticket-reply-section">
                 <h4>Antworten</h4>
                 <form onSubmit={handleSubmitResponse}>
                   <div className="form-group">
                     <textarea 
                       value={responseMessage}
                       onChange={(e) => setResponseMessage(e.target.value)}
                       placeholder="Ihre Antwort..."
                       rows={4}
                       required
                     ></textarea>
                   </div>
                   <div className="form-options">
                     <label className="checkbox-label">
                       <input 
                         type="checkbox"
                         checked={isInternalNote}
                         onChange={(e) => setIsInternalNote(e.target.checked)}
                       />
                       Interne Notiz (nur für Admins sichtbar)
                     </label>
                   </div>
                   <div className="form-actions">
                     <button 
                       type="submit"
                       className="submit-button"
                       disabled={isSubmitting || !responseMessage.trim()}
                     >
                       {isSubmitting ? 'Sende...' : 'Antwort senden'}
                     </button>
                   </div>
                 </form>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets; 