import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero-Bereich */}
      <section className="w-full bg-gradient-to-r from-green-400 to-teal-500 py-16 md:py-24">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frische Smoothies & Bowls
            </h1>
            <p className="text-xl text-white mb-6">
              Entdecke unsere gesunden und leckeren Smoothies und Bowls - direkt zu dir nach Hause geliefert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/shop/menu" 
                className="bg-white text-teal-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-teal-50 transition duration-300 text-center"
              >
                Menü ansehen
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute w-80 h-80 bg-white rounded-full opacity-20"></div>
              <Image
                src="/images/hero-smoothie.png"
                alt="Smoothie"
                width={320}
                height={320}
                className="relative z-10"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Vorteile-Bereich */}
      <section className="w-full py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Warum Smooth Bowl?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Frische Zutaten</h3>
              <p className="text-gray-600">Wir verwenden nur frische, saisonale und qualitativ hochwertige Zutaten für unsere Smoothies und Bowls.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Schnelle Lieferung</h3>
              <p className="text-gray-600">Bestelle einfach online und wir liefern deine frischen Smoothies und Bowls direkt zu dir nach Hause.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Gesund & Lecker</h3>
              <p className="text-gray-600">Unsere Rezepte sind gesund, nahrhaft und schmecken unglaublich gut - die perfekte Kombination!</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Beliebteste Produkte */}
      <section className="w-full py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Unsere beliebtesten Produkte</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Entdecke unsere Bestseller, die von unseren Kunden am meisten geliebt werden.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 w-full bg-gray-200 relative">
                <span className="absolute top-2 right-2 bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded">Bestseller</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">Beeren Traum</h3>
                <p className="text-gray-600 text-sm mb-4">Ein köstlicher Mix aus Erdbeeren, Blaubeeren und Himbeeren</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-600">6,99 €</span>
                  <button className="bg-teal-500 text-white text-sm py-1 px-3 rounded hover:bg-teal-600 transition">Zum Warenkorb</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 w-full bg-gray-200 relative"></div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">Tropical Paradise</h3>
                <p className="text-gray-600 text-sm mb-4">Erfrischender Mix aus Mango, Ananas und Kokosmilch</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-600">7,49 €</span>
                  <button className="bg-teal-500 text-white text-sm py-1 px-3 rounded hover:bg-teal-600 transition">Zum Warenkorb</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 w-full bg-gray-200 relative">
                <span className="absolute top-2 right-2 bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded">Bestseller</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">Açaí Dream Bowl</h3>
                <p className="text-gray-600 text-sm mb-4">Klassische Açaí-Bowl mit gemischten Beeren und Granola</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-600">9,99 €</span>
                  <button className="bg-teal-500 text-white text-sm py-1 px-3 rounded hover:bg-teal-600 transition">Zum Warenkorb</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 w-full bg-gray-200 relative"></div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">Tropical Bowl</h3>
                <p className="text-gray-600 text-sm mb-4">Exotische Bowl mit Mango, Ananas und Kokosflocken</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-600">10,49 €</span>
                  <button className="bg-teal-500 text-white text-sm py-1 px-3 rounded hover:bg-teal-600 transition">Zum Warenkorb</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-10">
            <Link 
              href="/shop/menu" 
              className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 transition duration-300"
            >
              Alle Produkte ansehen
            </Link>
          </div>
        </div>
      </section>
      
      {/* Call-to-Action */}
      <section className="w-full py-16 bg-gradient-to-r from-teal-500 to-green-400">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Bereit für gesunden Genuss?</h2>
          <p className="text-white text-xl max-w-2xl mx-auto mb-8">
            Bestelle jetzt und erlebe den unvergleichlichen Geschmack unserer frischen Smoothies und Bowls!
          </p>
          <Link 
            href="/shop/menu" 
            className="bg-white text-teal-600 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-teal-50 transition duration-300 inline-block"
          >
            Jetzt bestellen
          </Link>
        </div>
      </section>
    </main>
  );
} 