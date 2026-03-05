import React from 'react';
import { ExternalLink, Clock, BookOpen } from 'lucide-react';
import { Suggestion } from '../types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  complexity: 'simple' | 'moderate' | 'complex';
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, complexity }) => {
  const complexityStyles = {
    simple: 'bg-slate-700/30 border-slate-600/40',
    moderate: 'bg-slate-700/30 border-slate-600/40',
    complex: 'bg-slate-700/30 border-slate-600/40'
  };

  const complexityLabels = {
    simple: { icon: '⚡', label: 'Quick Start', color: 'text-slate-300' },
    moderate: { icon: '🔍', label: 'Deep Dive', color: 'text-slate-300' },
    complex: { icon: '🚀', label: 'Major Project', color: 'text-slate-300' }
  };

  return (
    <div className={`luxury-card p-6 rounded-2xl border transition-all duration-300 group ${complexityStyles[complexity]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-base font-semibold text-slate-100 group-hover:text-slate-50 flex-1 pr-3">
          {suggestion.title}
        </h4>
        <div className={`
          px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 flex-shrink-0
          bg-slate-700/50 border border-slate-600/40 ${complexityLabels[complexity].color}
        `}>
          <span>{complexityLabels[complexity].icon}</span>
          <span>{complexityLabels[complexity].label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-300 mb-4 leading-relaxed group-hover:text-slate-200 text-sm">
        {suggestion.description}
      </p>

      {/* Time Estimate */}
      <div className="flex items-center space-x-2 mb-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
        <Clock size={16} className="text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">
          Estimated time: {suggestion.timeEstimate}
        </span>
      </div>

      {/* References */}
      {suggestion.references.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resources
            </span>
          </div>
          <div className="space-y-2">
            {suggestion.references.map((ref, index) => (
              <a
                key={index}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-200 transition-colors duration-200 p-3 bg-slate-800/40 rounded-lg hover:border-slate-500/40 border border-slate-700/30"
              >
                <ExternalLink size={14} />
                <span className="truncate font-medium">{ref}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionCard;