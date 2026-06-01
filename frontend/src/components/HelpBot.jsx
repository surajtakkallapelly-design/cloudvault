import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronRight } from 'lucide-react';

export default function HelpBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I am your CloudVault Assistant. 🚀\nHow can I help you manage your personal cloud vault today?',
      time: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const quickQuestions = [
    { text: 'How to upload files?', query: 'upload' },
    { text: 'Where is the trash?', query: 'trash' },
    { text: 'How to star a file?', query: 'star' },
    { text: 'How global search works?', query: 'search' },
    { text: 'Sharing on social media', query: 'shared' },
  ];

  const getBotResponse = (query) => {
    const q = query.toLowerCase();
    
    if (q.includes('upload') || q.includes('add') || q.includes('put')) {
      return 'To upload files:\n1. Click "All Files" on the sidebar.\n2. Drag & drop any file into the upload zone, or click it to select files.\n3. On mobile, click the floating "+" button or the bottom navigation "Upload" button.';
    }
    if (q.includes('star') || q.includes('important') || q.includes('favorite')) {
      return 'You can star any file by clicking the Star outline icon on its card or in the table view. To view all your starred files, click the "Starred" tab in the sidebar.';
    }
    if (q.includes('trash') || q.includes('delete') || q.includes('remove') || q.includes('soft')) {
      return 'Deleting a file moves it to the "Trash Bin" (soft-delete). To view your deleted files, click the "Trash" tab. From there, you can restore files or delete them permanently.';
    }
    if (q.includes('restore') || q.includes('recover') || q.includes('undo')) {
      return 'To restore a deleted file:\n1. Go to the "Trash" tab.\n2. Hover over the file card or row.\n3. Click the "Restore" button (the circular counter-clockwise arrow icon).';
    }
    if (q.includes('search') || q.includes('find')) {
      return 'The top search bar filters your files by name. Typing in it searches globally across all folders, bypassing folder restrictions instantly!';
    }
    if (q.includes('share') || q.includes('facebook') || q.includes('whatsapp') || q.includes('instagram') || q.includes('link')) {
      return 'To share a file:\n1. Click the "Share" icon on the file card.\n2. Turn on "Link Sharing".\n3. Copy the URL, or click the WhatsApp / Facebook buttons to post them directly. For Instagram, the link will copy with tips on how to add it to your story!';
    }
    if (q.includes('setting') || q.includes('profile') || q.includes('password') || q.includes('name')) {
      return 'Open the "Settings" tab in the sidebar or mobile bottom bar. There you can change your display name (initials update instantly!) and simulate password changes.';
    }
    if (q.includes('limit') || q.includes('size') || q.includes('storage') || q.includes('capacity')) {
      return 'You get 20 GB of free storage. View your metrics in the "Storage Analysis" widget.';
    }

    return 'I can help you with uploads, folders, stars, trashing/restoring, global searches, user settings, and social sharing. Try asking about one of those topics, or contact support@cloudvault.com!';
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Simulate bot thinking
    setTimeout(() => {
      const botReply = {
        sender: 'bot',
        text: getBotResponse(text),
        time: new Date(),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Collapsible Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] max-w-[calc(100vw-2rem)] rounded-3xl bg-zinc-950/95 border border-zinc-850 shadow-2xl overflow-hidden flex flex-col backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 text-zinc-100">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-850 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-650/20 text-indigo-400 border border-indigo-500/20">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">Vault Assistant</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450">Online Support</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 hover:bg-zinc-800 text-zinc-550 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px] min-h-[220px] text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 items-start ${
                  msg.sender === 'user' ? 'flex-row-reverse text-right' : ''
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    msg.sender === 'user'
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <div
                  className={`rounded-2xl px-3 py-2 max-w-[80%] text-left whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-850 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions suggestion pills */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 space-y-1.5 border-t border-zinc-900/60 pt-3">
              <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">Quick Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.text)}
                    className="flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:text-white px-2.5 py-1 text-[10px] text-zinc-400 transition-colors cursor-pointer"
                  >
                    <span>{q.text}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-zinc-850 bg-zinc-900/40 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-semibold"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer border-0 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Trigger Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/10 hover:scale-105 hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer border border-indigo-500/20"
        title="Help Assistant Chatbot"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>
    </div>
  );
}
