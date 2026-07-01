'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import PageContainer from '../components/PageContainer';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setError('');
    setIsUploading(true);

    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await new Promise<{ document_id: number }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 401) {
            reject(new Error('unauthorized'));
            return;
            }
            if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
            } else {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.detail || 'Upload failed'));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));

        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
        });

        router.push(`/chat/${data.document_id}`);
    } catch (err) {
    if (err instanceof Error && err.message === 'unauthorized') {
      Cookies.remove('token');
      router.push('/login');
      return;
    }
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unexpected error occurred');
    }
  } finally {
    setIsUploading(false);
  }
  }

  return (
  <PageContainer centered>
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-xl border border-gray-800 bg-gray-950 p-8"
    >
      <h1 className="text-2xl font-bold">Upload a document</h1>
      <p className="text-sm text-gray-500">PDF files only. Start chatting instantly after upload.</p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 px-4 py-8 text-center hover:border-gray-500 transition-colors">
        <span className="text-2xl mb-2">📄</span>
        <span className="text-sm text-gray-400">
          {file ? file.name : 'Click to select a PDF'}
        </span>
        <span className="mt-1 text-xs text-gray-600">
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF files only'}
        </span>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          required
          className="hidden"
        />
      </label>

      {isUploading && (
        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-gray-500">{uploadProgress}%</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading || !file}
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  </PageContainer>
);
}