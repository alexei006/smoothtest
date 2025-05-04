import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaBox, 
  FaUsers, 
  FaHeadset,
  FaCog, 
  FaArrowLeft, 
  FaSearch,
  FaBars,
  FaTimes,
  FaChartLine,
  FaSignOutAlt
} from 'react-icons/fa';
import './AdminDashboard.css';

// Services
import { getRevenueStats, getRecentOrders, getOpenTickets } from '../../services/dashboardService';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State für Daten
  const [dateRange, setDateRange] = useState(30);
  const [stats, setStats] = useState({
    ecommerceRevenue: 0,
    newCustomers: 0,
    repeatPurchaseRate: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    chartData: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daten laden
  useEffect(() => {
    // Nur Dashboard-Daten laden, wenn wir auf der Hauptseite /admin sind
    if (location.pathname === '/admin') {
      fetchDashboardData();
    } else {
      // Für andere Seiten muss Outlet die Ladeanzeige verwalten
      setLoading(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log(`Lade Dashboard-Daten für ${dateRange} Tage...`);

      // Daten parallel laden
      const [revenueStats, orders, tickets] = await Promise.all([
        getRevenueStats(dateRange), 
        getRecentOrders(5),     
        getOpenTickets(5)       
      ]);

      // Umsatzdaten setzen
      setStats({
        ecommerceRevenue: revenueStats.totalRevenue || 0,
        newCustomers: revenueStats.totalOrders || 0,
        repeatPurchaseRate: 75.12, // Beispielwert, in zukünftigen Updates mit echten Daten ersetzen
        averageOrderValue: revenueStats.totalRevenue / (revenueStats.totalOrders || 1),
        conversionRate: 32.65, // Beispielwert, in zukünftigen Updates mit echten Daten ersetzen
        chartData: revenueStats.chartData || []
      });

      // Bestellungen formatieren und setzen
      const formattedOrders = orders.map(order => ({
        id: order.id,
        product: `Bestellung #${order.id.toString().slice(0, 6)}`,
        customer: order.customer?.name || 'Unbekannter Kunde',
        date: new Date(order.createdAt).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        status: order.status || 'In Bearbeitung'
      }));
      setRecentOrders(formattedOrders);

      // Top-Produkte (Beispieldaten, in Zukunft durch echte Daten ersetzen)
      setTopProducts([
        { id: '2441310', name: 'Snicker Vento', sales: 128 },
        { id: '1241318', name: 'Blue Backpack', sales: 401 },
        { id: '8441573', name: 'Water Bottle', sales: 324 }
      ]);

      // Top-Kunden (Beispieldaten, in Zukunft durch echte Daten ersetzen)
      setTopCustomers([
        { id: 1, name: 'Max Mustermann', orders: 25 },
        { id: 2, name: 'Anna Schmidt', orders: 15 },
        { id: 3, name: 'Peter Müller', orders: 23 }
      ]);

      // Support-Tickets
      const formattedTickets = tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.betreff || 'Kein Betreff',
        customer: ticket.customer?.name || 'Unbekannter Kunde',
        status: ticket.status || 'Offen'
      }));
      setOpenTickets(formattedTickets);

    } catch (error) {
      console.error("Fehler beim Laden der Dashboard-Daten:", error);
      // Fehlerbehandlung - Default-Werte setzen
      setStats({
        ecommerceRevenue: 0,
        newCustomers: 0,
        repeatPurchaseRate: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        chartData: []
      });
      setRecentOrders([]);
      setTopProducts([]);
      setTopCustomers([]);
      setOpenTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Formatieren von Währungsbeträgen
  const formatCurrency = (amount) => {
    // Check if amount is a valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(0);
    }
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  // Aktuelles Datum formatieren
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('de-DE', options);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Fehler beim Ausloggen:", error);
    }
  };

  // Schließen der Sidebar, wenn die Route sich ändert
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Scroll-Sperre für mobile Sidebar
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isSidebarOpen]);

  // Funktion zum Umschalten der Sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Funktion zum Schließen der Sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Funktion zum Abrufen des Seitentitels basierend auf der Route
  const getPageTitle = (pathname) => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.startsWith('/admin/products')) return 'Produkte';
    if (pathname.startsWith('/admin/orders')) return 'Bestellungen';
    if (pathname.startsWith('/admin/customers')) return 'Kunden';
    if (pathname.startsWith('/admin/support')) return 'Support-Tickets';
    if (pathname.startsWith('/admin/settings')) return 'Einstellungen';
    return 'Admin Panel'; // Fallback title
  };

  const pageTitle = getPageTitle(location.pathname);

  // Statusfarbe und Text für Bestellungen
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'abgeschlossen':
      case 'shipped':
      case 'versendet': return '#28a745';
      case 'pending':
      case 'in bearbeitung': return '#ffc107';
      case 'canceled':
      case 'storniert': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="admin-container">
      {/* Overlay - wird nur aktiv, wenn Sidebar offen ist */} 
      <div 
        className={`admin-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>
      
      {/* Sidebar - bekommt 'open' Klasse, wenn state true ist */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <h2>Admin</h2>
        </div>
        
        <div className="sidebar-section-title">HAUPTMENÜ</div>
        
        {/* Neuer Wrapper für scrollbare Navigation */}
        <div className="admin-nav-scrollable-wrapper">
          <nav className="admin-nav">
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''} onClick={closeSidebar}>
              <span className="admin-icon"><FaHome /></span>
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/orders" className={location.pathname.includes('/admin/orders') ? 'active' : ''} onClick={closeSidebar}>
              <span className="admin-icon"><FaShoppingCart /></span>
              <span>Bestellungen</span>
            </Link>
            <Link to="/admin/customers" className={location.pathname.includes('/admin/customers') ? 'active' : ''} onClick={closeSidebar}>
              <span className="admin-icon"><FaUsers /></span>
              <span>Kunden</span>
            </Link>
            <Link to="/admin/products" className={location.pathname.includes('/admin/products') ? 'active' : ''} onClick={closeSidebar}>
              <span className="admin-icon"><FaBox /></span>
              <span>Produkte</span>
            </Link>
            <Link to="/admin/support" className={location.pathname.includes('/admin/support') ? 'active' : ''} onClick={closeSidebar}>
              <span className="admin-icon"><FaHeadset /></span>
              <span>Support-Tickets</span>
              {openTickets.length > 0 && (
                <span className="review-count">{openTickets.length}</span>
              )}
            </Link>
            <Link to="/admin/settings" className={location.pathname.includes('/admin/settings') ? 'active' : ''} onClick={closeSidebar}>
              <span className="admin-icon"><FaCog /></span>
              <span>Einstellungen</span>
            </Link>
          </nav>
        </div>
        
        <div className="admin-sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <span className="admin-icon"><FaSignOutAlt /></span>
            <span>Abmelden</span>
          </button>
          
          <Link to="/" className="back-to-site">
            <span className="admin-icon"><FaArrowLeft /></span>
            <span>Zurück zur Website</span>
          </Link>
        </div>
      </div>
      
      {/* Hauptinhalt */}
      <div className="admin-content">
        {/* Scrollbarer Inhalt */} 
        <div className="admin-scrollable-content">
          {/* Seitentitel mit Hamburger-Menü */}
          <div className="page-title-container">
            <div className="title-with-menu title-alignment mobile-header">
              <button className="mobile-menu-button" onClick={toggleSidebar} aria-label="Menü öffnen">
                <FaBars className="hamburger-icon" />
              </button>
              <h1 className="admin-page-title">{pageTitle}</h1>
            </div>
          </div>
          
          {/* Render Dashboard content only if on /admin and not loading */}
          {location.pathname === '/admin' ? (
            loading ? (
              <div className="loading-spinner">Lade Dashboard-Daten...</div>
            ) : (
              <div className="dashboard-content">
                {/* Begrüßung und Zeitraumauswahl */}
                <div className="welcome-section">
                  <div className="welcome-text">
                    <p>Hier ist eine Übersicht Ihres Online-Shops</p>
                  </div>
                  <div className="time-selector">
                    <select 
                      value={dateRange} 
                      onChange={(e) => setDateRange(parseInt(e.target.value))}
                      className="year-dropdown"
                    >
                      <option value={7}>Letzte 7 Tage</option>
                      <option value={30}>Letzte 30 Tage</option>
                      <option value={90}>Letzte 90 Tage</option>
                    </select>
                    <button className="view-all-time-btn">Alle Daten anzeigen</button>
                  </div>
                </div>
                
                {/* KPI Karten */}
                <div className="kpi-cards">
                  <div className="kpi-card">
                    <div className="kpi-header">Gesamtumsatz</div>
                    <div className="kpi-value">{formatCurrency(stats.ecommerceRevenue)}</div>
                    <div className="kpi-trend up">
                      <span className="trend-arrow">↑</span> 14.9% <span className="trend-details">(im Vergleich zum Vormonat)</span>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header">Neue Bestellungen</div>
                    <div className="kpi-value">{stats.newCustomers}</div>
                    <div className="kpi-trend down">
                      <span className="trend-arrow">↓</span> 8.4% <span className="trend-details">(im Vergleich zum Vormonat)</span>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header">Wiederkehrende Käufer</div>
                    <div className="kpi-value">{stats.repeatPurchaseRate} %</div>
                    <div className="kpi-trend up">
                      <span className="trend-arrow">↑</span> 25.4% <span className="trend-details">(im Vergleich zum Vormonat)</span>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header">Durchschnittlicher Bestellwert</div>
                    <div className="kpi-value">{formatCurrency(stats.averageOrderValue)}</div>
                    <div className="kpi-trend up">
                      <span className="trend-arrow">↑</span> 35.2% <span className="trend-details">(im Vergleich zum Vormonat)</span>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header">Konversionsrate</div>
                    <div className="kpi-value">{stats.conversionRate} %</div>
                    <div className="kpi-trend down">
                      <span className="trend-arrow">↓</span> 12.42% <span className="trend-details">(im Vergleich zum Vormonat)</span>
                    </div>
                  </div>
                </div>
                
                {/* Diagramm-Bereich */}
                <div className="summary-chart-section">
                  <div className="chart-header">
                    <h2>Umsatzübersicht</h2>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-dot order-dot"></div>
                        <span>Bestellungen</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot income-dot"></div>
                        <span>Umsatzwachstum</span>
                      </div>
                    </div>
                    <div className="chart-time-selector">
                      <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(parseInt(e.target.value))}
                        className="time-dropdown"
                      >
                        <option value={7}>7 Tage</option>
                        <option value={30}>30 Tage</option>
                        <option value={90}>90 Tage</option>
                      </select>
                    </div>
                  </div>
                  <div className="chart-container">
                    {stats.chartData.length > 0 ? (
                      <div className="chart-data">
                        {/* In einer zukünftigen Version könnten wir hier eine Chart-Bibliothek einbinden */}
                        <div className="chart-placeholder">
                          {stats.chartData.map((item, index) => (
                            <div 
                              key={index} 
                              className="chart-bar" 
                              style={{ 
                                height: `${Math.max(10, (item.amount / Math.max(...stats.chartData.map(d => d.amount || 0), 1)) * 100)}%` 
                              }}
                            >
                              <div className="chart-tooltip">
                                {item.date}: {formatCurrency(item.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="placeholder-chart">
                        <p>Keine Daten für den gewählten Zeitraum verfügbar</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Unten: Meistverkaufte Produkte und Top-Kunden der Woche */}
                <div className="dashboard-bottom-section">
                  {/* Top-Produkte */}
                  <div className="most-selling-products">
                    <div className="section-header">
                      <h2>Meistverkaufte Produkte</h2>
                      <Link to="/admin/products" className="more-link">Alle anzeigen</Link>
                    </div>
                    <div className="products-list">
                      {topProducts.map((product, index) => (
                        <div className="product-item" key={product.id}>
                          <div className="product-image">
                            <div className="placeholder-image">{index + 1}</div>
                          </div>
                          <div className="product-details">
                            <h3>{product.name}</h3>
                            <div className="product-id">ID: {product.id}</div>
                          </div>
                          <div className="product-sales">{product.sales} Verkäufe</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Support-Tickets */}
                  <div className="weekly-top-customers">
                    <div className="section-header">
                      <h2><FaHeadset className="header-icon" /> Offene Support-Tickets</h2>
                      <Link to="/admin/support" className="more-link">Alle anzeigen</Link>
                    </div>
                    <div className="support-tickets-widget">
                      <div className="support-tickets-count-container">
                        <div className="support-tickets-count">
                          <span className="count-number">{openTickets.length}</span>
                        </div>
                        <div className="count-label">Offene Tickets</div>
                      </div>
                      
                      <div className="support-tickets-list">
                        <h3>Neueste Tickets:</h3>
                        {openTickets.length > 0 ? (
                          <ul className="ticket-list">
                            {openTickets.map((ticket, index) => {
                              // Generiere eine konsistente Ticket-ID basierend auf der tatsächlichen ID 
                              // (statt einer zufälligen Zahl für die Anzeige)
                              const ticketNumber = parseInt(ticket.id.toString().slice(-4), 10) || index + 9000;
                              
                              return (
                                <li key={ticket.id} className="ticket-list-item">
                                  <Link to={`/admin/support/${ticket.id}`} className="ticket-link">
                                    <div className="ticket-id-container">
                                      <span className="ticket-id">#TICKET-{ticketNumber}</span>
                                      <span className={`ticket-status ${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                                    </div>
                                    <div className="ticket-content">
                                      <div className="ticket-subject">{ticket.subject}</div>
                                      <div className="ticket-meta">
                                        <span className="ticket-customer">{ticket.customer}</span>
                                        <span className="ticket-date">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('de-DE') : 'Heute'}</span>
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="no-tickets">
                            <div className="empty-state">
                              <FaHeadset className="empty-icon" />
                              <p>Keine offenen Support-Tickets</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Orders */}
                <div className="recent-orders-section">
                  <div className="section-header">
                    <h2>Aktuelle Bestellungen</h2>
                    <Link to="/admin/orders" className="view-all-btn">Alle anzeigen</Link>
                  </div>
                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Produkt</th>
                          <th>Kunde</th>
                          <th>Bestellnummer</th>
                          <th>Datum</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.length > 0 ? (
                          recentOrders.map(order => (
                            <tr key={order.id}>
                              <td>
                                <div className="order-product">
                                  <div className="product-img"></div>
                                  <span>{order.product}</span>
                                </div>
                              </td>
                              <td>{order.customer}</td>
                              <td>#{order.id}</td>
                              <td>{order.date}</td>
                              <td>
                                <span className="order-status" style={{backgroundColor: getStatusColor(order.status)}}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="no-orders">
                              Keine Bestellungen im gewählten Zeitraum
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          ) : (
            // Render Outlet for sub-pages (Orders, Products, etc.)
            <Outlet /> 
          )}
        </div> {/* Ende admin-scrollable-content */} 
      </div> {/* Ende admin-content */} 
    </div>
  );
};

export default AdminDashboard; 