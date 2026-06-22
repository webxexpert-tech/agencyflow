// lib/types/meetings.ts
// Complete TypeScript types for AI Meeting Summary Feature

/**
 * MEETING UPLOAD REQUEST
 * User uploads meeting recording or transcript
 */
export interface MeetingUploadRequest {
  organizationId: string;
  projectId: string;
  clientId?: string;
  title: string;
  description?: string;
  meetingDate: string;
  duration: number; // in minutes
  source: MeetingSource;
  attendees: string[]; // email addresses
  fileUrl?: string; // for uploaded files
  zoomMeetingId?: string; // for Zoom import
  recordingUrl?: string; // for recording import
  transcript?: string; // raw transcript text
}

export type MeetingSource = 'zoom' | 'google_meet' | 'upload' | 'manual' | 'teams' | 'slack';

/**
 * MEETING DATABASE RECORD
 */
export interface Meeting {
  id: string;
  organizationId: string;
  projectId: string;
  clientId?: string;
  title: string;
  description?: string;
  meetingDate: string;
  duration: number; // minutes
  source: MeetingSource;
  status: MeetingStatus;
  transcript: string;
  summary: MeetingSummary;
  participants: MeetingParticipant[];
  insights: MeetingInsights;
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  recordingUrl?: string;
  sharedWith?: string[]; // list of people it was shared with
  aiUsage: {
    tokensUsed: number;
    costUSD: number;
    model: string;
  };
}

export type MeetingStatus = 
  | 'uploading' 
  | 'processing' 
  | 'transcribing' 
  | 'analyzing' 
  | 'completed' 
  | 'failed';

/**
 * MEETING SUMMARY
 * AI-generated summary of the meeting
 */
export interface MeetingSummary {
  executiveSummary: string; // 2-3 sentence overview
  keyDecisions: string[]; // list of decisions made
  nextSteps: string[]; // upcoming actions
  risks: MeetingRisk[];
  followUps: FollowUp[];
  sentiment: SentimentAnalysis;
  topics: string[]; // main topics discussed
}

/**
 * ACTION ITEM
 * Tasks identified from meeting
 */
export interface ActionItem {
  id: string;
  description: string;
  assignee?: string; // email or name
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed';
  linkedTaskId?: string; // task management system ID
  relatedSectionInTranscript?: string; // timestamp or section
}

/**
 * MEETING RISK
 * Potential issues flagged by AI
 */
export interface MeetingRisk {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction?: string;
}

/**
 * FOLLOW UP
 * Scheduled follow-up meetings or communications
 */
export interface FollowUp {
  id: string;
  description: string;
  suggestedDate?: string;
  suggestedWith?: string[]; // attendee emails
  priority: 'low' | 'medium' | 'high';
}

/**
 * SENTIMENT ANALYSIS
 * Overall tone and sentiment of meeting
 */
export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number; // -1 to 1
  clientSentiment?: 'positive' | 'neutral' | 'negative';
  teamSentiment?: 'positive' | 'neutral' | 'negative';
  concernAreas?: string[]; // areas of concern detected
}

/**
 * MEETING PARTICIPANT
 * Attendee information
 */
export interface MeetingParticipant {
  id: string;
  name: string;
  email: string;
  role?: string;
  speakingTime?: number; // percentage
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * MEETING INSIGHTS
 * Additional analysis and insights
 */
export interface MeetingInsights {
  mainTopics: TopicAnalysis[];
  clientNeedsIdentified: string[];
  scopeChangesDetected?: ScopeChange[];
  opportunitiesIdentified?: string[];
  concernsRaised?: string[];
}

/**
 * TOPIC ANALYSIS
 * Breakdown of topics discussed
 */
export interface TopicAnalysis {
  topic: string;
  frequency: number; // how many times mentioned
  duration?: number; // minutes spent on topic
  sentiment?: string;
  importance?: number; // 1-10 scale
}

/**
 * SCOPE CHANGE
 * Potential scope expansion detected
 */
export interface ScopeChange {
  id: string;
  description: string;
  estimatedImpact?: string;
  timelineImpact?: string;
  costImpact?: string;
}

/**
 * MEETING PROCESSING JOB
 * Tracks async processing state
 */
export interface MeetingProcessingJob {
  id: string;
  meetingId: string;
  status: JobStatus;
  stage: ProcessingStage;
  progress: number; // 0-100
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
export type ProcessingStage = 
  | 'upload' 
  | 'transcription' 
  | 'analysis' 
  | 'insights' 
  | 'completion';

/**
 * MEETING HISTORY
 * Track changes to meeting
 */
export interface MeetingHistory {
  id: string;
  meetingId: string;
  action: string;
  changedBy: string;
  changedAt: string;
  previousValue?: any;
  newValue?: any;
}

/**
 * API RESPONSES
 */
export interface UploadMeetingResponse {
  success: boolean;
  meeting?: Meeting;
  jobId?: string;
  processingStatus?: string;
  error?: string;
  estimatedProcessingTime?: number; // seconds
}

export interface GetMeetingSummaryResponse {
  success: boolean;
  meeting?: Meeting;
  summary?: MeetingSummary;
  actionItems?: ActionItem[];
  error?: string;
}

export interface MeetingListResponse {
  success: boolean;
  meetings: Meeting[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * ZOOM INTEGRATION
 */
export interface ZoomMeetingData {
  meetingId: string;
  topic: string;
  startTime: string;
  duration: number;
  recordingUrl?: string;
  transcriptUrl?: string;
  participants: Array<{
    name: string;
    email: string;
  }>;
}

/**
 * TRANSCRIPTION RESULT
 */
export interface TranscriptionResult {
  success: boolean;
  text: string;
  duration: number;
  segments?: TranscriptionSegment[];
  language?: string;
  confidence?: number;
}

export interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
}

/**
 * MEETING SHARE LINK
 */
export interface MeetingShareLink {
  id: string;
  meetingId: string;
  token: string;
  sharedWith: string[]; // emails
  createdAt: string;
  expiresAt?: string;
  viewCount: number;
}

/**
 * MEETING TEMPLATE
 * Reusable meeting templates
 */
export interface MeetingTemplate {
  id: string;
  organizationId: string;
  name: string;
  defaultAttendees?: string[];
  suggestedTopics?: string[];
  expectedDuration?: number;
  followUpTemplate?: string;
}
