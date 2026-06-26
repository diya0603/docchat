'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

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
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
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

      setMessages((prev) => [...prev, {role:'assitant', content:''}]);
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
              role: 'asssitant',
              content: updated[updated.length-1].content + content,
            };
            return updated;
          });
        }
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
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <h1 className="mb-4 text-xl font-bold">Chat</h1>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg p-3 text-sm ${
              msg.role === 'user'
                ? 'ml-auto bg-black text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {isSending && (
          <div className="max-w-[80%] rounded-lg bg-gray-100 p-3 text-sm text-gray-500">
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}