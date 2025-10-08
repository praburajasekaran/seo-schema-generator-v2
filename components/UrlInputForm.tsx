import React, { useState } from 'react';
import { SparklesIcon, MagicWandIcon, StopIcon } from './Icons';

interface UrlInputFormProps {
  onGenerate: (url: string) => void;
  isLoading: boolean;
  onExample: () => void;
  onCancel: () => void;
  onUrlChange: (url: string) => void;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onGenerate, isLoading, onExample, onCancel, onUrlChange }) => {
  const [url, setUrl] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string>('');

  const validateUrl = (inputUrl: string): string => {
    if (!inputUrl.trim()) {
      return 'Please enter a URL';
    }
    
    try {
      const urlObj = new URL(inputUrl);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL must start with http:// or https://';
      }
      return '';
    } catch {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    onUrlChange(newUrl); // Notify parent component
    
    // Clear error when user starts typing
    if (urlError) {
      setUrlError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUrl(url);
    
    if (error) {
      setUrlError(error);
      return;
    }
    
    onGenerate(url);
  };

  const isInputActive = isFocused || url.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Generate Schema Markup</h2>
        <p className="text-slate-600 text-lg">Enter any website URL to get started</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Modern input container */}
        <div className="flex-grow relative">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full bg-white/90 backdrop-blur-sm border-2 rounded-2xl px-6 py-5 text-slate-900 text-lg transition-all duration-300 focus:outline-none shadow-lg ${
                urlError 
                  ? 'border-red-400 shadow-red-200' 
                  : isInputActive 
                    ? 'border-blue-400 shadow-blue-200' 
                    : 'border-slate-200 hover:border-slate-300 shadow-slate-200'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
              required
              placeholder="https://example.com"
              aria-label="Website URL to analyze for schema generation"
              aria-invalid={urlError ? 'true' : 'false'}
              aria-describedby={urlError ? 'url-error' : 'url-help'}
              aria-required="true"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🔗</span>
              </div>
            </div>
          </div>
          
          {/* Error message */}
          {urlError && (
            <div id="url-error" className="mt-3 flex items-center gap-2 text-red-600 font-medium">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">!</span>
              </div>
              {urlError}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/30 shadow-lg hover:shadow-xl text-lg min-w-[140px]"
            aria-label="Stop schema generation"
          >
            <StopIcon className="w-5 h-5" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-lg min-w-[180px]"
            aria-label="Generate schema markup for the entered URL"
            title="Generate schema markup (Ctrl+Enter)"
          >
            <SparklesIcon className="w-5 h-5" />
            Generate
          </button>
        )}
      </div>
      
      <div className="text-center pt-4">
         <button
            type="button"
            onClick={onExample}
            disabled={isLoading}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 active:text-slate-900 transition-colors disabled:opacity-50 font-medium bg-white/50 hover:bg-white/80 px-6 py-3 rounded-full border border-slate-200 shadow-sm"
        >
            <MagicWandIcon className="w-5 h-5" />
            Try an Example
        </button>
      </div>
    </form>
  );
};