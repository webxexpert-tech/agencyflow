'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProposalFormInput, ProposalContent, ValidationError } from '@/lib/types/proposals';

interface ProposalFormProps {
  onSuccess?: (proposalId: string, content: ProposalContent) => void;
}

export default function ProposalForm({ onSuccess }: ProposalFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProposalFormInput>({
    client_name: '',
    company_name: '',
    industry: '',
    service_type: '',
    project_description: '',
    goals: '',
    budget: 0,
    timeline: '',
    additional_notes: '',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Input Change
  // ═══════════════════════════════════════════════════════════════════════════

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'budget' ? (value ? parseFloat(value) : 0) : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Submit
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ submit: result.error || 'Failed to generate proposal' });
        toast.error(result.error || 'Failed to generate proposal');
        return;
      }

      toast.success('Proposal generated successfully!');
      
      // Reset form
      setFormData({
        client_name: '',
        company_name: '',
        industry: '',
        service_type: '',
        project_description: '',
        goals: '',
        budget: 0,
        timeline: '',
        additional_notes: '',
      });

      // Call success callback
      if (onSuccess && result.data) {
        onSuccess(result.data.proposal_id, result.data.proposal_content);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-md rounded-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-t-xl border-b border-indigo-100">
          <CardTitle className="text-2xl">Generate AI Proposal</CardTitle>
          <CardDescription className="text-base mt-1">
            Fill in the project details and our AI will generate a professional proposal in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{errors.submit}</p>
                </div>
              </motion.div>
            )}

            {/* Client Information */}
            <div>
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">
                    Client Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    placeholder="John Smith"
                    value={formData.client_name}
                    onChange={handleChange}
                    className={cn(errors.client_name && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.client_name && (
                    <p className="text-xs text-red-500">{errors.client_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    placeholder="Acme Inc"
                    value={formData.company_name}
                    onChange={handleChange}
                    className={cn(errors.company_name && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.company_name && (
                    <p className="text-xs text-red-500">{errors.company_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={cn(
                      'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      errors.industry && 'border-red-500'
                    )}
                    disabled={loading}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.industry && (
                    <p className="text-xs text-red-500">{errors.industry}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type">
                    Service Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="service_type"
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className={cn(
                      'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      errors.service_type && 'border-red-500'
                    )}
                    disabled={loading}
                  >
                    <option value="">Select Service Type</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Branding">Branding</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Custom Development">Custom Development</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.service_type && (
                    <p className="text-xs text-red-500">{errors.service_type}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Project Details */}
            <div>
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>Project Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project_description">
                    Project Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="project_description"
                    name="project_description"
                    placeholder="Describe the project in detail..."
                    value={formData.project_description}
                    onChange={handleChange}
                    rows={4}
                    className={cn(
                      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      errors.project_description && 'border-red-500'
                    )}
                    disabled={loading}
                  />
                  {errors.project_description && (
                    <p className="text-xs text-red-500">{errors.project_description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">
                    Project Goals <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="goals"
                    name="goals"
                    placeholder="What are the main goals..."
                    value={formData.goals}
                    onChange={handleChange}
                    rows={3}
                    className={cn(
                      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      errors.goals && 'border-red-500'
                    )}
                    disabled={loading}
                  />
                  {errors.goals && (
                    <p className="text-xs text-red-500">{errors.goals}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (Optional)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      placeholder="50000"
                      value={formData.budget || ''}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">
                      Timeline <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="timeline"
                      name="timeline"
                      placeholder="3-6 months"
                      value={formData.timeline}
                      onChange={handleChange}
                      disabled={loading}
                      className={cn(errors.timeline && 'border-red-500')}
                    />
                    {errors.timeline && (
                      <p className="text-xs text-red-500">{errors.timeline}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
                  <textarea
                    id="additional_notes"
                    name="additional_notes"
                    placeholder="Any additional information..."
                    value={formData.additional_notes}
                    onChange={handleChange}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Separator />
            <div className="flex justify-end gap-3">
              <Button variant="outline" disabled={loading} type="button" className="rounded-lg">
                Clear
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-2 py-2.5 px-6 rounded-lg shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Generate Proposal
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
