"use client";

import { useState } from "react";
import { Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeetingsList } from "@/components/meetings/meetings-list";
import { MeetingUpload } from "@/components/meetings/meeting-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MeetingsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // TODO: Get from auth/context
  const organizationId = "00000000-0000-0000-0000-000000000000";
  const projectId = "00000000-0000-0000-0000-000000000000";

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meetings & Summaries
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload meetings, get AI summaries, and track action items
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Meetings</div>
          <div className="text-3xl font-bold mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Analyzed</div>
          <div className="text-3xl font-bold mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Action Items</div>
          <div className="text-3xl font-bold mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">AI Tokens Used</div>
          <div className="text-3xl font-bold mt-2">--</div>
        </Card>
      </div>

      {/* Meetings List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Meetings</h2>
        <MeetingsList 
          key={refreshKey} 
          organizationId={organizationId}
          projectId={projectId}
        />
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Meeting</DialogTitle>
          </DialogHeader>
          <MeetingUpload 
            organizationId={organizationId}
            projectId={projectId}
            onUploadSuccess={handleUploadSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
