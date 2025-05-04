'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase-client';
import toast from 'react-hot-toast';
import { BsLink45Deg, BsWhatsapp, BsClipboard, BsCheckCircle, BsGift } from 'react-icons/bs';

export default function AffiliateProgram() {
  const { user, customerData } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    setLoading(true);
    try {
      // Holt den Referenzcode des Benutzers oder erstellt einen neuen
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('customer_id', user?.id)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        console.error('Fehler beim Laden des Referral-Codes:', codeError);
      }

      if (codeData) {
        setReferralCode(codeData.code);
        // Link erstellen mit vollständiger URL
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/auth/register?ref=${codeData.code}`);
      } else {
        // Wenn noch kein Code existiert, anfordern, dass einer erstellt wird
        const { data: newCodeData, error: newCodeError } = await supabase.rpc(
          'create_referral_code',
          { customer_uuid: user?.id }
        );

        if (newCodeError) {
          console.error('Fehler beim Erstellen des Referral-Codes:', newCodeError);
        } else if (newCodeData) {
          setReferralCode(newCodeData);
          const baseUrl = window.location.origin;
          setReferralLink(`${baseUrl}/auth/register?ref=${newCodeData}`);
        }
      }

      // Referrals des Benutzers laden
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:referred_id(first_name, last_name, email),
          referrer_coupon:referrer_coupon_id(*),
          referred_coupon:referred_coupon_id(*)
        `)
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Fehler beim Laden der Referrals:', referralsError);
      } else if (referralsData) {
        setReferrals(referralsData);
        setStats({
          totalReferrals: referralsData.length,
          successfulReferrals: referralsData.filter((r: any) => r.status === 'completed' || r.status === 'qualified').length,
          pendingReferrals: referralsData.filter((r: any) => r.status === 'pending').length
        });
      }

      // Gutscheine des Benutzers laden
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_id', user?.id)
        .eq('is_active', true)
        .lt('uses', 'max_uses')
        .order('created_at', { ascending: false });

      if (couponsError) {
        console.error('Fehler beim Laden der Gutscheine:', couponsError);
      } else if (couponsData) {
        setCoupons(couponsData);
      }
    } catch (err) {
      console.error('Fehler im Affiliate-Programm:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${type} wurde in die Zwischenablage kopiert!`);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
      toast.error('Fehler beim Kopieren!');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `Hey! Registriere dich bei Smooth Bowl mit meinem persönlichen Link und erhalte 10€ Rabatt auf deine erste Bestellung ab 25€: ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-teal-700 mb-4">Affiliate-Programm</h2>
        <p className="text-gray-600 mb-6">
          Teile deinen persönlichen Einladungslink mit Freunden und Familie. Wenn sie sich registrieren und eine Bestellung ab 25€ aufgeben,
          erhalten sie 10€ Rabatt und du bekommst 50% Rabatt auf deine nächste Bestellung ab 20€!
        </p>
      </div>

      {/* Referral-Link und Aktionen */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <BsLink45Deg className="text-teal-500 mr-2" size={20} />
          Dein persönlicher Einladungslink
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-grow relative">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(referralLink, 'Link')}
              className="flex items-center justify-center py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-300"
            >
              {copied ? <BsCheckCircle className="mr-1" /> : <BsClipboard className="mr-1" />}
              Kopieren
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
            >
              <BsWhatsapp className="mr-1" />
              Teilen
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Dein Einladungscode:</h4>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 font-mono font-bold py-1 px-3 rounded border border-teal-200">
              {referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(referralCode, 'Code')}
              className="text-teal-600 hover:text-teal-800"
            >
              {copied ? <BsCheckCircle /> : <BsClipboard />}
            </button>
          </div>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
          <h3 className="text-teal-700 font-medium mb-1">Einladungen gesamt</h3>
          <p className="text-2xl font-bold text-teal-800">{stats.totalReferrals}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <h3 className="text-green-700 font-medium mb-1">Erfolgreiche Einladungen</h3>
          <p className="text-2xl font-bold text-green-800">{stats.successfulReferrals}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <h3 className="text-amber-700 font-medium mb-1">Ausstehende Einladungen</h3>
          <p className="text-2xl font-bold text-amber-800">{stats.pendingReferrals}</p>
        </div>
      </div>

      {/* Verfügbare Gutscheine */}
      {coupons.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-teal-700 mb-4 flex items-center">
            <BsGift className="text-teal-500 mr-2" />
            Deine Gutscheine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{coupon.description}</h4>
                  <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                    {coupon.type === 'fixed' ? `${coupon.value}€` : `${coupon.value}%`}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Gutscheincode: <span className="font-mono font-medium">{coupon.code}</span>
                </p>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Mindestbestellwert: {coupon.min_order_value}€</span>
                  <span>Noch {coupon.max_uses - coupon.uses}x verwendbar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eingeladene Freunde */}
      {referrals.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-teal-700 mb-4">Deine eingeladenen Freunde</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {referral.referred?.first_name} {referral.referred?.last_name || ''}
                      </div>
                      <div className="text-sm text-gray-500">{referral.referred?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${referral.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          referral.status === 'qualified' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {referral.status === 'completed' ? 'Abgeschlossen' : 
                          referral.status === 'qualified' ? 'Qualifiziert' : 'Ausstehend'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wenn keine Referrals vorhanden sind */}
      {referrals.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mt-8">
          <p className="text-gray-600">
            Du hast noch keine Freunde eingeladen. Teile deinen Einladungslink und sammle Rabatte!
          </p>
        </div>
      )}
    </div>
  );
} 