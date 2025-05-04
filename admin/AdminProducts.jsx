import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimesCircle, FaSave, FaTimes, FaPlusCircle, FaMinusCircle, FaExclamationTriangle, FaRegClock } from 'react-icons/fa';
import { getProducts, getCategories, addProduct, updateProduct, deleteProduct } from '../../services/adminService';
import './AdminProducts.css';
import { useNavigate } from 'react-router-dom';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(0); // 0 bedeutet "Alle"
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Neue Zustände für mobile Overlay und Löschbestätigung
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  // Neuer Zustand für Entwurfsfilter
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  // Zustand für geplante Veröffentlichungen
  const [showScheduled, setShowScheduled] = useState(false);
  const navigate = useNavigate();

  // Produkte und Kategorien beim Komponenten-Laden abrufen
  useEffect(() => {
    loadProductsAndCategories();
    
    // Timer für geplante Veröffentlichungen
    const scheduledPublishTimer = setInterval(checkScheduledPublications, 60000); // Prüft jede Minute
    
    return () => {
      clearInterval(scheduledPublishTimer);
    };
  }, []);
  
  // Prüfen auf fällige Veröffentlichungen
  const checkScheduledPublications = async () => {
    if (!Array.isArray(products) || products.length === 0) return;
    
    const now = new Date();
    let hasPublishedProducts = false;
    
    // Produkte filtern, die jetzt veröffentlicht werden sollen
    for (const product of products) {
      if (product.is_draft && product.publish_date) {
        let publishTime = product.publish_time || '00:00';
        const publishDate = new Date(`${product.publish_date}T${publishTime}`);
        
        if (publishDate <= now) {
          console.log(`Veröffentliche Produkt: ${product.name} (ID: ${product.id})`);
          try {
            // Draft-Status entfernen und aktualisieren
            await updateProduct(product.id, {
              ...product,
              is_draft: false,
              publish_date: null,
              publish_time: null,
              publish_timestamp: null
            });
            hasPublishedProducts = true;
          } catch (error) {
            console.error(`Fehler bei automatischer Veröffentlichung von Produkt ${product.id}:`, error);
          }
        }
      }
    }
    
    // Wenn Produkte veröffentlicht wurden, neu laden
    if (hasPublishedProducts) {
      await loadProductsAndCategories();
      setSuccessMessage("Geplante Produkte wurden automatisch veröffentlicht.");
      clearMessages();
    }
  };
  
  // Effect zum Verwalten des Scroll-Locks
  useEffect(() => {
    if (showMobileOverlay || showDeleteConfirmation) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    // Cleanup beim Unmount
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showMobileOverlay, showDeleteConfirmation]);

  // Funktion zum Ausblenden von Nachrichten nach einer Verzögerung
  const clearMessages = () => {
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000); // Nachrichten nach 5 Sekunden ausblenden
  };

  // Produkte und Kategorien laden
  const loadProductsAndCategories = async () => {
    setLoading(true);
    setErrorMessage(''); // Fehlermeldung zurücksetzen
    setSuccessMessage(''); // Erfolgsmeldung zurücksetzen
    try {
      // Use service functions to load data
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      
      setProducts(productsData || []); // Ensure it's always an array
      setCategories(categoriesData || []); // Ensure it's always an array
      console.log('Produkte geladen:', productsData);
      console.log('Kategorien geladen:', categoriesData);

    } catch (error) {
      console.error("Fehler beim Laden der Produktdaten:", error);
      setProducts([]); // Fallback to empty array on error
      setCategories([]); // Fallback to empty array on error
      setErrorMessage(`Fehler beim Laden der Daten: ${error.message}. Bitte versuchen Sie es später erneut.`);
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Produkte nach Kategorie und Suchbegriff filtern (mit Sicherheitsprüfungen)
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    // Grundlegende Produktprüfung
    if (!product || typeof product.name !== 'string') {
      console.warn('Ungültiges Produkt im Filter übersprungen:', product);
      return false;
    }

    const matchesCategory = selectedCategoryId === 0 || product.category_id === selectedCategoryId;

    // Prüfen, ob das Produkt dem gewählten Entwurfsstatus entspricht
    const matchesDraftStatus = 
      (!showDraftsOnly && !showScheduled) || // Zeige alle, wenn keine Filter ausgewählt
      (showDraftsOnly && product.is_draft && !product.publish_date) || // Nur Entwürfe ohne Veröffentlichungsdatum
      (showScheduled && product.is_draft && product.publish_date); // Nur geplante Veröffentlichungen

    // Sichere Suche
    const searchTermLower = searchTerm.toLowerCase();
    const nameLower = product.name.toLowerCase();
    const descriptionLower = typeof product.description === 'string' ? product.description.toLowerCase() : '';

    const matchesSearch =
      nameLower.includes(searchTermLower) ||
      (descriptionLower && descriptionLower.includes(searchTermLower));

    return matchesCategory && matchesSearch && matchesDraftStatus;
  }) : []; // Fallback auf leeres Array, wenn products kein Array ist

  // Produkte nach Kategorie gruppieren
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    // Use categoryName directly from fetched data, ensure product exists
    const categoryName = product?.categoryName || 'Sonstige';

    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {});

  // Produktdetails anzeigen - Modifiziert für Mobile-Support
  const handleProductSelect = (product) => {
    console.log("Ausgewähltes Produkt:", product);
    // Deep copy to avoid modifying the original list item directly
    // Ensure nutritionInfo is an array
    const productCopy = JSON.parse(JSON.stringify(product));
    setSelectedProduct({
        ...productCopy,
        nutritionInfo: Array.isArray(productCopy.nutritionInfo) ? productCopy.nutritionInfo : []
    });
    setIsEditing(false);
    setIsAdding(false);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Prüfen, ob wir auf einem mobilen Gerät sind
    if (window.innerWidth <= 900) {
      setShowMobileOverlay(true);
    }
  };

  // Neues Produkt hinzufügen - Vorbereitung
  const handleAddProductClick = () => {
    const newProduct = {
      id: null, // Keine ID für neues Produkt
      name: '',
      price: 0.00,
      description: '',
      category_id: categories.length > 0 ? categories[0].id : null, // Default to first category or null
      image: '',
      nutritionInfo: [], // Initialize nutritionInfo as an empty array
      is_draft: true, // Standardmäßig als Entwurf markieren
      publish_date: null, // Kein Veröffentlichungsdatum standardmäßig
      publish_time: null // Keine Veröffentlichungszeit standardmäßig
    };
    setSelectedProduct(newProduct);
    setIsEditing(true); // Enable editing mode
    setIsAdding(true); // Set adding flag
    setErrorMessage('');
    setSuccessMessage('');
    
    // Prüfen, ob wir auf einem mobilen Gerät sind
    if (window.innerWidth <= 900) {
      setShowMobileOverlay(true);
    }
  };

  // Produktdetails schließen - Modifiziert für Mobile-Support
  const handleCloseProductDetails = () => {
    setSelectedProduct(null);
    setIsEditing(false);
    setIsAdding(false);
    setErrorMessage('');
    setSuccessMessage('');
    setShowMobileOverlay(false);
  };

  // Bearbeitungsmodus umschalten
  const toggleEditMode = () => {
    if (!selectedProduct) return; // Nur umschalten, wenn ein Produkt ausgewählt ist
    setIsEditing(!isEditing);
    setErrorMessage('');
    setSuccessMessage('');
    // Wenn wir den Bearbeitungsmodus verlassen, setzen wir die Änderungen zurück (optional)
    // loadProductsAndCategories(); // Oder nur das ausgewählte Produkt neu laden
  };

  // Produktänderung speichern
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Prepare data for saving: ensure price is a number, category_id is set
     const productToSave = {
        ...selectedProduct,
        price: parseFloat(selectedProduct.price) || 0,
        // Filter out empty nutrition entries before saving
        nutritionInfo: selectedProduct.nutritionInfo.filter(n => n.nutrient_name && n.nutrient_value),
        // Verarbeiten des Entwurfsstatus
        is_draft: !!selectedProduct.is_draft
    };
    
    // Wenn es ein Entwurf mit Veröffentlichungsdatum ist, stellen wir sicher, dass das Format korrekt ist
    if (productToSave.is_draft && productToSave.publish_date) {
      // Sicherstellen, dass publish_date im ISO-Format ist
      try {
        // Nur Datum, wenn keine Zeit angegeben ist
        if (!productToSave.publish_time) {
          productToSave.publish_date = new Date(productToSave.publish_date).toISOString().split('T')[0];
        } else {
          // Datum und Zeit kombinieren
          const publishDateTime = new Date(`${productToSave.publish_date}T${productToSave.publish_time}`);
          if (isNaN(publishDateTime.getTime())) {
            throw new Error('Ungültiges Datumsformat');
          }
          productToSave.publish_timestamp = publishDateTime.toISOString();
        }
      } catch (error) {
        setErrorMessage('Ungültiges Veröffentlichungsdatum oder -zeit. Bitte überprüfen Sie Ihre Eingabe.');
        setIsSaving(false);
        clearMessages();
        return;
      }
    } else if (!productToSave.is_draft) {
      // Wenn es kein Entwurf ist, werden die Veröffentlichungsfelder gelöscht
      delete productToSave.publish_date;
      delete productToSave.publish_time;
      delete productToSave.publish_timestamp;
    }
    
    // Remove categoryName and category object if they exist, only send category_id
    delete productToSave.categoryName;
    delete productToSave.category;


    console.log("Speichere Produkt:", productToSave);

    try {
      let savedProduct;
      if (isAdding) {
        // Neues Produkt hinzufügen - ID wird von DB generiert
        delete productToSave.id; // Remove null id before insert
        savedProduct = await addProduct(productToSave);
        setSuccessMessage(`Produkt "${savedProduct.name}" wurde erfolgreich hinzugefügt!${productToSave.is_draft ? ' (Als Entwurf gespeichert)' : ''}`);
      } else {
        // Bestehendes Produkt aktualisieren
        savedProduct = await updateProduct(selectedProduct.id, productToSave);
        setSuccessMessage(`Produkt "${savedProduct.name}" wurde erfolgreich aktualisiert!${productToSave.is_draft ? ' (Als Entwurf gespeichert)' : ''}`);
      }

      // Produkte neu laden, um die Änderungen anzuzeigen
      await loadProductsAndCategories();

      // Bearbeitungsmodus beenden und das gespeicherte Produkt anzeigen
      setIsEditing(false);
      setIsAdding(false);
      // Update selected product state with the data returned from the server
      handleProductSelect(savedProduct);


    } catch (error) {
      console.error('Fehler beim Speichern des Produkts:', error);
      setErrorMessage(`Fehler beim Speichern: ${error.message}`);
    } finally {
      setIsSaving(false);
      clearMessages();
    }
  };

  // Modifizierter Code für das Löschen mit Bestätigung
  const promptDeleteProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    setProductToDelete(product);
    setShowDeleteConfirmation(true);
  };
  
  // Bestätigtes Löschen
  const handleDeleteProduct = async () => {
    if (!productToDelete || !productToDelete.id) return;
    
    try {
      await deleteProduct(productToDelete.id);
      setSuccessMessage(`Produkt "${productToDelete.name}" wurde erfolgreich gelöscht!`);
      
      // Produkte neu laden und UI zurücksetzen
      await loadProductsAndCategories();
      setSelectedProduct(null);
      setIsEditing(false);
      setShowDeleteConfirmation(false);
      setShowMobileOverlay(false);
      
    } catch (error) {
      console.error('Fehler beim Löschen des Produkts:', error);
      setErrorMessage(`Fehler beim Löschen: ${error.message}`);
    } finally {
      clearMessages();
    }
  };
  
  // Löschdialog abbrechen
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setProductToDelete(null);
  };

  // Änderungen in den Produktdaten (inkl. Nährwerte) verarbeiten
  const handleProductChange = (e) => {
    const { name, value, type } = e.target;

    setSelectedProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  // Änderungen bei Nährwerten verarbeiten
  const handleNutritionChange = (index, field, value) => {
    setSelectedProduct(prev => {
      const newNutritionInfo = [...prev.nutritionInfo];
      newNutritionInfo[index] = {
        ...newNutritionInfo[index],
        [field]: value
      };
      return { ...prev, nutritionInfo: newNutritionInfo };
    });
  };

  // Neuen Nährwert hinzufügen
  const handleAddNutrition = () => {
    setSelectedProduct(prev => ({
      ...prev,
      nutritionInfo: [...prev.nutritionInfo, { nutrient_name: '', nutrient_value: '' }]
    }));
  };

  // Nährwert entfernen
  const handleRemoveNutrition = (index) => {
    setSelectedProduct(prev => ({
      ...prev,
      nutritionInfo: prev.nutritionInfo.filter((_, i) => i !== index)
    }));
  };


  // Helper function to get category name (with safety check)
  const getCategoryNameById = (id) => {
      if (!Array.isArray(categories)) {
          // Return a default value or handle the error appropriately
          console.warn('getCategoryNameById called while categories is not an array.');
          return 'Kategorie nicht geladen';
      }
      const category = categories.find(cat => cat && cat.id === id);
      return category ? (category.name || 'Unbenannt') : 'Unbekannt'; // Also handle missing name
  }

  // Rendere die Komponente
  return (
    <div className="admin-products-container">
      <div className="admin-products-header"></div>
      <div className="admin-products-actions">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Produkte durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filter">
          <button
            className={`filter-button ${selectedCategoryId === 0 ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId(0)}
          >
            Alle
          </button>
          {Array.isArray(categories) && categories.map(category => (
            category && category.id && (
              <button
                key={category.id}
                className={`filter-button ${selectedCategoryId === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                {category.name || 'Unbenannt'}
              </button>
            )
          ))}
        </div>
        
        <div className="draft-filter">
          <button
            className={`filter-button ${showDraftsOnly ? 'active' : ''}`}
            onClick={() => {
              setShowDraftsOnly(!showDraftsOnly);
              setShowScheduled(false); // Deaktiviere den anderen Filter
            }}
          >
            <FaEdit className="filter-icon" /> Nur Entwürfe
          </button>
          <button
            className={`filter-button ${showScheduled ? 'active' : ''}`}
            onClick={() => {
              setShowScheduled(!showScheduled);
              setShowDraftsOnly(false); // Deaktiviere den anderen Filter
            }}
          >
            <FaRegClock className="filter-icon" /> Geplante
          </button>
        </div>
        
        <button className="add-button" onClick={handleAddProductClick}>
          <FaPlus /> Produkt hinzufügen
        </button>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="admin-products-content">
        {/* Produktliste - keine Änderungen */}
        <div className="product-list-section">
          {loading ? (
            <div className="loading-message">Produkte werden geladen...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-message">Keine Produkte gefunden. Passen Sie Ihre Suche an oder fügen Sie neue Produkte hinzu.</div>
          ) : (
            <div className="product-categories">
              {Object.entries(groupedProducts).map(([categoryName, productsList]) => (
                <div key={categoryName} className="product-category">
                  <h3>{categoryName}</h3>
                  {Array.isArray(productsList) && (
                    <ul className="product-items">
                      {productsList.map(product => (
                        product && product.id ? (
                          <li 
                            key={product.id} 
                            className={`product-item 
                              ${selectedProduct && selectedProduct.id === product.id ? 'selected' : ''} 
                              ${product.is_draft && !product.publish_date ? 'draft' : ''} 
                              ${product.is_draft && product.publish_date ? 'scheduled' : ''}`
                            }
                            onClick={() => handleProductSelect(product)}
                          >
                            <span className="product-item-id">ID: {product.id}</span>
                            <img src={product.image || '/placeholder-image.png'} alt={product.name || 'Produkt'} className="product-item-image" />
                            <div className="product-item-info">
                                <span className="product-item-name">
                                  {product.name || 'Unbenanntes Produkt'}
                                  {product.is_draft && !product.publish_date && <span className="draft-label">Entwurf</span>}
                                  {product.is_draft && product.publish_date && <span className="scheduled-label">Geplant</span>}
                                </span>
                                <span className="product-item-price">
                                  €{product.price?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                          </li>
                        ) : null
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produktdetails / Bearbeitungsformular - Standard (Desktop) Ansicht */}
        {selectedProduct && (
          <div className="product-details-section">
            <div className="product-details-header">
              <h3>{isAdding ? 'Neues Produkt hinzufügen' : isEditing ? 'Produkt bearbeiten' : 'Produktdetails'}</h3>
              <div className="product-details-buttons">
                {!isAdding && !isEditing && (
                   <button onClick={toggleEditMode} className="edit-button icon-button" title="Bearbeiten">
                    <FaEdit />
                  </button>
                )}
                 {!isAdding && !isEditing && (
                   <button onClick={() => promptDeleteProduct(selectedProduct.id)} className="delete-button icon-button" title="Löschen">
                    <FaTrash />
                  </button>
                )}
                 <button onClick={handleCloseProductDetails} className="close-button icon-button" title="Schließen">
                  <FaTimes />
                </button>
              </div>
            </div>

            {isEditing ? (
              <form className="product-edit-form" onSubmit={handleSaveProduct}>
                 <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" name="name" value={selectedProduct.name || ''} onChange={handleProductChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="price">Preis (€)</label>
                    <input type="number" id="price" name="price" value={selectedProduct.price ?? 0} onChange={handleProductChange} step="0.01" min="0" required />
                  </div>
                   <div className="form-group">
                    <label htmlFor="category_id">Kategorie</label>
                    <select id="category_id" name="category_id" value={selectedProduct.category_id || ''} onChange={handleProductChange} required>
                      <option value="" disabled>Bitte wählen...</option>
                      {Array.isArray(categories) && categories.map(cat => (
                        cat && cat.id && <option key={cat.id} value={cat.id}>{cat.name || 'Unbekannt'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Beschreibung</label>
                    <textarea id="description" name="description" value={selectedProduct.description || ''} onChange={handleProductChange} rows="4"></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="image">Bild-URL</label>
                    <input type="text" id="image" name="image" value={selectedProduct.image || ''} onChange={handleProductChange} placeholder="https://beispiel.com/bild.jpg" />
                     {selectedProduct.image && <img src={selectedProduct.image} alt="Vorschau" className="image-preview" />}
                  </div>

                  <div className="form-group nutrition-group">
                    <label>Nährwertangaben</label>
                    {Array.isArray(selectedProduct.nutritionInfo) && selectedProduct.nutritionInfo.map((nutrient, index) => (
                      <div key={index} className="nutrition-item-edit">
                        <input
                          type="text"
                          placeholder="Nährwert (z.B. Energie)"
                          value={nutrient?.nutrient_name || ''}
                          onChange={(e) => handleNutritionChange(index, 'nutrient_name', e.target.value)}
                          required={!!nutrient?.nutrient_value}
                        />
                        <input
                          type="text"
                          placeholder="Wert (z.B. 100 kcal)"
                          value={nutrient?.nutrient_value || ''}
                          onChange={(e) => handleNutritionChange(index, 'nutrient_value', e.target.value)}
                          required={!!nutrient?.nutrient_name}
                        />
                        <button type="button" onClick={() => handleRemoveNutrition(index)} className="remove-nutrition-button icon-button" title="Nährwert entfernen">
                          <FaMinusCircle />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddNutrition} className="add-nutrition-button">
                      <FaPlusCircle /> Nährwert hinzufügen
                    </button>
                  </div>
                  
                  <div className="form-group draft-settings">
                    <label>Veröffentlichungseinstellungen</label>
                    <div className="draft-checkbox-container">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedProduct.is_draft}
                          onChange={(e) => handleProductChange({ target: { name: 'is_draft', value: e.target.checked } })}
                        />
                        <span>Als Entwurf speichern</span>
                      </label>
                    </div>
                    
                    {selectedProduct.is_draft && (
                      <div className="scheduled-publish-container">
                        <div className="form-subgroup">
                          <label htmlFor="publish_date">Veröffentlichungsdatum</label>
                          <input
                            type="date"
                            id="publish_date"
                            name="publish_date"
                            value={selectedProduct.publish_date || ''}
                            onChange={handleProductChange}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div className="form-subgroup">
                          <label htmlFor="publish_time">Veröffentlichungszeit</label>
                          <input
                            type="time"
                            id="publish_time"
                            name="publish_time"
                            value={selectedProduct.publish_time || ''}
                            onChange={handleProductChange}
                          />
                        </div>
                        
                        <div className="publish-info">
                          {selectedProduct.publish_date && selectedProduct.publish_time ? (
                            <p>Das Produkt wird am {new Date(`${selectedProduct.publish_date}T${selectedProduct.publish_time}`).toLocaleString('de-DE')} veröffentlicht.</p>
                          ) : selectedProduct.publish_date ? (
                            <p>Das Produkt wird am {new Date(selectedProduct.publish_date).toLocaleDateString('de-DE')} veröffentlicht.</p>
                          ) : (
                            <p>Das Produkt bleibt als Entwurf gespeichert, bis es manuell veröffentlicht wird.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                <div className="form-actions">
                   <button type="submit" className="save-button" disabled={isSaving}>
                    <FaSave /> {isSaving ? 'Speichert...' : 'Speichern'}
                  </button>
                  <button type="button" onClick={isAdding ? handleCloseProductDetails : toggleEditMode} className="cancel-button">
                    <FaTimes /> Abbrechen
                  </button>
                   {!isAdding && (
                     <button type="button" onClick={() => promptDeleteProduct(selectedProduct.id)} className="delete-button-form" title="Löschen">
                        <FaTrash /> Löschen
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="product-view">
                 <img src={selectedProduct.image || '/placeholder-image.png'} alt={selectedProduct.name || 'Produkt'} className="product-view-image" />
                <p><strong>Name:</strong> {selectedProduct.name || 'N/A'}</p>
                <p><strong>Preis:</strong> €{selectedProduct.price?.toFixed(2) || 'N/A'}</p>
                <p><strong>Kategorie:</strong> {getCategoryNameById(selectedProduct.category_id) || 'N/A'}</p>
                <p><strong>Beschreibung:</strong> {selectedProduct.description || '-'}</p>

                {selectedProduct.is_draft && (
                  <div className="draft-status-view">
                    <h4>Veröffentlichungsstatus:</h4>
                    {selectedProduct.publish_date && selectedProduct.publish_time ? (
                      <p>Geplante Veröffentlichung am {new Date(`${selectedProduct.publish_date}T${selectedProduct.publish_time}`).toLocaleString('de-DE')}</p>
                    ) : selectedProduct.publish_date ? (
                      <p>Geplante Veröffentlichung am {new Date(selectedProduct.publish_date).toLocaleDateString('de-DE')}</p>
                    ) : (
                      <p>Gespeichert als Entwurf (nicht veröffentlicht)</p>
                    )}
                  </div>
                )}

                {Array.isArray(selectedProduct.nutritionInfo) && selectedProduct.nutritionInfo.length > 0 && (
                  <div className="nutrition-view">
                    <strong>Nährwertangaben:</strong>
                    <table className="nutrition-table">
                      <thead>
                        <tr>
                          <th>Nährwert</th>
                          <th>Menge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.nutritionInfo.map((nutrient, index) => (
                          nutrient && nutrient.nutrient_name && nutrient.nutrient_value ? (
                            <tr key={nutrient.id || index}>
                              <td>{nutrient.nutrient_name}</td>
                              <td>{nutrient.nutrient_value}</td>
                            </tr>
                          ) : null
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p><small>ID: {selectedProduct.id || 'N/A'}</small></p>
                <p><small>Zuletzt geändert: {selectedProduct.updated_at ? new Date(selectedProduct.updated_at).toLocaleString('de-DE') : '-'}</small></p>
              </div>
            )}
          </div>
        )}
        
        {/* Mobile Overlay für Produktdetails */}
        {showMobileOverlay && selectedProduct && (
          <div className="mobile-product-overlay active">
            <div className="mobile-product-panel">
              <div className="mobile-product-header">
                <h3>{isAdding ? 'Neues Produkt hinzufügen' : isEditing ? 'Produkt bearbeiten' : 'Produktdetails'}</h3>
              </div>
              <button onClick={handleCloseProductDetails} className="mobile-product-close">
                <FaTimes />
              </button>
              
              <div className="mobile-product-content">
                {isEditing ? (
                  <form className="product-edit-form" onSubmit={handleSaveProduct}>
                    <div className="form-group">
                      <label htmlFor="mobile-name">Name</label>
                      <input type="text" id="mobile-name" name="name" value={selectedProduct.name || ''} onChange={handleProductChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mobile-price">Preis (€)</label>
                      <input type="number" id="mobile-price" name="price" value={selectedProduct.price ?? 0} onChange={handleProductChange} step="0.01" min="0" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mobile-category_id">Kategorie</label>
                      <select id="mobile-category_id" name="category_id" value={selectedProduct.category_id || ''} onChange={handleProductChange} required>
                        <option value="" disabled>Bitte wählen...</option>
                        {Array.isArray(categories) && categories.map(cat => (
                          cat && cat.id && <option key={cat.id} value={cat.id}>{cat.name || 'Unbekannt'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mobile-description">Beschreibung</label>
                      <textarea id="mobile-description" name="description" value={selectedProduct.description || ''} onChange={handleProductChange} rows="4"></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mobile-image">Bild-URL</label>
                      <input type="text" id="mobile-image" name="image" value={selectedProduct.image || ''} onChange={handleProductChange} placeholder="https://beispiel.com/bild.jpg" />
                      {selectedProduct.image && <img src={selectedProduct.image} alt="Vorschau" className="image-preview" />}
                    </div>

                    <div className="form-group nutrition-group">
                      <label>Nährwertangaben</label>
                      {Array.isArray(selectedProduct.nutritionInfo) && selectedProduct.nutritionInfo.map((nutrient, index) => (
                        <div key={index} className="nutrition-item-edit">
                          <input
                            type="text"
                            placeholder="Nährwert (z.B. Energie)"
                            value={nutrient?.nutrient_name || ''}
                            onChange={(e) => handleNutritionChange(index, 'nutrient_name', e.target.value)}
                            required={!!nutrient?.nutrient_value}
                          />
                          <input
                            type="text"
                            placeholder="Wert (z.B. 100 kcal)"
                            value={nutrient?.nutrient_value || ''}
                            onChange={(e) => handleNutritionChange(index, 'nutrient_value', e.target.value)}
                            required={!!nutrient?.nutrient_name}
                          />
                          <button type="button" onClick={() => handleRemoveNutrition(index)} className="remove-nutrition-button icon-button" title="Nährwert entfernen">
                            <FaMinusCircle />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddNutrition} className="add-nutrition-button">
                        <FaPlusCircle /> Nährwert hinzufügen
                      </button>
                    </div>

                    <div className="form-group draft-settings">
                      <label>Veröffentlichungseinstellungen</label>
                      <div className="draft-checkbox-container">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedProduct.is_draft}
                            onChange={(e) => handleProductChange({ target: { name: 'is_draft', value: e.target.checked } })}
                          />
                          <span>Als Entwurf speichern</span>
                        </label>
                      </div>
                      
                      {selectedProduct.is_draft && (
                        <div className="scheduled-publish-container">
                          <div className="form-subgroup">
                            <label htmlFor="publish_date">Veröffentlichungsdatum</label>
                            <input
                              type="date"
                              id="publish_date"
                              name="publish_date"
                              value={selectedProduct.publish_date || ''}
                              onChange={handleProductChange}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          
                          <div className="form-subgroup">
                            <label htmlFor="publish_time">Veröffentlichungszeit</label>
                            <input
                              type="time"
                              id="publish_time"
                              name="publish_time"
                              value={selectedProduct.publish_time || ''}
                              onChange={handleProductChange}
                            />
                          </div>
                          
                          <div className="publish-info">
                            {selectedProduct.publish_date && selectedProduct.publish_time ? (
                              <p>Das Produkt wird am {new Date(`${selectedProduct.publish_date}T${selectedProduct.publish_time}`).toLocaleString('de-DE')} veröffentlicht.</p>
                            ) : selectedProduct.publish_date ? (
                              <p>Das Produkt wird am {new Date(selectedProduct.publish_date).toLocaleDateString('de-DE')} veröffentlicht.</p>
                            ) : (
                              <p>Das Produkt bleibt als Entwurf gespeichert, bis es manuell veröffentlicht wird.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-button" disabled={isSaving}>
                        <FaSave /> {isSaving ? 'Speichert...' : 'Speichern'}
                      </button>
                      <button type="button" onClick={isAdding ? handleCloseProductDetails : toggleEditMode} className="cancel-button">
                        <FaTimes /> Abbrechen
                      </button>
                      {!isAdding && (
                        <button type="button" onClick={() => promptDeleteProduct(selectedProduct.id)} className="delete-button-form" title="Löschen">
                          <FaTrash /> Löschen
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="product-view">
                    <img src={selectedProduct.image || '/placeholder-image.png'} alt={selectedProduct.name || 'Produkt'} className="product-view-image" />
                    <p><strong>Name:</strong> {selectedProduct.name || 'N/A'}</p>
                    <p><strong>Preis:</strong> €{selectedProduct.price?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Kategorie:</strong> {getCategoryNameById(selectedProduct.category_id) || 'N/A'}</p>
                    <p><strong>Beschreibung:</strong> {selectedProduct.description || '-'}</p>

                    {selectedProduct.is_draft && (
                      <div className="draft-status-view">
                        <h4>Veröffentlichungsstatus:</h4>
                        {selectedProduct.publish_date && selectedProduct.publish_time ? (
                          <p>Geplante Veröffentlichung am {new Date(`${selectedProduct.publish_date}T${selectedProduct.publish_time}`).toLocaleString('de-DE')}</p>
                        ) : selectedProduct.publish_date ? (
                          <p>Geplante Veröffentlichung am {new Date(selectedProduct.publish_date).toLocaleDateString('de-DE')}</p>
                        ) : (
                          <p>Gespeichert als Entwurf (nicht veröffentlicht)</p>
                        )}
                      </div>
                    )}

                    {Array.isArray(selectedProduct.nutritionInfo) && selectedProduct.nutritionInfo.length > 0 && (
                      <div className="nutrition-view">
                        <strong>Nährwertangaben:</strong>
                        <table className="nutrition-table">
                          <thead>
                            <tr>
                              <th>Nährwert</th>
                              <th>Menge</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProduct.nutritionInfo.map((nutrient, index) => (
                              nutrient && nutrient.nutrient_name && nutrient.nutrient_value ? (
                                <tr key={nutrient.id || index}>
                                  <td>{nutrient.nutrient_name}</td>
                                  <td>{nutrient.nutrient_value}</td>
                                </tr>
                              ) : null
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p><small>ID: {selectedProduct.id || 'N/A'}</small></p>
                    <p><small>Zuletzt geändert: {selectedProduct.updated_at ? new Date(selectedProduct.updated_at).toLocaleString('de-DE') : '-'}</small></p>
                    
                    <div className="form-actions">
                      <button onClick={toggleEditMode} className="save-button">
                        <FaEdit /> Bearbeiten
                      </button>
                      <button onClick={() => promptDeleteProduct(selectedProduct.id)} className="delete-button-form">
                        <FaTrash /> Löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Löschbestätigungsdialog */}
        {showDeleteConfirmation && productToDelete && (
          <div className="delete-confirmation-overlay">
            <div className="delete-confirmation-dialog">
              <div className="delete-confirmation-title">
                <FaExclamationTriangle /> Produkt löschen
              </div>
              <div className="delete-confirmation-message">
                Sind Sie sicher, dass Sie das Produkt "{productToDelete.name}" löschen möchten?
                <br />
                Diese Aktion kann nicht rückgängig gemacht werden.
              </div>
              <div className="delete-confirmation-buttons">
                <button onClick={cancelDelete} className="delete-cancel-button">
                  Abbrechen
                </button>
                <button onClick={handleDeleteProduct} className="delete-confirm-button">
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts; 