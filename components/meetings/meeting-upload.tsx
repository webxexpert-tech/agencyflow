// components/meetings/meeting-upload.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { MeetingUploadRequest } from '@/lib/types/meetings';

interface MeetingUploadProps {
  organizationId: string;
  projectId: string;
  onUploadSuccess?: (meetingId: string) => void;
}

export function MeetingUpload({
  organizationId,
  projectId,
  onUploadSuccess,
}: MeetingUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcript, setTranscript] = useState('');
  const [source, setSource] = useState<'zoom' | 'google_meet' | 'upload' | 'manual'>('manual');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('60');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Meeting title is required');
      return;
    }

    setIsLoading(true);

    try {
      const uploadData: MeetingUploadRequest = {
        organizationId,
        projectId,
        title,
        description,
        meetingDate,
        duration: parseInt(duration),
        source,
        transcript: transcript || undefined,
        attendees: [],
      };

      const response = await fetch('/api/v1/meetings/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sb-token')}`,
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      toast.success('Meeting uploaded! Processing has started.');

      // Reset form
      setTitle('');
      setDescription('');
      setTranscript('');
      setDuration('60');

      if (onUploadSuccess && result.meeting?.id) {
        onUploadSuccess(result.meeting.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload meeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Meeting</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-base font-semibold">
            Meeting Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Client Review Meeting"
            className="mt-2"
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-base font-semibold">
            Description
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional meeting notes"
            className="mt-2"
            disabled={isLoading}
          />
        </div>

        {/* Meeting Details Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date" className="text-base font-semibold">
              Meeting Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="mt-2"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="duration" className="text-base font-semibold">
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="mt-2"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Source */}
        <div>
          <Label htmlFor="source" className="text-base font-semibold">
            Meeting Source
          </Label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as any)}
            className="mt-2 w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="manual">Manual Entry</option>
            <option value="zoom">Zoom</option>
            <option value="google_meet">Google Meet</option>
            <option value="teams">Microsoft Teams</option>
          </select>
        </div>

        {/* Transcript */}
        <div>
          <Label htmlFor="transcript" className="text-base font-semibold">
            Transcript or Notes
          </Label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the meeting transcript or detailed notes here..."
            className="mt-2 w-full h-32 p-3 border rounded-md font-mono text-sm"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-600 mt-2">
            Leave empty to upload a recording file
          </p>
        </div>

        {/* Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Meetings are automatically analyzed to extract action items, key decisions, and risks.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !title}
          className="w-full h-10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Meeting
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
