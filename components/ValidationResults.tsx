import React, { useState } from 'react';
import { ValidationResult, ValidationError } from '../services/schemaValidationService';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from './Icons';

interface ValidationResultsProps {
  validation: ValidationResult;
  schemaType: string;
}


const ValidationErrorItem: React.FC<{ error: ValidationError; index: number }> = ({ error, index }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (error.type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTextColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className={`border rounded-xl p-4 shadow-sm ${getBorderColor()}`}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-semibold ${getTextColor()}`}>
            {error.message}
          </p>
          {error.path && (
            <p className="text-sm text-slate-600 mt-2 font-mono bg-slate-100 px-2 py-1 rounded">
              Path: {error.path}
            </p>
          )}
          {error.suggestion && (
            <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">
                <strong className="text-slate-800">💡 Suggestion:</strong> {error.suggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ValidationSection: React.FC<{ 
  title: string; 
  errors: ValidationError[]; 
  icon: React.ReactNode; 
  color: string;
  defaultExpanded?: boolean;
}> = ({ title, errors, icon, color, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (errors.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={`font-bold text-lg ${color}`}>
            {title} ({errors.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-slate-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-white/20 p-4 space-y-3 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
          {errors.map((error, index) => (
            <ValidationErrorItem key={index} error={error} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ValidationResults: React.FC<ValidationResultsProps> = ({ validation, schemaType }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = () => {
    if (validation.isValid && validation.warnings.length === 0) {
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    } else if (validation.isValid) {
      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
    } else {
      return <XCircleIcon className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = () => {
    if (validation.isValid && validation.warnings.length === 0) {
      return 'Valid';
    } else if (validation.isValid) {
      return 'Valid with warnings';
    } else {
      return 'Invalid';
    }
  };

  const getStatusColor = () => {
    if (validation.isValid && validation.warnings.length === 0) {
      return 'text-green-600';
    } else if (validation.isValid) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  const getScoreColor = () => {
    if (validation.score >= 90) return 'text-green-600';
    if (validation.score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (validation.score >= 90) return 'bg-green-100';
    if (validation.score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-6 shadow-lg">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-800">Validation Results</h3>
            <p className={`text-base font-semibold ${getStatusColor()}`}>
              {getStatusText()} • {schemaType} Schema
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Score Badge */}
          <div className={`px-4 py-2 rounded-full shadow-lg ${getScoreBgColor()}`}>
            <span className={`text-lg font-bold ${getScoreColor()}`}>
              {validation.score}/100
            </span>
          </div>
          
          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-base text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-2 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-full border border-slate-200 transition-all"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
            {showDetails ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {validation.errors.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <XCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-red-800">{validation.errors.length}</p>
                <p className="text-sm text-red-600">Error{validation.errors.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}
        
        {validation.warnings.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-yellow-800">{validation.warnings.length}</p>
                <p className="text-sm text-yellow-600">Warning{validation.warnings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}
        
        {validation.info.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <InformationCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-blue-800">{validation.info.length}</p>
                <p className="text-sm text-blue-600">Suggestion{validation.info.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}
        
        {(validation.errors.length === 0 && validation.warnings.length === 0 && validation.info.length === 0) && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 col-span-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-800">Perfect!</p>
                <p className="text-sm text-green-600">No issues found in your schema</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Results */}
      {showDetails && (
        <div className="space-y-4">
          <ValidationSection
            title="Errors"
            errors={validation.errors}
            icon={<XCircleIcon className="w-5 h-5 text-red-500" />}
            color="text-red-600"
            defaultExpanded={validation.errors.length > 0}
          />
          
          <ValidationSection
            title="Warnings"
            errors={validation.warnings}
            icon={<ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />}
            color="text-yellow-600"
            defaultExpanded={validation.warnings.length > 0 && validation.errors.length === 0}
          />
          
          <ValidationSection
            title="Suggestions"
            errors={validation.info}
            icon={<InformationCircleIcon className="w-5 h-5 text-blue-500" />}
            color="text-blue-600"
            defaultExpanded={validation.info.length > 0 && validation.errors.length === 0 && validation.warnings.length === 0}
          />
        </div>
      )}
    </div>
  );
};
