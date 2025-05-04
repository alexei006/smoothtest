import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-client';

/**
 * API-Route zum Abrufen aller Gutscheine eines Kunden
 * @param {Request} request - Die Anfrage
 * @returns {Promise<Response>} - Die Antwort mit den Gutscheinen des Kunden
 */
export async function GET(request) {
  try {
    // Kundendaten aus der URL extrahieren
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    
    if (!customerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kunden-ID erforderlich'
      }, { status: 400 });
    }
    
    // Aktive Gutscheine des Kunden abrufen
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .lt('uses', supabase.raw('max_uses'))
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fehler beim Abrufen der Gutscheine:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Fehler beim Abrufen der Gutscheine'
      }, { status: 500 });
    }
    
    // Erfolgreiche Antwort mit Gutscheinen
    return NextResponse.json({
      success: true,
      coupons: coupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description || 
          (coupon.type === 'fixed' ? `${coupon.value}€ Rabatt` : `${coupon.value}% Rabatt`),
        min_order_value: coupon.min_order_value,
        uses_left: coupon.max_uses - coupon.uses,
        valid_until: coupon.valid_until
      }))
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Gutscheine:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Fehler bei der Verarbeitung der Anfrage'
    }, { status: 500 });
  }
} 