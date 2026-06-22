// components/scope-detector/scope-dashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ScopeChangeAlert, ScopeTracking } from '@/lib/types/scope';

interface ScopeDashboardProps {
  organizationId: string;
  projectId: string;
}

export function ScopeDashboard({ organizationId, projectId }: ScopeDashboardProps) {
  const [tracking, setTracking] = useState<ScopeTracking | null>(null);
  const [alerts, setAlerts] = useState<ScopeChangeAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScopeStatus();
  }, [projectId]);

  const fetchScopeStatus = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/scope-detector/${projectId}`);

      // Handle 404 as empty state (not an error)
      if (response.status === 404) {
        setTracking(null);
        setAlerts([]);
        return;
      }

      if (!response.ok) {
        // Silently handle errors without showing toast
        console.warn('Failed to fetch scope status:', response.statusText);
        setTracking(null);
        setAlerts([]);
        return;
      }

      const data = await response.json();
      setTracking(data.tracking || null);
      setAlerts(data.alerts || []);
    } catch (error) {
      // Silently handle network errors - show empty state instead
      console.warn('Fetch error:', error);
      setTracking(null);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const openAlerts = alerts.filter((a) => a.status === 'open').length;
  const totalRisk = alerts.reduce((sum, a) => sum + ((a as any).financial_impact_max || 0), 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Alerts */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2">Total Alerts</div>
          <div className="text-3xl font-bold">{alerts.length}</div>
          <div className="text-xs text-gray-500 mt-2">
            {openAlerts} open, {criticalAlerts} critical
          </div>
        </Card>

        {/* Financial Risk */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Financial Risk
          </div>
          <div className="text-3xl font-bold text-red-600">${totalRisk.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Potential impact</div>
        </Card>

        {/* Risk Level */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2">Risk Level</div>
          <Badge
            className={
              (tracking as any)?.risk_level === 'critical'
                ? 'bg-red-100 text-red-800'
                : (tracking as any)?.risk_level === 'high'
                ? 'bg-orange-100 text-orange-800'
                : (tracking as any)?.risk_level === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }
          >
            {(tracking as any)?.risk_level}
          </Badge>
        </Card>

        {/* Timeline Impact */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Timeline Impact
          </div>
          <div className="text-xl font-bold">{(tracking as any)?.total_timeline_impact || 'TBD'}</div>
          <div className="text-xs text-gray-500 mt-2">Cumulative delay</div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900">Critical Alerts</h3>
              <p className="text-sm text-red-800 mt-1">
                {criticalAlerts} critical scope changes detected. Immediate action recommended.
              </p>
              <Button className="mt-3" size="sm">
                Review & Create Change Orders
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts List */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Scope Change Alerts</h3>

          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{alert.description}</p>
                    <p className="text-sm text-gray-600 mt-1">{(alert as any).change_type}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">{alert.severity}</Badge>
                      <Badge variant="outline">{alert.status}</Badge>
                      {(alert as any).financial_impact_max && (
                        <span className="text-sm font-semibold text-red-600">
                          ${(alert as any).financial_impact_max}
                        </span>
                      )}
                    </div>

                    {(alert as any).evidence_quote && (
                      <p className="text-xs text-gray-600 italic mt-2 pl-3 border-l-2 border-gray-300">
                        "{(alert as any).evidence_quote}"
                      </p>
                    )}
                  </div>

                  <Button size="sm" variant="outline">
                    Change Order
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {alerts.length > 10 && (
            <p className="text-sm text-gray-600 text-center mt-4">
              +{alerts.length - 10} more alerts
            </p>
          )}
        </Card>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <p className="font-semibold mb-2">No scope changes detected</p>
            <p className="text-sm">Upload meeting transcripts or emails to detect scope creep</p>
          </div>
        </Card>
      )}

      {/* Refresh Button */}
      <Button onClick={fetchScopeStatus} variant="outline" className="w-full">
        Refresh Status
      </Button>
    </div>
  );
}
