import React, { useState, useEffect, Fragment } from 'react';
import { FeedbackData } from '../App';
import { BugIcon, LightbulbIcon, ChatBubbleIcon, CloseIcon, SendIcon } from './Icons';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => void;
  initialUrl?: string;
}

type FeedbackType = 'Bug Report' | 'Feature Request' | 'General';

const feedbackTypes: { name: FeedbackType, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'Bug Report', icon: BugIcon },
  { name: 'Feature Request', icon: LightbulbIcon },
  { name: 'General', icon: ChatBubbleIcon },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, initialUrl }) => {
  const [type, setType] = useState<FeedbackType>('General');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState(initialUrl || '');

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);
  
  useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
            onClose();
         }
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
         window.removeEventListener('keydown', handleEsc);
      };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit({
      type,
      message,
      email,
      url,
    });
  };
  
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="bg-purple-50 text-purple-700 p-2.5 rounded-xl border border-purple-100">
                <ChatBubbleIcon className="w-5 h-5" />
             </div>
             <h2 id="feedback-title" className="text-xl font-bold text-slate-900">Send Feedback</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50" 
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3">
                What type of feedback is this?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {feedbackTypes.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setType(name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      type === name
                        ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm ring-1 ring-purple-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-800 active:bg-purple-100 active:border-purple-400'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${type === name ? 'text-purple-600' : 'text-slate-500'}`} />
                    <span className="text-sm font-semibold">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold text-slate-800 mb-2">
                Message <span className="text-red-600 font-semibold">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue, suggestion, or feedback..."
                className="w-full h-32 p-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 hover:border-slate-400 transition-all duration-200 resize-none"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-800 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 hover:border-slate-400 transition-all duration-200"
                  />
                   <p className="text-xs text-slate-600 mt-2">We'll only use this to follow up if needed</p>
                </div>
                <div>
                  <label htmlFor="url" className="block text-sm font-bold text-slate-800 mb-2">
                    URL (optional)
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 hover:border-slate-400 transition-all duration-200"
                  />
                  <p className="text-xs text-slate-600 mt-2">The URL you were analyzing</p>
                </div>
            </div>
          </div>

          <footer className="flex justify-end gap-3 p-6 bg-slate-50/80 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-slate-300 text-slate-800 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-slate-400 disabled:text-slate-200 disabled:cursor-not-allowed disabled:hover:bg-slate-400"
              disabled={!message.trim()}
            >
                <SendIcon className="w-5 h-5"/>
                Send Feedback
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
