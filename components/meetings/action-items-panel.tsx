// components/meetings/action-items-panel.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionItem } from '@/lib/types/meetings';

interface ActionItemsPanelProps {
  meetingId: string;
  actionItems: ActionItem[];
  onRefresh?: () => void;
}

export function ActionItemsPanel({
  meetingId,
  actionItems,
  onRefresh,
}: ActionItemsPanelProps) {
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handleToggleComplete = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'open' : 'completed';

    setUpdatingIds([...updatingIds, itemId]);

    try {
      // TODO: Implement update endpoint
      // await fetch(`/api/v1/action-items/${itemId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus }),
      // });

      toast.success(
        `Action item marked as ${newStatus === 'completed' ? 'complete' : 'open'}`
      );

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error('Failed to update action item');
    } finally {
      setUpdatingIds(updatingIds.filter((id) => id !== itemId));
    }
  };

  if (actionItems.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Action Items</h3>
        <p className="text-gray-600 text-center py-8">
          No action items identified
        </p>
      </Card>
    );
  }

  const openItems = actionItems.filter((item) => item.status !== 'completed');
  const completedItems = actionItems.filter((item) => item.status === 'completed');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" />
        Action Items ({openItems.length} Open)
      </h3>

      {/* Open Items */}
      <div className="space-y-3 mb-6">
        {openItems.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <button
              onClick={() => handleToggleComplete(item.id, item.status)}
              disabled={updatingIds.includes(item.id)}
              className="flex-shrink-0 mt-1"
            >
              <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{item.description}</p>

              <div className="flex items-center gap-2 mt-2 text-sm">
                {item.assignee && (
                  <span className="text-gray-600">
                    Assigned to: <span className="font-semibold">{item.assignee}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={getPriorityColor(item.priority)}>
                  {item.priority}
                </Badge>

                {item.dueDate && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">
            Completed ({completedItems.length})
          </p>

          <div className="space-y-2 opacity-60">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-2 text-gray-600 line-through"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <Button variant="outline" className="w-full mt-6">
        Export Action Items
      </Button>
    </Card>
  );
}
