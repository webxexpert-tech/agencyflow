'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save, X, Download, Send, Copy, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ProposalContent } from '@/lib/types/proposals';

interface ProposalViewerProps {
  proposal: {
    id: string;
    client_name: string;
    company_name: string;
    service_type?: string;
    proposal_content: ProposalContent;
    status: string;
    created_at: string;
  };
  onUpdate?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export default function ProposalViewer({
  proposal,
  onUpdate,
  onDelete,
  onExport,
}: ProposalViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(proposal.proposal_content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Save
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_content: editingContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Proposal updated successfully');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Delete
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Proposal deleted');
      onDelete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Duplicate
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDuplicate = async () => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...proposal,
          client_name: `${proposal.client_name} (Copy)`,
          proposal_content: editingContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate');

      toast.success('Proposal duplicated');
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Export PDF
  // ═══════════════════════════════════════════════════════════════════════════

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/export-pdf`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposal-${proposal.company_name}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Proposal exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Send Email
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSendEmail = async () => {
    if (!sendEmail.trim()) {
      toast.error('Please enter a client email address');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: sendEmail,
          subject: `Proposal for ${proposal.company_name}${proposal.service_type ? ' — ' + proposal.service_type : ''}`,
          message: sendMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      toast.success('Proposal sent successfully');
      setSendEmail('');
      setSendMessage('');
      setShowSendDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  const content = isEditing ? editingContent : proposal.proposal_content;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between p-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
        <div>
          <h1 className="text-3xl font-extrabold">{proposal.client_name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{proposal.company_name}</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant={proposal.status === 'draft' ? 'secondary' : 'default'}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(proposal.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="rounded-lg"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-2 rounded-lg shadow-md"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="gap-2 rounded-lg"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="gap-2 rounded-lg"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export PDF
              </Button>
              <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Send Proposal</DialogTitle>
                    <DialogDescription>
                      Send this proposal to the client via email
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Client Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="client@company.com"
                        value={sendEmail}
                        onChange={(e) => setSendEmail(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <textarea
                        id="message"
                        placeholder="Add a personal message to the proposal..."
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-2 rounded-lg shadow-md"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Proposal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2 rounded-lg text-red-600 hover:text-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      <div className="grid gap-6">
        {/* Executive Summary */}
        <Card className="border-0 shadow-sm rounded-lg">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={content.executiveSummary}
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    executiveSummary: e.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm leading-relaxed">{content.executiveSummary}</p>
            )}
          </CardContent>
        </Card>

        {/* Overview */}
        <Card className="border-0 shadow-sm rounded-lg">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={content.overview}
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    overview: e.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm leading-relaxed">{content.overview}</p>
            )}
          </CardContent>
        </Card>

        {/* Scope */}
        <Card className="border-0 shadow-sm rounded-lg">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Scope of Work</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={content.scope}
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    scope: e.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm leading-relaxed">{content.scope}</p>
            )}
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card className="border-0 shadow-sm rounded-lg">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.deliverables.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {idx + 1}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newDeliverables = [...content.deliverables];
                        newDeliverables[idx] = e.target.value;
                        setEditingContent((prev) => ({
                          ...prev,
                          deliverables: newDeliverables,
                        }));
                      }}
                      className="flex-1 rounded-md border border-input p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="text-sm leading-relaxed">{item}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="border-0 shadow-sm rounded-lg">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Pricing & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Breakdown</h4>
              {isEditing ? (
                <textarea
                  value={content.pricing.breakdown}
                  onChange={(e) =>
                    setEditingContent((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, breakdown: e.target.value },
                    }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm leading-relaxed">{content.pricing.breakdown}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {content.pricing.currency} {content.pricing.total.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Payment Terms</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={content.paymentTerms}
                    onChange={(e) =>
                      setEditingContent((prev) => ({
                        ...prev,
                        paymentTerms: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-input p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-medium">{content.paymentTerms}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline & Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <textarea
                value={content.timeline}
                onChange={(e) =>
                  setEditingContent((prev) => ({
                    ...prev,
                    timeline: e.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm leading-relaxed">{content.timeline}</p>
            )}

            <div className="mt-4">
              <h4 className="font-medium text-sm mb-3">Key Milestones</h4>
              <div className="space-y-2">
                {content.milestones.map((milestone, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{milestone.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      </div>
                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                        {milestone.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assumptions & Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assumptions & Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Assumptions</h4>
              {isEditing ? (
                <textarea
                  value={content.assumptions}
                  onChange={(e) =>
                    setEditingContent((prev) => ({
                      ...prev,
                      assumptions: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm leading-relaxed">{content.assumptions}</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Next Steps</h4>
              {isEditing ? (
                <textarea
                  value={content.nextSteps}
                  onChange={(e) =>
                    setEditingContent((prev) => ({
                      ...prev,
                      nextSteps: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm leading-relaxed">{content.nextSteps}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
