import { useState, useRef, useEffect, useCallback } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface ChatPanelProps { packId: string; versionId: string; }

const SUGGESTED_QUESTIONS = [
  'What are the most important things to fix?',
  'Which issues would block my submission?',
  'What are the quick wins I can do this week?',
  'Can you explain what the BSR will focus on?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export default function ChatPanel({ packId, versionId }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingContent]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMessage: Message = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setError(null);
    setStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch(`/api/packs/${packId}/versions/${versionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let accumulatedText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.done) break;
            if (parsed.text) { accumulatedText += parsed.text; setStreamingContent(accumulatedText); }
          } catch {}
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', content: accumulatedText }]);
      setStreamingContent('');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, packId, versionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all duration-200 text-sm font-semibold" aria-label="Chat about your results">
        {open ? <><span>✕</span><span>Close chat</span></> : <><span>💬</span><span>Ask about your results</span></>}
      </button>
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[520px] flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <div>
              <p className="font-semibold text-sm">Ask Attlee</p>
              <p className="text-xs text-indigo-200">Answers grounded in your assessment results</p>
            </div>
            {messages.length > 0 && <button onClick={() => { setMessages([]); setStreamingContent(''); }} className="text-xs text-indigo-300 hover:text-white transition-colors">Clear</button>}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
            {messages.length === 0 && !streaming && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 text-center">Ask anything about your assessment results</p>
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button key={q} onClick={() => sendMessage(q)} className="w-full text-left text-xs text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg px-3 py-2.5 transition-colors leading-snug">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>{msg.content}</div>
              </div>
            ))}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl rounded-bl-sm px-3 py-2.5 text-sm leading-relaxed bg-white border border-slate-200 text-slate-800 shadow-sm whitespace-pre-wrap">
                  {streamingContent || <TypingIndicator />}
                </div>
              </div>
            )}
            {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-center">{error}</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-slate-200 bg-white px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your results…" rows={1} disabled={streaming} className="flex-1 resize-none text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 bg-white text-slate-800 placeholder-slate-400" style={{ maxHeight: '96px', overflowY: 'auto' }} />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming} className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors">Send</button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 pl-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
