export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface StatusHistory {
  id: number;
  from_status: string;
  to_status: string;
  changed_by_name: string;
  note: string;
  changed_at: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  source: "WALK_IN" | "REFERRAL" | "SOCIAL_MEDIA" | "WEBSITE" | "COLD_CALL" | "OTHER";
  intent: "RENT" | "BUY" | "BOTH";
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
  follow_up_date?: string;
  expected_laptops: number;
  budget?: number;
  notes?: string;
  tags: Tag[];
  activity_count?: number;
  pending_followups?: number;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  created_at: string;
  converted_customer?: number;
  converted_customer_detail?: any;
  activities?: Activity[];
  follow_ups?: FollowUp[];
  status_history?: StatusHistory[];
}

export interface Activity {
  id: number;
  lead?: number;
  customer?: number;
  activity_type: "CALL" | "EMAIL" | "VISIT" | "MEETING" | "NOTE" | "WHATSAPP";
  summary: string;
  description?: string;
  activity_date: string;
  created_by_name?: string;
  created_at: string;
}

export interface FollowUp {
  id: number;
  lead?: number;
  customer?: number;
  scheduled_at: string;
  status: "PENDING" | "DONE" | "CANCELLED";
  remarks?: string;
  created_at: string;
}

export interface PipelineStage {
  count: number;
  leads: Lead[];
}

export interface Pipeline {
  NEW: PipelineStage;
  CONTACTED: PipelineStage;
  QUALIFIED: PipelineStage;
  CONVERTED: PipelineStage;
  LOST: PipelineStage;
}

export interface UserStat {
  user_id: number | null;
  name: string;
  total: number;
}

export interface CRMDashboard {
  total_leads: number;
  by_status: Record<string, number>;
  today_followups: number;
  my_leads: number;
  is_admin?: boolean;
  recent_leads: Lead[];
  today_followup_leads: Lead[];
  /** Admin-only */
  user_stats?: UserStat[];
  unassigned_count?: number;
}

export interface AssignableUser {
  id: number;
  username: string;
  full_name: string;
}
