"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScopeDashboard } from "@/components/scope-detector/scope-dashboard";
import { ScopeAnalyzer } from "@/components/scope-detector/scope-analyzer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ScopeDetectorPage() {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // TODO: Get from auth/context
  const organizationId = "00000000-0000-0000-0000-000000000000";
  const projectId = "00000000-0000-0000-0000-000000000000";

  const handleAnalysisComplete = () => {
    setShowAnalyzer(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Scope Creep Detector
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered scope change detection and alerts
          </p>
        </div>
        <Button
          onClick={() => setShowAnalyzer(true)}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <AlertTriangle className="w-4 h-4" />
          Analyze Content
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</div>
          <div className="text-3xl font-bold mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Open</div>
          <div className="text-3xl font-bold text-red-600 mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Financial Impact</div>
          <div className="text-3xl font-bold mt-2">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Risk Level</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">--</div>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Scope Analysis</h2>
        <ScopeDashboard 
          key={refreshKey}
          organizationId={organizationId}
          projectId={projectId}
        />
      </Card>

      {/* Analyzer Dialog */}
      <Dialog open={showAnalyzer} onOpenChange={setShowAnalyzer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analyze Content for Scope Changes</DialogTitle>
          </DialogHeader>
          <ScopeAnalyzer 
            organizationId={organizationId}
            projectId={projectId}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
