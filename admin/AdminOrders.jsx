import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaSearch, FaFilter, FaTimes, FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import { getAllOrders, getOrderDetails, updateOrderStatus } from '../../services/dashboardService';
import './AdminOrders.css';

const AdminOrders = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // State für die Bestellungen
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filter
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });
  
  // Filterformular-State
  const [filterForm, setFilterForm] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });
  
  // Filter-Dialog-State
  const [showFilters, setShowFilters] = useState(false);
  
  // Status-Bearbeitungsmodus
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Bestellungen laden
  useEffect(() => {
    loadOrders();
  }, [page, filters]);
  
  // Bestellung laden, wenn ID in der URL vorhanden ist
  useEffect(() => {
    if (orderId) {
      loadOrderDetails(orderId);
    } else {
      setSelectedOrder(null);
    }
  }, [orderId]);
  
  // Alle Bestellungen mit Filtern laden
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await getAllOrders(filters, page, limit);
      
      setOrders(result.orders);
      setTotalPages(result.totalPages);
      
    } catch (err) {
      console.error('Fehler beim Laden der Bestellungen:', err);
      setError('Die Bestellungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };
  
  // Details zu einer Bestellung laden
  const loadOrderDetails = async (id) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Detaillierte Bestelldaten laden
      const orderDetails = await getOrderDetails(id);
      
      setSelectedOrder(orderDetails);
      setNewStatus(orderDetails.lieferstatus);
      
    } catch (err) {
      console.error('Fehler beim Laden der Bestellungsdetails:', err);
      setError('Die Bestellungsdetails konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };
  
  // Status einer Bestellung aktualisieren
  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      
      await updateOrderStatus(selectedOrder.id, newStatus);
      
      // Details neu laden
      await loadOrderDetails(selectedOrder.id);
      
      // Hauptliste neu laden
      await loadOrders();
      
      setIsEditingStatus(false);
      setSuccessMessage('Bestellstatus wurde erfolgreich aktualisiert');
      
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Bestellstatus:', err);
      setError('Der Bestellstatus konnte nicht aktualisiert werden.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Filter zurücksetzen
  const resetFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      status: 'all'
    };
    
    setFilterForm(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  };
  
  // Filter anwenden
  const applyFilters = (e) => {
    e.preventDefault();
    setFilters(filterForm);
    setPage(1);
    setShowFilters(false);
  };
  
  // Formularänderungen verarbeiten
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Status-Farben und -Texte
  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { text: 'Abgeschlossen', color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.1)' },
      'processing': { text: 'In Bearbeitung', color: '#fd7e14', bgColor: 'rgba(253, 126, 20, 0.1)' },
      'shipped': { text: 'Versendet', color: '#007bff', bgColor: 'rgba(0, 123, 255, 0.1)' },
      'cancelled': { text: 'Storniert', color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.1)' },
      'pending': { text: 'Ausstehend', color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.1)' },
      'ausstehend': { text: 'Ausstehend', color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.1)' },
    };

    const statusInfo = statusMap[status] || { text: status, color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.1)' };
    
    return (
      <span className="status-badge" style={{ 
        color: statusInfo.color,
        backgroundColor: statusInfo.bgColor
      }}>
        {statusInfo.text}
      </span>
    );
  };
  
  // Formatieren des Datums
  const formatDate = (dateString) => {
    if (!dateString) return 'Kein Datum';
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  // Formatieren des Betrags
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount || 0);
  };
  
  // Detailansicht schließen
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setIsEditingStatus(false);
    navigate('/admin/orders');
  };
  
  // Kundeninformationen anzeigen
  const getCustomerInfo = (order) => {
    if (!order || !order.benutzer) return 'Kein Kunde';
    
    const email = order.benutzer.email || 'Keine E-Mail';
    const userData = order.benutzer.raw_user_meta_data || {};
    const name = userData.name || userData.full_name || 'Unbekannt';
    
    return `${name} (${email})`;
  };
  
  // Zu einer Seite wechseln
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  
  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="admin-orders-actions">
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filter
          </button>
        </div>
      </div>
      
      {/* Filter-Dialog */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Filter</h3>
            <button className="close-button" onClick={() => setShowFilters(false)}>
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={applyFilters}>
            <div className="filter-group">
              <label>Status</label>
              <select 
                name="status" 
                value={filterForm.status}
                onChange={handleFilterChange}
              >
                <option value="all">Alle Status</option>
                <option value="ausstehend">Ausstehend</option>
                <option value="processing">In Bearbeitung</option>
                <option value="shipped">Versendet</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Storniert</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Von Datum</label>
              <input 
                type="date" 
                name="startDate"
                value={filterForm.startDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="filter-group">
              <label>Bis Datum</label>
              <input 
                type="date" 
                name="endDate"
                value={filterForm.endDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="filter-buttons">
              <button type="button" onClick={resetFilters} className="reset-button">
                Zurücksetzen
              </button>
              <button type="submit" className="apply-button">
                Filter anwenden
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Bestellungs-Tabelle */}
      <div className="orders-table-container">
        {loading && !selectedOrder ? (
          <div className="loading-indicator">
            Bestellungen werden geladen...
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders-message">
            Keine Bestellungen gefunden.
          </div>
        ) : (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Bestellnummer</th>
                  <th>Datum</th>
                  <th>Kunde</th>
                  <th>Betrag</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="order-row">
                    <td>#{order.id.slice(0, 8)}</td>
                    <td>{formatDate(order.bestelldatum)}</td>
                    <td>{getCustomerInfo(order)}</td>
                    <td>{formatCurrency(order.gesamtsumme)}</td>
                    <td>{getStatusBadge(order.lieferstatus)}</td>
                    <td>
                      <button 
                        className="action-button view-button"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <FaEye /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Vorherige
                </button>
                
                <span className="page-info">Seite {page} von {totalPages}</span>
                
                <button 
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={page === totalPages}
                  className="pagination-button"
                >
                  Nächste
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Bestelldetails */}
      {selectedOrder && (
        <div className="order-details-overlay">
          <div className="order-details-container">
            <div className="order-details-header">
              <h3>Bestelldetails #{selectedOrder.id.slice(0, 8)}</h3>
              <button className="close-button" onClick={closeOrderDetails}>
                <FaTimes />
              </button>
            </div>
            
            <div className="order-details-content">
              <div className="order-info-section">
                <div className="order-info-row">
                  <span className="info-label">Bestellt am:</span>
                  <span className="info-value">{formatDate(selectedOrder.bestelldatum)}</span>
                </div>
                
                <div className="order-info-row">
                  <span className="info-label">Kunde:</span>
                  <span className="info-value">{getCustomerInfo(selectedOrder)}</span>
                </div>
                
                <div className="order-info-row">
                  <span className="info-label">Gesamtbetrag:</span>
                  <span className="info-value">{formatCurrency(selectedOrder.gesamtsumme)}</span>
                </div>
                
                <div className="order-info-row">
                  <span className="info-label">Status:</span>
                  {isEditingStatus ? (
                    <div className="status-edit-container">
                      <select 
                        value={newStatus} 
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="status-select"
                      >
                        <option value="ausstehend">Ausstehend</option>
                        <option value="processing">In Bearbeitung</option>
                        <option value="shipped">Versendet</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="cancelled">Storniert</option>
                      </select>
                      <button 
                        className="save-status-button"
                        onClick={handleStatusUpdate}
                        disabled={isSaving}
                      >
                        <FaSave /> {isSaving ? 'Wird gespeichert...' : 'Speichern'}
                      </button>
                      <button 
                        className="cancel-status-button"
                        onClick={() => {
                          setIsEditingStatus(false);
                          setNewStatus(selectedOrder.lieferstatus);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="status-display">
                      {getStatusBadge(selectedOrder.lieferstatus)}
                      <button 
                        className="edit-status-button"
                        onClick={() => setIsEditingStatus(true)}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="order-items-section">
                <h4>Bestellte Artikel</h4>
                
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Produkt</th>
                        <th>Menge</th>
                        <th>Einzelpreis</th>
                        <th>Gesamt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.produktname}</td>
                          <td>{item.menge}</td>
                          <td>{formatCurrency(item.einzelpreis)}</td>
                          <td>{formatCurrency(item.menge * item.einzelpreis)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-items-message">Keine Artikel in dieser Bestellung.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 