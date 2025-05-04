import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-client';

/**
 * API-Route zur Prüfung eines Gutschein-Codes
 * @param {Request} request - Die Anfrage
 * @returns {Promise<Response>} - Die Antwort mit den Gutscheininformationen
 */
export async function POST(request) {
  try {
    const { code, customerId, orderTotal } = await request.json();
    
    // Validiere die Eingaben
    if (!code) {
      return NextResponse.json({ 
        success: false, 
        message: 'Gutscheincode erforderlich'
      }, { status: 400 });
    }
    
    if (!orderTotal || typeof orderTotal !== 'number' || orderTotal <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Gültiger Bestellwert erforderlich'
      }, { status: 400 });
    }
    
    // Gutschein überprüfen
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .lt('uses', supabase.raw('max_uses'))
      .single();
    
    if (error || !coupon) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ungültiger Gutscheincode'
      }, { status: 404 });
    }
    
    // Prüfe, ob der Gutschein für diesen Kunden gültig ist
    if (coupon.customer_id && coupon.customer_id !== customerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dieser Gutschein ist nicht für dein Konto gültig'
      }, { status: 403 });
    }
    
    // Prüfe das Ablaufdatum
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dieser Gutschein ist abgelaufen'
      }, { status: 403 });
    }
    
    // Prüfe den Mindestbestellwert
    if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
      return NextResponse.json({ 
        success: false, 
        message: `Mindestbestellwert von ${coupon.min_order_value}€ nicht erreicht`
      }, { status: 403 });
    }
    
    // Berechne den Rabatt
    let discount = 0;
    
    if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
    }
    
    // Erfolgreiche Antwort mit Gutscheininformationen
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        discount: discount
      }
    });
    
  } catch (error) {
    console.error('Fehler bei der Gutscheinprüfung:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Fehler bei der Verarbeitung des Gutscheins'
    }, { status: 500 });
  }
}

/**
 * API-Route zum Anwenden eines Gutscheins
 * @param {Request} request - Die Anfrage
 * @returns {Promise<Response>} - Die Antwort mit den Gutscheininformationen
 */
export async function PUT(request) {
  try {
    const { code, customerId, orderTotal } = await request.json();
    
    // Versuche, den Gutschein anzuwenden
    const { data, error } = await supabase.rpc(
      'apply_coupon',
      { 
        coupon_code: code,
        customer_uuid: customerId,
        order_total: orderTotal
      }
    );
    
    if (error) {
      console.error('Fehler bei der Gutscheinanwendung:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Gutschein konnte nicht angewendet werden'
      }, { status: 400 });
    }
    
    // Wenn data einen Rabattwert enthält, war die Anwendung erfolgreich
    const discount = data || 0;
    
    return NextResponse.json({
      success: true,
      discount: discount,
      message: discount > 0 ? 'Gutschein erfolgreich angewendet' : 'Gutschein nicht anwendbar'
    });
    
  } catch (error) {
    console.error('Fehler bei der Gutscheinanwendung:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Fehler bei der Verarbeitung des Gutscheins'
    }, { status: 500 });
  }
} 