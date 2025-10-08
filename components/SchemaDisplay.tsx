import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardIcon, CheckIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from './Icons';
import { SchemaValidationService, ValidatedSchema } from '../services/schemaValidationService';
import { ValidationResults } from './ValidationResults';

// Development-only logging utility
const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

interface SchemaObject {
  type: string;
  schema: string;
}

interface SchemaDisplayProps {
  schemas: SchemaObject[];
}

interface ValidatedSchemaDisplay extends ValidatedSchema {
  originalIndex: number;
}

const SyntaxHighlightedCode: React.FC<{ code: string }> = React.memo(({ code }) => {
  const highlightedHtml = useMemo(() => {
    if (!code) return '';

    // Ensure code is a string
    const codeString = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

    let tempCode = codeString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Keys
    tempCode = tempCode.replace(/"([^"\\]|\\.)*"(?=\s*:)/g, (match) => {
        return `<span style="color: #c084fc;">${match}</span>`;
    });
    
    // String values
    tempCode = tempCode.replace(/:\s*("([^"\\]|\\.)*")/g, (match, group) => {
        return `: <span style="color: #4ade80;">${group}</span>`;
    });

    // Numbers
    tempCode = tempCode.replace(/\b-?(?:\d+|\d+\.\d+|\.\d+)(?:[eE][-+]?\d+)?\b/g, '<span style="color: #60a5fa;">$&</span>');

    // Booleans
    tempCode = tempCode.replace(/\b(true|false)\b/g, '<span style="color: #fbbf24;">$&</span>');

    // Null
    tempCode = tempCode.replace(/\b(null)\b/g, '<span style="color: #94a3b8;">$&</span>');

    return tempCode;
  }, [code]);

  return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
});


export const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schemas }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Validate all schemas
  const validatedSchemas: ValidatedSchemaDisplay[] = useMemo(() => {
    return SchemaValidationService.validateSchemas(schemas).map((validated, index) => ({
      ...validated,
      originalIndex: index
    }));
  }, [schemas]);

  const activeSchema = validatedSchemas[activeTab];

  // When schemas update, reset to the first tab.
  useEffect(() => {
      setActiveTab(0);
  }, [schemas]);

  useEffect(() => {
    setCopySuccess(false);
  }, [activeTab]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleCopy = async () => {
    if (!activeSchema) return;
    
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(activeSchema.schema);
        setCopySuccess(true);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = activeSchema.schema;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopySuccess(true);
        } catch (fallbackError) {
          devError('Failed to copy text:', fallbackError);
          // Could show a toast notification here
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      devError('Failed to copy to clipboard:', error);
      // Could show a toast notification here
    }
  };

  const getValidationIcon = (validation: any) => {
    if (validation.isValid && validation.warnings.length === 0) {
      return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
    } else if (validation.isValid) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />;
    } else {
      return <XCircleIcon className="w-4 h-4 text-red-600" />;
    }
  };

  const getValidationColor = (validation: any) => {
    if (validation.isValid && validation.warnings.length === 0) {
      return 'border-green-200 bg-green-50';
    } else if (validation.isValid) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-red-200 bg-red-50';
    }
  };

  if (!activeSchema) return null;

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl mt-16 animate-fade-in flex flex-col overflow-hidden">
      {/* Modern Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-6 pt-4 overflow-x-auto">
        <div className="flex gap-2">
          {validatedSchemas.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-4 text-base font-semibold transition-all duration-300 focus:outline-none rounded-t-2xl flex items-center gap-3 whitespace-nowrap ${
                activeTab === index
                  ? 'text-slate-800 bg-white shadow-lg border-t-2 border-blue-500'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
              }`}
              aria-current={activeTab === index ? 'page' : undefined}
            >
              {getValidationIcon(item.validation)}
              <span>{item.type}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getValidationColor(item.validation)}`}>
                {item.validation.score}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow">
        {/* Header with Copy Button */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{activeSchema.type} Schema</h3>
            <p className="text-slate-600 mt-1">Copy this code to your website's HTML</p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-3 text-base font-semibold py-3 px-6 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 shadow-lg ${
              copySuccess 
                ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500/30' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white focus:ring-blue-500/30'
            }`}
          >
            {copySuccess ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
            {copySuccess ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        
        {/* Code Display */}
        <div className="relative">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 overflow-auto max-h-[60vh]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-400 text-sm ml-4 font-mono">JSON-LD Schema</span>
            </div>
            <pre className="text-sm leading-relaxed text-slate-100 font-mono">
              <SyntaxHighlightedCode code={activeSchema.schema} />
            </pre>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      <div className="border-t border-slate-200 p-6 bg-gradient-to-r from-slate-50 to-blue-50">
        <ValidationResults 
          validation={activeSchema.validation} 
          schemaType={activeSchema.type} 
        />
      </div>
    </div>
  );
};