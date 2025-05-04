'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import AuthOverlay from './AuthOverlay';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authOverlayOpen, setAuthOverlayOpen] = useState(false);
  const [authOverlayView, setAuthOverlayView] = useState('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  // Scrolleffekt für die Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Außerhalb klicken, um Dropdown zu schließen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false); // Schließe das Benutzermenü sofort
      
      // Einfaches Overlay erstellen
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'logout-overlay';
      loadingOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.3); z-index: 9999; display: flex; justify-content: center; align-items: center;';
      
      const spinner = document.createElement('div');
      spinner.style.cssText = 'width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;';
      
      const keyframes = document.createElement('style');
      keyframes.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      
      document.head.appendChild(keyframes);
      loadingOverlay.appendChild(spinner);
      document.body.appendChild(loadingOverlay);
      
      // Benutzerinformationen direkt aus dem localStorage/sessionStorage entfernen
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-auth-token');
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('sb-auth-token');
      
      // Versuche den regulären Logout zu verwenden, der intern setUser(null) aufruft
      try {
        await logout();
        console.log('Logout erfolgreich durchgeführt');
      } catch (e) {
        console.log('Fehler beim regulären Logout:', e);
      }
      
      // Kurze Verzögerung und dann direkt zur Startseite navigieren
      setTimeout(() => {
        // Overlay entfernen
        if (document.body.contains(loadingOverlay)) {
          document.body.removeChild(loadingOverlay);
        }
        if (document.head.contains(keyframes)) {
          document.head.removeChild(keyframes);
        }
        
        // Seite neu laden und zur Startseite navigieren
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('Fehler beim Abmelden:', error);
      
      // Im Fehlerfall trotzdem die Benutzerinformationen zurücksetzen
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-auth-token');
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('sb-auth-token');
      
      // Overlay entfernen
      const overlay = document.getElementById('logout-overlay');
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      const keyframesStyle = document.querySelector('style[innerHTML*="@keyframes spin"]');
      if (keyframesStyle && document.head.contains(keyframesStyle)) {
        document.head.removeChild(keyframesStyle);
      }
      
      // Zur Startseite navigieren
      window.location.href = '/';
    }
  };

  const openAuthOverlay = (view) => {
    setAuthOverlayView(view);
    setAuthOverlayOpen(true);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-teal-700 py-4'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className={`text-xl font-bold ${isScrolled ? 'text-teal-600' : 'text-white'}`}>Smooth Bowl</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/shop/bestellen" 
                className={`${isScrolled ? 'text-gray-700' : 'text-white'} font-medium hover:text-teal-400 transition-colors duration-300`}
              >
                Bestellen
              </Link>
              <Link 
                href="/kontakt" 
                className={`${isScrolled ? 'text-gray-700' : 'text-white'} font-medium hover:text-teal-400 transition-colors duration-300`}
              >
                Kontakt
              </Link>
              <Link 
                href="/shop/cart" 
                className={`${isScrolled ? 'text-gray-700' : 'text-white'} font-medium hover:text-teal-400 transition-colors duration-300`}
                aria-label="Warenkorb"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
              </Link>
              
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`${isScrolled ? 'text-gray-700' : 'text-white'} font-medium hover:text-teal-400 transition-colors duration-300 flex items-center`}
                    aria-label="Benutzermenü"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menü */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <div className="bg-teal-500 text-white py-2 px-4 rounded-t-md text-center font-medium">
                        Benutzerkonto
                      </div>
                      <div className="flex flex-col items-center py-2">
                        <Link 
                          href="/profile" 
                          className="w-5/6 my-1 text-center py-2 px-4 text-gray-700 hover:bg-teal-100 rounded-md transition-colors duration-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Mein Profil
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-5/6 my-1 text-center py-2 px-4 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 font-medium"
                        >
                          Abmelden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => openAuthOverlay('login')}
                    className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors duration-300"
                  >
                    Login
                  </button>
                </>
              )}
            </div>

            {/* Mobile Navigation Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="md:hidden focus:outline-none"
            >
              <svg 
                className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isOpen && (
            <div className="md:hidden bg-white mt-4 p-4 rounded-lg shadow-lg">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/shop/bestellen" 
                  className="text-gray-700 hover:text-teal-500 transition-colors duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  Bestellen
                </Link>
                <Link 
                  href="/kontakt" 
                  className="text-gray-700 hover:text-teal-500 transition-colors duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  Kontakt
                </Link>
                <Link 
                  href="/shop/cart" 
                  className="text-gray-700 hover:text-teal-500 transition-colors duration-300 flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                  Warenkorb
                </Link>
                
                {user ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="text-gray-700 hover:text-teal-500 transition-colors duration-300 flex items-center"
                      onClick={() => setIsOpen(false)}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                      Mein Profil
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 font-medium py-2 px-4 rounded-md w-full text-center mt-2"
                    >
                      Abmelden
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        openAuthOverlay('login');
                      }}
                      className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors duration-300 text-center"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Overlay */}
      <AuthOverlay 
        isOpen={authOverlayOpen} 
        onClose={() => setAuthOverlayOpen(false)} 
        initialView={authOverlayView} 
      />
    </>
  );
} 