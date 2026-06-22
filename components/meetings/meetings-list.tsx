// components/meetings/meetings-list.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Meeting, MeetingListResponse } from '@/lib/types/meetings';

interface MeetingsListProps {
  organizationId: string;
  projectId?: string;
  onSelectMeeting?: (meeting: Meeting) => void;
}

export function MeetingsList({
  organizationId,
  projectId,
  onSelectMeeting,
}: MeetingsListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMeetings();
  }, [organizationId, projectId, page]);

  const fetchMeetings = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        pageSize: '10',
      });

      if (projectId) {
        params.append('projectId', projectId);
      }

      const response = await fetch(`/api/v1/meetings?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }

      const data: MeetingListResponse = await response.json();
      setMeetings(data.meetings);
      setTotal(data.total);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Analyzed</Badge>;
      case 'processing':
      case 'analyzing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading && meetings.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No meetings recorded yet</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Recent Meetings</h3>
        <span className="text-sm text-gray-600">{total} total</span>
      </div>

      <div className="space-y-3">
        {meetings.map((meeting) => (
          <Card
            key={meeting.id}
            className="p-4 hover:shadow-md transition cursor-pointer"
            onClick={() => onSelectMeeting?.(meeting)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{meeting.title}</h4>

                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date((meeting as any).meeting_date).toLocaleDateString()}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {meeting.duration} min
                  </span>

                  <Badge variant="outline" className="text-xs">
                    {meeting.source}
                  </Badge>
                </div>

                {meeting.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                    {meeting.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(meeting.status)}

                {meeting.summary && (
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {page} of {Math.ceil(total / 10)}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page * 10 >= total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
