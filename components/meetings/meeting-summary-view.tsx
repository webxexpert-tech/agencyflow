// components/meetings/meeting-summary-view.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { Meeting, MeetingSummary } from '@/lib/types/meetings';

interface MeetingSummaryViewProps {
  meeting: Meeting;
  onActionItemsCreated?: () => void;
}

export function MeetingSummaryView({
  meeting,
  onActionItemsCreated,
}: MeetingSummaryViewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(meeting.summary || null);

  useEffect(() => {
    // If meeting is in processing state, poll for completion
    if (meeting.status === 'processing' || meeting.status === 'analyzing') {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/v1/meetings/${meeting.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.meeting?.status === 'completed') {
            setSummary(data.meeting.summary);
            clearInterval(interval);
            toast.success('Meeting analysis complete!');
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [meeting.id, meeting.status]);

  const handleAnalyze = async () => {
    if (!meeting.transcript) {
      toast.error('No transcript available to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch(`/api/v1/meetings/${meeting.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setSummary(result.summary);
      toast.success('Analysis complete!');

      if (onActionItemsCreated) {
        onActionItemsCreated();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze meeting');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!summary) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Meeting Summary</h2>
          <Badge variant="outline">{meeting.status}</Badge>
        </div>

        <div className="text-center py-12">
          {isAnalyzing ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Analyzing meeting...</p>
              <p className="text-sm text-gray-500 mt-2">
                This usually takes about 30 seconds
              </p>
            </>
          ) : (
            <>
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No analysis available yet</p>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                Analyze Meeting
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Executive Summary</h3>
        <p className="text-gray-700 leading-relaxed">
          {summary.executiveSummary}
        </p>
      </Card>

      {/* Key Decisions */}
      {summary.keyDecisions && summary.keyDecisions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Key Decisions
          </h3>
          <ul className="space-y-2">
            {summary.keyDecisions.map((decision, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span className="text-gray-700">{decision}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Next Steps */}
      {summary.nextSteps && summary.nextSteps.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Next Steps</h3>
          <ul className="space-y-2">
            {summary.nextSteps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Risks */}
      {summary.risks && summary.risks.length > 0 && (
        <Card className="p-6 border-amber-200 bg-amber-50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Identified Risks
          </h3>
          <ul className="space-y-3">
            {summary.risks.map((risk, idx) => (
              <li key={idx} className="flex gap-3">
                <Badge variant="outline" className="mt-1">
                  {risk.severity}
                </Badge>
                <span className="text-gray-700">{risk.description}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Topics Discussed */}
      {summary.topics && summary.topics.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Topics Discussed</h3>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((topic, idx) => (
              <Badge key={idx} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Sentiment */}
      {summary.sentiment && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Meeting Sentiment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Overall</span>
              <Badge
                variant={
                  summary.sentiment.overall === 'positive' ? 'default' : 'outline'
                }
              >
                {summary.sentiment.overall}
              </Badge>
            </div>
            {summary.sentiment.clientSentiment && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Client Sentiment</span>
                <Badge variant="outline">
                  {summary.sentiment.clientSentiment}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
