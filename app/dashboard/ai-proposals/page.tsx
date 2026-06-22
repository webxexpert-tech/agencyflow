'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProposalForm from '@/components/proposals/proposal-form';
import ProposalViewer from '@/components/proposals/proposal-viewer';
import { Proposal, ProposalContent } from '@/lib/types/proposals';
import { generateProposalPDF } from '@/lib/utils/pdf-export';

type ViewMode = 'list' | 'form' | 'view';

export default function AIProposalGeneratorPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // Load Proposals
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals');
      const result = await response.json();

      if (result.success) {
        setProposals(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load proposals');
      }
    } catch (error) {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Form Success
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFormSuccess = async (proposalId: string, _content: ProposalContent) => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals');
      const result = await response.json();

      if (result.success) {
        const updated = result.data || [];
        setProposals(updated);
        const newProposal = updated.find((p: Proposal) => p.id === proposalId);
        if (newProposal) {
          setSelectedProposal(newProposal);
          setViewMode('view');
        }
      }
    } catch {
      toast.error('Proposal saved, but failed to open it. Refresh the page.');
      loadProposals();
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Export PDF
  // ═══════════════════════════════════════════════════════════════════════════

  const handleExportPDF = async () => {
    if (!selectedProposal) return;

    try {
      await generateProposalPDF({
        client_name: selectedProposal.client_name,
        company_name: selectedProposal.company_name,
        proposal_content: selectedProposal.proposal_content,
        created_at: selectedProposal.created_at,
      });
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Delete
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDelete = () => {
    loadProposals();
    setViewMode('list');
    setSelectedProposal(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // List View
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewMode === 'list') {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900">AI Proposal Generator</h1>
              <p className="text-gray-600 text-lg mt-3 max-w-3xl leading-relaxed">
                Generate professional client proposals in seconds using AI — tailored
                scopes, clear pricing, and exportable PDFs.
              </p>
            </div>

            <div className="hidden lg:flex items-center flex-shrink-0">
              <Button
                onClick={() => setViewMode('form')}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-2 py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <FileText className="h-5 w-5" />
                Create New Proposal
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Proposals List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          {loading ? (
            <div className="flex items-center justify-center p-12 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-700 font-medium">Loading proposals...</span>
            </div>
          ) : proposals.length === 0 ? (
            <Card className="p-16 text-center rounded-xl border-0 shadow-md bg-gradient-to-br from-indigo-50 via-white to-violet-50">
              <FileText className="h-16 w-16 text-indigo-400 mx-auto mb-6 opacity-80" />
              <h3 className="text-3xl font-bold text-gray-900">No proposals yet</h3>
              <p className="text-gray-600 text-base mt-3 max-w-2xl mx-auto leading-relaxed">
                Create your first proposal to get started. Use AI to draft scope, pricing,
                and timelines — then export a client-ready PDF in seconds.
              </p>
              <div className="mt-10">
                <Button
                  onClick={() => setViewMode('form')}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Create Proposal
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {proposals.map((proposal) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedProposal(proposal);
                    setViewMode('view');
                  }}
                >
                  <Card className="p-5 hover:shadow-2xl transition-all cursor-pointer rounded-xl border-0 shadow-md hover:scale-[1.02] bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{proposal.client_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {proposal.company_name} • {proposal.service_type}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <Badge
                            variant={proposal.status === 'draft' ? 'secondary' : 'default'}
                            className={proposal.status === 'draft' ? 'bg-amber-100 text-amber-800 border-0' : 'bg-green-100 text-green-800 border-0'}
                          >
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            {new Date(proposal.created_at).toLocaleDateString()}
                          </span>
                          {proposal.proposal_content.pricing.total > 0 && (
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                              ${proposal.proposal_content.pricing.total.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-indigo-600 font-bold mt-1" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Form View
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewMode === 'form') {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            variant="outline"
            onClick={() => setViewMode('list')}
            className="mb-4"
          >
            ← Back to Proposals
          </Button>

          <ProposalForm onSuccess={handleFormSuccess} />
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // View/Edit Mode
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewMode === 'view' && selectedProposal) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="outline"
            onClick={() => setViewMode('list')}
            className="mb-4"
          >
            ← Back to Proposals
          </Button>

          <ProposalViewer
            proposal={selectedProposal}
            onUpdate={loadProposals}
            onDelete={handleDelete}
            onExport={handleExportPDF}
          />
        </motion.div>
      </div>
    );
  }

  return null;
}
