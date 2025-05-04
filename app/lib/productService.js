import supabase from './supabase';

/**
 * Alle Produkte abrufen
 * @param {string} category - Optional: Kategorie filtern ('smoothie' oder 'bowl')
 * @returns {Promise<Array>} - Liste der Produkte
 */
export const getAllProducts = async (category = null) => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Fehler beim Abrufen der Produkte:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Produkte:', error);
    return [];
  }
};

/**
 * Produkt nach ID abrufen
 * @param {string} productId - ID des Produkts
 * @returns {Promise<Object|null>} - Produktdaten oder null
 */
export const getProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('Fehler beim Abrufen des Produkts:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen des Produkts:', error);
    return null;
  }
};

/**
 * Produkte nach Zutaten filtern
 * @param {Array} ingredients - Array von Zutaten-IDs
 * @returns {Promise<Array>} - Liste der Produkte
 */
export const getProductsByIngredients = async (ingredients) => {
  try {
    if (!ingredients || ingredients.length === 0) {
      return await getAllProducts();
    }
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_ingredients(ingredient_id)
      `)
      .eq('is_active', true)
      .contains('product_ingredients.ingredient_id', ingredients);
      
    if (error) {
      console.error('Fehler beim Filtern der Produkte nach Zutaten:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Filtern der Produkte:', error);
    return [];
  }
};

/**
 * Empfohlene Produkte abrufen (z.B. für die Startseite)
 * @param {number} limit - Maximale Anzahl der Produkte
 * @returns {Promise<Array>} - Liste der empfohlenen Produkte
 */
export const getFeaturedProducts = async (limit = 6) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('name')
      .limit(limit);
      
    if (error) {
      console.error('Fehler beim Abrufen der empfohlenen Produkte:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der empfohlenen Produkte:', error);
    return [];
  }
}; 