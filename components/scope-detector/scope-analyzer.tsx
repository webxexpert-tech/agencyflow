// components/scope-detector/scope-analyzer.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AnalyzeScopeRequest, AnalyzeScopeResponse } from '@/lib/types/scope';

interface ScopeAnalyzerProps {
  organizationId: string;
  projectId: string;
  clientName?: string;
  onAnalysisComplete?: (result: AnalyzeScopeResponse) => void;
}

export function ScopeAnalyzer({
  organizationId,
  projectId,
  clientName,
  onAnalysisComplete,
}: ScopeAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'email' | 'note' | 'message'>('email');
  const [result, setResult] = useState<AnalyzeScopeResponse | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error('Please enter content to analyze');
      return;
    }

    setIsLoading(true);

    try {
      const analyzeData: AnalyzeScopeRequest = {
        organizationId,
        projectId,
        content,
        contentType,
        source: 'manual',
      };

      const response = await fetch('/api/v1/scope-detector/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyzeData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data: AnalyzeScopeResponse = await response.json();
      setResult(data);

      if (data.alerts && data.alerts.length > 0) {
        toast.success(`Found ${data.alerts.length} potential scope changes`);
      } else {
        toast.info('No obvious scope changes detected');
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Analyze for Scope Changes</h3>

        {/* Content Type Selector */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700">Content Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as any)}
            className="mt-2 w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="email">Email</option>
            <option value="message">Chat Message</option>
            <option value="note">Meeting Note</option>
          </select>
        </div>

        {/* Content Input */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700">
            Paste Content ({content.length} chars)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Paste the ${contentType} or communication you want to analyze for scope creep...`}
            className="mt-2 w-full h-40 p-3 border rounded-md font-mono text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            AI will analyze this text for scope expansion keywords and patterns.
            Look for phrases like "also", "while you're at it", "can you add", etc.
          </p>
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={isLoading || !content.trim()}
          className="w-full h-10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze for Scope Changes'
          )}
        </Button>
      </Card>

      {/* Results Card */}
      {result && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {result.alerts && result.alerts.length > 0 ? (
              <>
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">
                    {result.alerts.length} Scope Change{result.alerts.length !== 1 ? 's' : ''} Detected
                  </h3>
                  <p className="text-sm text-gray-600">Review each change and create change orders as needed</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">No Scope Changes Detected</h3>
                  <p className="text-sm text-gray-600">This communication doesn't appear to contain scope changes</p>
                </div>
              </>
            )}
          </div>

          {/* Detected Changes */}
          {result.alerts && result.alerts.length > 0 && (
            <div className="space-y-3 mt-4">
              {result.alerts.map((alert, idx) => (
                <div key={alert.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {idx + 1}. {alert.description}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Type: {(alert as any).change_type}</p>

                      {(alert as any).evidence_quote && (
                        <p className="text-xs text-gray-600 italic mt-2 pl-3 border-l-2 border-gray-300">
                          "{(alert as any).evidence_quote}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-sm">
                        {(alert as any).financial_impact_max && (
                          <span className="font-semibold text-red-600">
                            Impact: ${(alert as any).financial_impact_max}
                          </span>
                        )}
                        {(alert as any).timeline_impact && (
                          <span className="text-gray-600">Timeline: {(alert as any).timeline_impact}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setResult(null)}>
              Analyze Another
            </Button>
            <Button onClick={() => {
              toast.info('Create change orders from dashboard');
            }}>
              Create Change Orders
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
