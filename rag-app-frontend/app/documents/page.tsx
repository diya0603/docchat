'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import PageContainer from '../components/PageContainer';

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
    <PageContainer>
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Documents</h1>
    
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Link
        href="/upload"
        className="mb-6 inline-block rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white"
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
            className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm hover:border-gray-600 hover:bg-gray-900 transition-colors"
          >
            <span className="text-gray-200 truncate mr-4">{doc.filename}</span>
            <span className="text-xs text-gray-500 ml-4 shrink-0">
              {new Date(doc.created_at).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
    </div>
    </PageContainer>
  );
}