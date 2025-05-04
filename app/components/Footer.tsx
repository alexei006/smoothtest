import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Über uns */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Über Smooth Bowl</h3>
            <p className="text-gray-300 mb-4">
              Wir liefern frische, gesunde Smoothies und Bowls direkt zu dir nach Hause.
              Mit den besten Zutaten und voller Geschmack.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition">
                  Startseite
                </Link>
              </li>
              <li>
                <Link href="/shop/menu" className="text-gray-300 hover:text-white transition">
                  Menü
                </Link>
              </li>
              <li>
                <Link href="/shop/cart" className="text-gray-300 hover:text-white transition">
                  Warenkorb
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-300 hover:text-white transition">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Rechtliches</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/impressum" className="text-gray-300 hover:text-white transition">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-gray-300 hover:text-white transition">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-gray-300 hover:text-white transition">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/widerrufsrecht" className="text-gray-300 hover:text-white transition">
                  Widerrufsrecht
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Kontakt</h3>
            <address className="not-italic text-gray-300">
              <p>Smooth Bowl GmbH</p>
              <p>Musterstraße 123</p>
              <p>12345 Musterstadt</p>
              <p className="mt-2">Telefon: 01234 / 56789</p>
              <p>E-Mail: info@smoothbowl.de</p>
            </address>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Smooth Bowl GmbH. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
} 