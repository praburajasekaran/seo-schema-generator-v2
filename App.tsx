import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSchemaForUrl } from './services/geminiService';
import { UrlInputForm } from './components/UrlInputForm';
import { SchemaDisplay } from './components/SchemaDisplay';
import { FeedbackModal } from './components/FeedbackModal';
import { ProfileManager } from './components/ProfileManager';
import { WebsiteProfile } from './services/websiteProfileService';
import { SparklesIcon, ErrorIcon, ChatBubbleIcon, UserIcon } from './components/Icons';

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
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);
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
      setError('Failed to generate schema. Please check the URL and try again.');
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

  const handleProfileSelect = (profile: WebsiteProfile) => {
    devLog("Profile selected:", profile);
    // You could store the selected profile in state if needed for schema generation
    setIsProfileManagerOpen(false);
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
      
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col">
        {/* Modern Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-4 shadow-lg border border-white/20">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-700 font-medium">Professional SEO Tool</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight mb-4">
            Schema Generator
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Transform any website into structured data. Generate comprehensive JSON-LD schema markup in seconds.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 text-slate-500 mb-8">
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
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 md:p-8 mb-8">
          <UrlInputForm 
            onGenerate={handleGenerateSchema} 
            isLoading={isLoading} 
            onExample={handleExample} 
            onCancel={handleCancel}
            onUrlChange={setUrl}
          />
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-start gap-4 transition-opacity duration-300 text-sm mb-8 shadow-lg backdrop-blur-sm">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ErrorIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-2 text-lg">Something went wrong</h3>
              <p className="font-medium mb-3">{error}</p>
              <div className="text-sm text-red-600">
                <p className="mb-2 font-semibold">Try these solutions:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check if the URL is correct and accessible</li>
                  <li>Try a different URL or use the example button</li>
                  <li>Wait a moment and try again</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="text-center p-8 text-slate-600 flex flex-col items-center justify-center gap-4 mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">Analyzing & Generating</h3>
              <p className="text-slate-600">Processing your website content...</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl max-w-md shadow-lg">
              <p className="text-sm text-slate-700">
                <strong>What's happening:</strong> We're analyzing the webpage content and generating appropriate schema markup for better SEO.
              </p>
            </div>
          </div>
        )}

        {schemas.length > 0 && !isLoading && (
          <SchemaDisplay schemas={schemas} />
        )}
        
        {!isLoading && schemas.length === 0 && !error && (
            <div className="text-center mt-8 flex-grow flex flex-col justify-center items-center">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 max-w-3xl">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <SparklesIcon className="w-8 h-8 text-white"/>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Ready to Generate Schemas</h2>
                    <p className="text-slate-600 mb-8">Enter a URL above to see your structured data come to life</p>

                    {/* How it works section */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <span className="text-lg font-bold text-white">1</span>
                            </div>
                            <h3 className="font-bold text-base text-slate-800 mb-1">Enter URL</h3>
                            <p className="text-slate-600 text-sm">Paste any website URL you want to analyze</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <span className="text-lg font-bold text-white">2</span>
                            </div>
                            <h3 className="font-bold text-base text-slate-800 mb-1">Smart Analysis</h3>
                            <p className="text-slate-600 text-sm">We analyze content and identify appropriate schema types</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <span className="text-lg font-bold text-white">3</span>
                            </div>
                            <h3 className="font-bold text-base text-slate-800 mb-1">Copy & Use</h3>
                            <p className="text-slate-600 text-sm">Copy the generated JSON-LD code to your website</p>
                        </div>
                    </div>

                    {/* Benefits section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="font-bold text-lg text-slate-800 mb-3">Why Use Schema Markup?</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-left">
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Better SEO Rankings</h4>
                                    <p className="text-slate-600 text-xs">Help search engines understand your content</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Rich Snippets</h4>
                                    <p className="text-slate-600 text-xs">Enhanced search results with images and ratings</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Voice Search Ready</h4>
                                    <p className="text-slate-600 text-xs">Optimize for voice assistants and featured snippets</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Instant Validation</h4>
                                    <p className="text-slate-600 text-xs">Built-in validation ensures your markup is correct</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <footer className="relative z-10 w-full text-center p-8 text-slate-500 mt-8 bg-white/80 backdrop-blur-sm border-t border-white/20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button
              onClick={() => {
                console.log('Manage Profiles button clicked');
                console.log('isProfileManagerOpen before:', isProfileManagerOpen);
                setIsProfileManagerOpen(true);
                console.log('isProfileManagerOpen after:', true);
              }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors font-medium bg-white/50 hover:bg-white/80 px-4 py-2 rounded-full border border-white/20 shadow-lg"
              aria-label="Manage Profiles"
          >
              <UserIcon className="w-4 h-4" />
              Manage Profiles
          </button>
          <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors font-medium bg-white/50 hover:bg-white/80 px-4 py-2 rounded-full border border-white/20 shadow-lg"
              aria-label="Send Feedback"
          >
              <ChatBubbleIcon className="w-4 h-4" />
              Send Feedback
          </button>
        </div>
        <p className="text-slate-500 text-sm">A simple tool by <a href="#" className="text-slate-700 hover:text-slate-900 hover:underline font-semibold transition-colors">Paretoid Marketing LLP</a>. We prefer less software.</p>
      </footer>
      
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        initialUrl={url}
      />

      <ProfileManager
        isOpen={isProfileManagerOpen}
        onClose={() => setIsProfileManagerOpen(false)}
        onProfileSelect={handleProfileSelect}
        initialUrl={url}
      />
    </div>
  );
};

export default App;