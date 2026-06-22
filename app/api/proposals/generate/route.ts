/**
 * API Route: Generate AI Proposal using Gemini
 * POST /api/proposals/generate
 *
 * Security:
 * - API key stored server-side
 * - Rate limiting per user
 * - Input validation
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProposalContent, GenerateProposalRequest } from '@/lib/types/proposals';

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limiting (simple in-memory, use Redis in production)
// ═══════════════════════════════════════════════════════════════════════════

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // per hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

function validateInput(data: GenerateProposalRequest): { valid: boolean; error?: string } {
  if (!data.client_name?.trim()) return { valid: false, error: 'Client name is required' };
  if (!data.company_name?.trim()) return { valid: false, error: 'Company name is required' };
  if (!data.industry?.trim()) return { valid: false, error: 'Industry is required' };
  if (!data.service_type?.trim()) return { valid: false, error: 'Service type is required' };
  if (!data.project_description?.trim()) return { valid: false, error: 'Project description is required' };
  if (!data.goals?.trim()) return { valid: false, error: 'Goals are required' };
  if (!data.timeline?.trim()) return { valid: false, error: 'Timeline is required' };

  if (data.client_name.length > 100) return { valid: false, error: 'Client name too long' };
  if (data.project_description.length > 5000) return { valid: false, error: 'Description too long' };

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Prompt Engineering
// ═══════════════════════════════════════════════════════════════════════════

function buildPrompt(input: GenerateProposalRequest): string {
  const today = '2026-06-08';
  
  return `You are a senior agency consultant with 15+ years of experience writing winning proposals that close deals.

CRITICAL REQUIREMENTS:
- All dates MUST be 2026-06-08 or later. Today is 2026-06-08.
- Write ONLY plain text. NO markdown symbols like **, *, #, or bullet points.
- Every section must be specific to ${input.company_name} in ${input.industry}.
- NO generic filler. Every line must reference their actual goals and industry.
- Proposals are read by decision-makers who can immediately tell if content is AI-generated.
- Budget must be realistic. Milestone dates must be logically spaced.

CLIENT PROFILE:
Company: ${input.company_name}
Industry: ${input.industry}
Contact: ${input.client_name}
Challenge: ${input.project_description}
Goals: ${input.goals}
Service Type: ${input.service_type}
Timeline: ${input.timeline}
Budget: ${input.budget ? '$' + input.budget : 'Flexible'}
${input.additional_notes ? 'Additional Context: ' + input.additional_notes : ''}

YOUR TASK:
Write an executive-level proposal that feels custom-built for ${input.company_name}. Each paragraph must reference their industry, goals, or service type. Avoid generic language like "leveraging best practices" or "synergize." Use specific, direct language.

TIMELINE: Start planning from today (2026-06-08). Space milestones realistically across the full project duration per the timeline "${input.timeline}".

SCOPE WRITING: Write scope as flowing paragraphs describing the work. NO bullet points. NO markdown. Direct narrative prose.

PRICING: Calculate realistic fees based on scope, timeline, and industry. Provide a fair total that reflects the service level and duration.

Return ONLY valid JSON (no markdown, no extra text):
{
  "executiveSummary": "Three compelling paragraphs specific to ${input.company_name}'s industry and goals. No generic phrases.",
  "overview": "Two to three paragraphs detailing exactly what will be done for ${input.company_name} in the ${input.industry} space.",
  "scope": "Flowing paragraphs describing the work in detail. No bullet points. No markdown. Direct narrative.",
  "deliverables": ["Specific deliverable 1 for ${input.company_name}", "Specific deliverable 2", "Continue with 8-10 specific items"],
  "timeline": "Narrative description of the full project timeline from 2026-06-08 through project completion per ${input.timeline}.",
  "milestones": [
    {
      "name": "Milestone name",
      "description": "Exactly what gets delivered or completed",
      "dueDate": "YYYY-MM-DD starting from 2026-06-08 or later"
    }
  ],
  "pricing": {
    "breakdown": "Detailed narrative of costs per phase. No bullet points. No markdown. Realistic fees for ${input.service_type}.",
    "total": realistic number for this scope and timeline,
    "currency": "USD"
  },
  "paymentTerms": "Specific payment schedule as clean narrative text. Example: 30% deposit on contract signing, 40% at project midpoint, 30% on final delivery.",
  "assumptions": "Realistic project assumptions specific to ${input.industry}. Plain text narrative. No markdown.",
  "nextSteps": "Three to four specific action items for ${input.company_name} to move forward. Plain text."
}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Parse AI Response
// ═══════════════════════════════════════════════════════════════════════════

function parseAIResponse(text: string): ProposalContent {
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      executiveSummary: parsed.executiveSummary || '',
      overview: parsed.overview || '',
      scope: parsed.scope || '',
      deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
      timeline: parsed.timeline || '',
      milestones: Array.isArray(parsed.milestones)
        ? parsed.milestones.map((m: any) => ({
            name: m.name || '',
            description: m.description || '',
            dueDate: m.dueDate || '',
          }))
        : [],
      pricing: {
        breakdown: parsed.pricing?.breakdown || '',
        total: parsed.pricing?.total || 0,
        currency: parsed.pricing?.currency || 'USD',
      },
      paymentTerms: parsed.paymentTerms || '',
      assumptions: parsed.assumptions || '',
      nextSteps: parsed.nextSteps || '',
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Max 10 proposals per hour.' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const input: GenerateProposalRequest = body;

    // Validate input
    const validation = validateInput(input);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Initialize Gemini (API key from server-side env)
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Generate proposal
    const prompt = buildPrompt(input);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse AI response
    const proposalContent = parseAIResponse(aiResponse);

    // Save to database
    const { data: proposal, error: saveError } = await supabase
      .from('proposals')
      .insert({
        user_id: user.id,
        client_name: input.client_name,
        company_name: input.company_name,
        industry: input.industry,
        service_type: input.service_type,
        project_description: input.project_description,
        goals: input.goals,
        budget: input.budget || null,
        timeline: input.timeline,
        additional_notes: input.additional_notes || null,
        proposal_content: proposalContent,
        status: 'draft',
      })
      .select()
      .single();

    if (saveError || !proposal) {
      console.error('Error saving proposal:', saveError);
      return NextResponse.json(
        { success: false, error: 'Failed to save proposal' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('proposal_history').insert({
      proposal_id: proposal.id,
      action: 'created',
      details: { generated_by_ai: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        proposal_id: proposal.id,
        proposal_content: proposalContent,
      },
    });
  } catch (error) {
    console.error('Error in proposal generation:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
