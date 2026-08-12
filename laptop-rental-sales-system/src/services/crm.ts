import api from "./axios";
import { CRMDashboard, AssignableUser } from "../components/crm/types";

export const crmApi = {
  /* Leads */
  getLeads: (params?: Record<string, string>) =>
    api.get("/crm/leads/", { params }).then(r => Array.isArray(r.data) ? r.data : r.data.results || []),

  getLead: (id: number) =>
    api.get(`/crm/leads/${id}/`).then(r => r.data),

  createLead: (data: any) =>
    api.post("/crm/leads/", data).then(r => r.data),

  updateLead: (id: number, data: any) =>
    api.patch(`/crm/leads/${id}/`, data).then(r => r.data),

  deleteLead: (id: number) =>
    api.delete(`/crm/leads/${id}/`),

  convertLead: (id: number) =>
    api.post(`/crm/leads/${id}/convert/`).then(r => r.data),

  getStatusHistory: (id: number) =>
    api.get(`/crm/leads/${id}/status-history/`).then(r => r.data),

  addTag: (leadId: number, tagId: number) =>
    api.post(`/crm/leads/${leadId}/add-tag/`, { tag_id: tagId }),

  removeTag: (leadId: number, tagId: number) =>
    api.post(`/crm/leads/${leadId}/remove-tag/`, { tag_id: tagId }),

  getPipeline: () =>
    api.get("/crm/leads/pipeline/").then(r => r.data),

  getTodayFollowups: () =>
    api.get("/crm/leads/today-followups/").then(r => r.data),

  /** Assign a single lead to a user (admin only) */
  assignLead: (leadId: number, userId: number | null) =>
    api.post(`/crm/leads/${leadId}/assign/`, { user_id: userId }).then(r => r.data),

  /** Bulk assign multiple leads to a user (admin only) */
  bulkAssignLeads: (leadIds: number[], userId: number | null) =>
    api.post("/crm/leads/bulk-assign/", { lead_ids: leadIds, user_id: userId }).then(r => r.data),

  /* Activities */
  getActivities: (params?: Record<string, string>) =>
    api.get("/crm/activities/", { params }).then(r => Array.isArray(r.data) ? r.data : r.data.results || []),

  createActivity: (data: any) =>
    api.post("/crm/activities/", data).then(r => r.data),

  /* Follow-ups */
  getFollowUps: (params?: Record<string, string>) =>
    api.get("/crm/followups/", { params }).then(r => Array.isArray(r.data) ? r.data : r.data.results || []),

  createFollowUp: (data: any) =>
    api.post("/crm/followups/", data).then(r => r.data),

  markFollowUpDone: (id: number, remarks?: string) =>
    api.post(`/crm/followups/${id}/mark-done/`, { remarks }).then(r => r.data),

  /* Tags */
  getTags: () =>
    api.get("/crm/tags/").then(r => Array.isArray(r.data) ? r.data : r.data.results || []),

  /* Dashboard */
  getDashboard: (): Promise<CRMDashboard> =>
    api.get("/crm/dashboard/").then(r => r.data),

  /* Users for assignment */
  getAssignableUsers: (): Promise<AssignableUser[]> =>
    api.get("/crm/users/").then(r => r.data),

  /* Current user profile */
  getMe: () =>
    api.get("/crm/me/").then(r => r.data),
};
