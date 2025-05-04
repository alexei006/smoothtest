'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MenuRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/shop/bestellen');
  }, [router]);
  
  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
    </div>
  );
} 