'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

interface DocumentItem {
  id: number;
  filename: string;
  created_at: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDocuments() {
      const token = Cookies.get('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          Cookies.remove('token');
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load documents');
        }

        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [router]);



  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Documents</h1>
    
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Link
        href="/upload"
        className="mb-6 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        + Upload new document
      </Link>

      <div className="space-y-2">
        {documents.length === 0 && (
          <p className="text-sm text-gray-500">No documents yet. Upload one to get started.</p>
        )}

        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/chat/${doc.id}`}
            className="block rounded-md border p-4 text-sm hover:bg-gray-50"
          >
            {doc.filename}
          </Link>
        ))}
      </div>
    </div>
  );
}