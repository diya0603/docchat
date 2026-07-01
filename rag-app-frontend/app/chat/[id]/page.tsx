'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import PageContainer from '@/app/components/PageContainer';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: string;
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHistory() {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/conversations/${documentId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 401) {
          Cookies.remove('token');
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        setError('Failed to load chat history');
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [documentId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;

    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const question = input;
    setInput('');
    setMessages((prev) => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: '' },
      ]);
    setIsSending(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: question, document_id: Number(documentId) }),
      });

      if (res.status === 401) {
        Cookies.remove('token');
        router.push('/login');
        return;
      }

      if (!res.ok || !res.body) {
      throw new Error('Failed to get answer');
    }

      //setMessages((prev) => [...prev, {role:'assistant', content:''}]);
      const reader =  res.body.getReader();
      const decoder = new TextDecoder();
      let buffer='';

      while (true){
        const {done, value} = await reader.read();
        if (done) break;

        buffer+=decoder.decode(value, {stream: true});

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // we are only processign the complete events

        for (const line of lines){
          if(!line.startsWith('data: ')) continue;
          const content = line.slice(6);

          if (content == '[DONE]') continue;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length-1]={
              role: 'assistant',
              content: updated[updated.length-1].content + content,
            };
            return updated;
          });
        }
      }
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/${documentId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setMessages(refreshed);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  }

  if (isLoadingHistory) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
  <PageContainer>
  <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
    {/* Header bar */}
    <div className="border-b border-gray-800 px-4 py-3">
      <h1 className="text-sm font-medium text-gray-400">Chat</h1>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.length === 0 && !isSending && (
        <p className="text-center text-sm text-gray-600 mt-8">
          Ask a question about your document to get started.
        </p>
      )}

      {messages.map((msg, i) => (
        msg.content ? (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-200'
              }`}
            >
              <ReactMarkdown
                components={{
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : null
      ))}

      {/* {isSending && (
        <div className="max-w-[75%] rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-500">
          Thinking...
        </div>
      )} */}

      <div ref={bottomRef} />
    </div>

    {error && <p className="px-4 text-sm text-red-400">{error}</p>}

    {/* Input */}
    <div className="border-t border-gray-800 px-4 py-3">
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  </div>
  </PageContainer>
);
}