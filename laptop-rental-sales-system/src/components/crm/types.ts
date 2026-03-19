export interface Tag {
  id: number;
  name: string;
  color: string;
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
  status: "NEW" | "CONTACTED" | "NEGOTIATION" | "CONVERTED" | "LOST";
  follow_up_date?: string;
  expected_laptops: number;
  budget?: number;
  notes?: string;
  tags: Tag[];
  activity_count?: number;
  pending_followups?: number;
  created_at: string;
  converted_customer?: number;
  converted_customer_detail?: any;
  activities?: Activity[];
  follow_ups?: FollowUp[];
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
  NEGOTIATION: PipelineStage;
  CONVERTED: PipelineStage;
  LOST: PipelineStage;
}
