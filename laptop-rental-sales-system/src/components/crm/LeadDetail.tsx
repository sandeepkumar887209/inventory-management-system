import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Mail, MapPin, Calendar, TrendingUp,
  Plus, CheckCircle, Clock, Activity as ActivityIcon,
  UserCheck, ChevronLeft, Edit2,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { Lead, Activity, FollowUp } from "./types";
import { ActivityForm } from "./ActivityForm";
import { FollowUpForm } from "./FollowUpForm";
import { LeadForm } from "./LeadForm";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  NEW: "info",
  CONTACTED: "warning",
  NEGOTIATION: "neutral",
  CONVERTED: "success",
  LOST: "danger",
};

const ACTIVITY_ICONS: Record<string, string> = {
  CALL: "📞",
  EMAIL: "📧",
  VISIT: "🚶",
  MEETING: "🤝",
  NOTE: "📝",
  WHATSAPP: "💬",
};

type ActiveTab = "activities" | "followups";
type ActiveModal = "activity" | "followup" | "edit" | null;

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("activities");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [leadRes, actRes, fuRes] = await Promise.all([
        api.get(`/crm/leads/${id}/`),
        api.get(`/crm/activities/?lead=${id}`),
        api.get(`/crm/followups/?lead=${id}`),
      ]);
      setLead(leadRes.data);
      setActivities(Array.isArray(actRes.data) ? actRes.data : actRes.data.results || []);
      setFollowUps(Array.isArray(fuRes.data) ? fuRes.data : fuRes.data.results || []);
    } catch {
      alert("Failed to load lead details.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!window.confirm("Convert this lead to a Customer? This cannot be undone.")) return;
    try {
      setConverting(true);
      await api.post(`/crm/leads/${id}/convert/`);
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to convert lead.");
    } finally {
      setConverting(false);
    }
  };

  const handleMarkDone = async (fuId: number) => {
    try {
      await api.post(`/crm/followups/${fuId}/mark-done/`);
      setFollowUps((prev) =>
        prev.map((f) => (f.id === fuId ? { ...f, status: "DONE" } : f))
      );
    } catch {
      alert("Failed to mark follow-up as done.");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) return <div className="p-6 text-neutral-600">Loading...</div>;
  if (!lead) return <div className="p-6 text-red-500">Lead not found.</div>;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate("/crm/leads")}>
          <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{lead.name}</h1>
          {lead.company && <p className="text-neutral-500">{lead.company}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[lead.status]}>{lead.status}</Badge>
            <Badge variant="neutral">{lead.intent}</Badge>
            {lead.tags?.map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 text-xs rounded-full text-white font-medium"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setActiveModal("edit")}>
            <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
          </Button>
          {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
            <Button onClick={handleConvert} disabled={converting}>
              <UserCheck className="w-4 h-4 mr-1 inline" />
              {converting ? "Converting..." : "Convert to Customer"}
            </Button>
          )}
          {lead.status === "CONVERTED" && lead.converted_customer_detail && (
            <Button variant="secondary" onClick={() => navigate(`/customers/${lead.converted_customer}`)}>
              View Customer →
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Contact */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
          <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wide">Contact Info</h3>
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <Phone className="w-4 h-4 text-neutral-400" /> {lead.phone}
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <Mail className="w-4 h-4 text-neutral-400" /> {lead.email}
            </div>
          )}
          {lead.address && (
            <div className="flex items-start gap-2 text-sm text-neutral-700">
              <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" /> {lead.address}
            </div>
          )}
        </div>

        {/* Lead Info */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
          <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wide">Lead Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-neutral-500">Source</span>
            <span className="text-neutral-800 font-medium">{lead.source.replace("_", " ")}</span>
            <span className="text-neutral-500">Expected Laptops</span>
            <span className="text-neutral-800 font-medium">{lead.expected_laptops}</span>
            {lead.budget && (
              <>
                <span className="text-neutral-500">Budget</span>
                <span className="text-neutral-800 font-medium">₹{Number(lead.budget).toLocaleString("en-IN")}</span>
              </>
            )}
            <span className="text-neutral-500">Created</span>
            <span className="text-neutral-800 font-medium">{formatDate(lead.created_at)}</span>
          </div>
        </div>

        {/* Follow-up */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
          <h3 className="font-semibold text-neutral-800 text-sm uppercase tracking-wide">Follow-up</h3>
          {lead.follow_up_date ? (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-neutral-800 font-medium">{formatDate(lead.follow_up_date)}</span>
            </div>
          ) : (
            <p className="text-neutral-400 text-sm">No follow-up scheduled</p>
          )}
          <div className="text-sm text-neutral-600">
            {followUps.filter((f) => f.status === "PENDING").length} pending reminder(s)
          </div>
          {lead.notes && (
            <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-700 mt-2">
              {lead.notes}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Activities & Follow-ups */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "activities"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
            onClick={() => setActiveTab("activities")}
          >
            <ActivityIcon className="w-4 h-4 inline mr-1" />
            Activities ({activities.length})
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "followups"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
            onClick={() => setActiveTab("followups")}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Follow-ups ({followUps.length})
          </button>

          <div className="ml-auto px-4 py-2">
            {activeTab === "activities" ? (
              <Button size="sm" onClick={() => setActiveModal("activity")}>
                <Plus className="w-3.5 h-3.5 mr-1 inline" /> Log Activity
              </Button>
            ) : (
              <Button size="sm" onClick={() => setActiveModal("followup")}>
                <Plus className="w-3.5 h-3.5 mr-1 inline" /> Schedule Follow-up
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3 min-h-32">
          {/* Activities */}
          {activeTab === "activities" && (
            activities.length === 0 ? (
              <p className="text-center text-neutral-400 py-8">No activities logged yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                  <div className="text-2xl">{ACTIVITY_ICONS[act.activity_type]}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-neutral-800">{act.summary}</span>
                      <span className="text-xs text-neutral-400">{formatDateTime(act.activity_date)}</span>
                    </div>
                    {act.description && (
                      <p className="text-sm text-neutral-500 mt-1">{act.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="neutral" size="sm">{act.activity_type}</Badge>
                      {act.created_by_name && (
                        <span className="text-xs text-neutral-400">by {act.created_by_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {/* Follow-ups */}
          {activeTab === "followups" && (
            followUps.length === 0 ? (
              <p className="text-center text-neutral-400 py-8">No follow-ups scheduled yet.</p>
            ) : (
              followUps.map((fu) => (
                <div
                  key={fu.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    fu.status === "DONE"
                      ? "bg-green-50 border-green-100"
                      : fu.status === "CANCELLED"
                      ? "bg-neutral-50 border-neutral-100 opacity-60"
                      : "bg-orange-50 border-orange-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-800">
                        {formatDateTime(fu.scheduled_at)}
                      </span>
                      <Badge
                        variant={fu.status === "DONE" ? "success" : fu.status === "CANCELLED" ? "neutral" : "warning"}
                        size="sm"
                      >
                        {fu.status}
                      </Badge>
                    </div>
                    {fu.remarks && (
                      <p className="text-sm text-neutral-500 mt-1 ml-6">{fu.remarks}</p>
                    )}
                  </div>
                  {fu.status === "PENDING" && (
                    <Button size="sm" variant="secondary" onClick={() => handleMarkDone(fu.id)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1 inline" /> Mark Done
                    </Button>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === "activity" && (
        <ModalWrapper title="Log Activity" onClose={() => setActiveModal(null)}>
          <ActivityForm
            leadId={Number(id)}
            onSuccess={() => { setActiveModal(null); fetchAll(); }}
            onCancel={() => setActiveModal(null)}
          />
        </ModalWrapper>
      )}

      {activeModal === "followup" && (
        <ModalWrapper title="Schedule Follow-up" onClose={() => setActiveModal(null)}>
          <FollowUpForm
            leadId={Number(id)}
            onSuccess={() => { setActiveModal(null); fetchAll(); }}
            onCancel={() => setActiveModal(null)}
          />
        </ModalWrapper>
      )}

      {activeModal === "edit" && (
        <ModalWrapper title="Edit Lead" onClose={() => setActiveModal(null)}>
          <LeadForm
            lead={lead}
            onSuccess={() => { setActiveModal(null); fetchAll(); }}
            onCancel={() => setActiveModal(null)}
          />
        </ModalWrapper>
      )}
    </div>
  );
}

// Inline modal wrapper (reuses your project's existing modal pattern)
function ModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
