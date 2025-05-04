'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase-client';
import { Toaster, toast } from 'react-hot-toast';

// Interface für RegisterData aus dem AuthContext
interface RegisterData {
  email: string;
  password: string;
  name: string;
  plz?: string;
  address?: string;
  phoneNumber?: string;
  newsletter?: boolean;
  confirmPassword?: string;
}

// Client-Komponente für useSearchParams
import dynamic from 'next/dynamic';

const RegisterFormWithParams = dynamic(() => 
  import('./register-form').then((mod) => mod.RegisterForm), 
  { ssr: false, loading: () => <div className="container mx-auto p-4 text-center">Lädt...</div> }
);

export default function Register() {
  return <RegisterFormWithParams />;
} 