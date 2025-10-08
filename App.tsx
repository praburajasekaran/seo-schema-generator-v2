import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSchemaForUrl } from './services/geminiService';
import { UrlInputForm } from './components/UrlInputForm';
import { SchemaDisplay } from './components/SchemaDisplay';
import { FeedbackModal } from './components/FeedbackModal';
import { SparklesIcon, ErrorIcon, ChatBubbleIcon } from './components/Icons';

// Development-only logging utility
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

interface SchemaObject {
  type: string;
  schema: string;
}

export interface FeedbackData {
  type: 'Bug Report' | 'Feature Request' | 'General';
  message: string;
  email?: string;
  url?: string;
}


const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [schemas, setSchemas] = useState<SchemaObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerateSchema = useCallback(async (inputUrl: string) => {
    if (!inputUrl) {
      setError('Please enter a URL.');
      return;
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    isCancelledRef.current = false; // Reset for new request
    setUrl(inputUrl);
    setIsLoading(true);
    setError(null);
    setSchemas([]);

    try {
      const result = await generateSchemaForUrl(inputUrl, abortControllerRef.current.signal);
      
      if (isCancelledRef.current) {
        devLog("Operation was cancelled. Discarding result.");
        return;
      }

      let parsedResult: SchemaObject[];
      try {
        parsedResult = JSON.parse(result);
      } catch (parseError) {
        devError('Failed to parse response as JSON:', parseError);
        setError("Invalid response format received. Please try again.");
        return;
      }
      
      if (Array.isArray(parsedResult) && parsedResult.length > 0 && parsedResult.every(item => item.schema && item.type)) {
        // Process each schema to ensure it's properly formatted
        const prettySchemas = parsedResult.map(item => {
          try {
            // If schema is already a properly formatted JSON string, use it as-is
            if (typeof item.schema === 'string' && item.schema.trim().startsWith('{')) {
              // Try to parse and reformat for consistency
              const parsed = JSON.parse(item.schema);
              return {
                ...item,
                schema: JSON.stringify(parsed, null, 2)
              };
            } else if (typeof item.schema === 'string') {
              // It's a JSON string but might need reformatting
              return {
                ...item,
                schema: item.schema
              };
            } else {
              // It's an object, stringify it
              return {
                ...item,
                schema: JSON.stringify(item.schema, null, 2)
              };
            }
          } catch (schemaParseError) {
            devError('Failed to process schema:', schemaParseError, item);
            return {
              ...item,
              schema: typeof item.schema === 'string' ? item.schema : JSON.stringify(item.schema || {}, null, 2)
            };
          }
        });
        setSchemas(prettySchemas);
      } else {
        setError("Response was in an unexpected format or no schemas were found. Please try again.");
      }
    } catch (err) {
      if (isCancelledRef.current || (err as Error).message === "Operation was cancelled") {
        devLog("Operation was cancelled. Discarding error.");
        return;
      }
      devError(err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('CORS') || errorMessage.includes('proxy') || errorMessage.includes('Failed to fetch') || errorMessage.includes('cross-origin')) {
        setError('Unable to access the webpage due to CORS restrictions. This website blocks cross-origin requests, which prevents our tool from analyzing its content. Try a different URL or use the example button.');
      } else if (errorMessage.includes('completely blocked') || errorMessage.includes('no content received')) {
        setError('This website has very strict CORS policies that prevent any cross-origin access. Unfortunately, we cannot analyze this particular website. Please try a different URL or use the example button.');
      } else {
        setError('Failed to generate schema. The URL might be inaccessible or the content is not suitable for schema generation. Please check the console for more details.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // Empty dependency array is correct since we're not using any external dependencies

  const handleExample = () => {
    const exampleUrl = 'https://example.com/';
    handleGenerateSchema(exampleUrl);
  };
  
  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    
    // Abort the current request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsLoading(false);
    setError(null);
  }, []);

  const handleFeedbackSubmit = (data: FeedbackData) => {
    devLog("Feedback Submitted:", data);
    // Here you would typically send the data to a server
    setIsFeedbackModalOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Keyboard shortcuts for power users (Heuristic #7 - Flexibility and Efficiency)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in form inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Ctrl/Cmd + Enter to generate schema
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isLoading && url) {
          handleGenerateSchema(url);
        }
      }
      
      // Escape to cancel loading or close modals
      if (event.key === 'Escape') {
        if (isLoading) {
          handleCancel();
        } else if (isFeedbackModalOpen) {
          setIsFeedbackModalOpen(false);
        }
      }
      
      // Ctrl/Cmd + / to open feedback modal
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setIsFeedbackModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, url, isFeedbackModalOpen, handleGenerateSchema, handleCancel]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 antialiased">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 flex flex-col">
        {/* Modern Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-700 font-semibold">Professional SEO Tool</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight mb-6">
            Schema Generator
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
            Transform any website into structured data. Generate comprehensive JSON-LD schema markup in seconds.
          </p>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-8 text-slate-500 mb-16">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Instant Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">SEO Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Built-in Validation</span>
            </div>
          </div>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 mb-16">
          <UrlInputForm 
            onGenerate={handleGenerateSchema} 
            isLoading={isLoading} 
            onExample={handleExample} 
            onCancel={handleCancel}
            onUrlChange={setUrl}
          />
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-8 rounded-3xl flex items-start gap-6 transition-opacity duration-300 text-base mb-16 shadow-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ErrorIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-3 text-xl">Something went wrong</h3>
              <p className="font-medium mb-4 text-lg">{error}</p>
              <div className="text-base text-red-600">
                <p className="mb-4 font-semibold">Try these solutions:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check if the URL is correct and accessible</li>
                  <li>Make sure the website is not behind a login or paywall</li>
                  <li>Try a different URL or use the example button</li>
                  <li>Wait a moment and try again</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="text-center p-16 text-slate-600 flex flex-col items-center justify-center gap-8 mb-16">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                <SparklesIcon className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-slate-800">Analyzing & Generating</h3>
              <p className="text-slate-600 text-lg">Processing your website content...</p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <div className="mt-8 p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl max-w-lg shadow-lg">
              <p className="text-base text-slate-700">
                <strong>What's happening:</strong> We're analyzing the webpage content and generating appropriate schema markup for better SEO.
              </p>
            </div>
          </div>
        )}

        {schemas.length > 0 && !isLoading && (
          <SchemaDisplay schemas={schemas} />
        )}
        
        {!isLoading && schemas.length === 0 && !error && (
            <div className="text-center mt-16 flex-grow flex flex-col justify-center items-center">
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 max-w-4xl">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <SparklesIcon className="w-12 h-12 text-white"/>
                    </div>
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">Ready to Generate Schemas</h2>
                    <p className="text-slate-600 text-xl mb-12">Enter a URL above to see your structured data come to life</p>
                    
                    {/* How it works section */}
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span className="text-2xl font-bold text-white">1</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Enter URL</h3>
                            <p className="text-slate-600">Paste any website URL you want to analyze</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span className="text-2xl font-bold text-white">2</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Smart Analysis</h3>
                            <p className="text-slate-600">We analyze content and identify appropriate schema types</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span className="text-2xl font-bold text-white">3</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Copy & Use</h3>
                            <p className="text-slate-600">Copy the generated JSON-LD code to your website</p>
                        </div>
                    </div>
                    
                    {/* Benefits section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                        <h3 className="font-bold text-xl text-slate-800 mb-4">Why Use Schema Markup?</h3>
                        <div className="grid md:grid-cols-2 gap-6 text-left">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Better SEO Rankings</h4>
                                    <p className="text-slate-600 text-sm">Help search engines understand your content</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Rich Snippets</h4>
                                    <p className="text-slate-600 text-sm">Enhanced search results with images and ratings</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Voice Search Ready</h4>
                                    <p className="text-slate-600 text-sm">Optimize for voice assistants and featured snippets</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Instant Validation</h4>
                                    <p className="text-slate-600 text-sm">Built-in validation ensures your markup is correct</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <footer className="relative z-10 w-full text-center p-12 text-slate-500 text-lg mt-16 bg-white/80 backdrop-blur-sm border-t border-white/20">
        <button 
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center gap-3 mx-auto text-slate-600 hover:text-slate-800 transition-colors mb-6 font-semibold text-lg bg-white/50 hover:bg-white/80 px-6 py-3 rounded-full border border-white/20 shadow-lg"
            aria-label="Send Feedback"
        >
            <ChatBubbleIcon className="w-5 h-5" />
            Send Feedback
        </button>
        <p className="text-slate-500 text-lg">A simple tool by <a href="#" className="text-slate-700 hover:text-slate-900 hover:underline font-semibold transition-colors">Paretoid Marketing LLP</a>. We prefer less software.</p>
      </footer>
      
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        onSubmit={handleFeedbackSubmit}
        initialUrl={url}
      />
    </div>
  );
};

export default App;