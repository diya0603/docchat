'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get('token'));
  }, [pathname]);

  function handleLogout() {
    Cookies.remove('token');
    setIsLoggedIn(false);
    router.push('/login');
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          DocChat
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link href="/documents" className="text-gray-600 hover:text-black">
                My Documents
              </Link>
              <button onClick={handleLogout} className="text-gray-600 hover:text-black">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md bg-black px-3 py-1.5 text-white hover:bg-gray-800">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-black px-3 py-1.5 text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}