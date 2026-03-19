import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { Pipeline, Lead } from "./types";

const STAGES = [
  { key: "NEW", label: "New", color: "bg-blue-500", light: "bg-blue-50 border-blue-200" },
  { key: "CONTACTED", label: "Contacted", color: "bg-yellow-500", light: "bg-yellow-50 border-yellow-200" },
  { key: "NEGOTIATION", label: "Negotiation", color: "bg-purple-500", light: "bg-purple-50 border-purple-200" },
  { key: "CONVERTED", label: "Converted", color: "bg-green-500", light: "bg-green-50 border-green-200" },
  { key: "LOST", label: "Lost", color: "bg-red-400", light: "bg-red-50 border-red-200" },
] as const;

export function LeadPipeline() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.get("/crm/leads/pipeline/");
      setPipeline(res.data);
    } catch {
      alert("Failed to load pipeline.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;

  if (loading) return <div className="p-6 text-neutral-600">Loading pipeline...</div>;
  if (!pipeline) return null;

  const totalLeads = STAGES.reduce((sum, s) => sum + (pipeline[s.key]?.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lead Pipeline</h1>
          <p className="text-neutral-600">{totalLeads} total leads across all stages</p>
        </div>
        <Button variant="secondary" onClick={fetchPipeline}>
          <RefreshCw className="w-4 h-4 mr-1 inline" /> Refresh
        </Button>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageData = pipeline[stage.key];
          return (
            <div key={stage.key} className="space-y-3">
              {/* Column Header */}
              <div className={`rounded-xl border p-3 ${stage.light}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <span className="font-semibold text-sm text-neutral-800">{stage.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${stage.color}`}>
                    {stageData.count}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {stageData.leads.map((lead: Lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    className="bg-white rounded-xl border border-neutral-200 p-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="font-medium text-sm text-neutral-900 truncate">{lead.name}</div>
                    {lead.company && (
                      <div className="text-xs text-neutral-500 truncate">{lead.company}</div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1.5">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="neutral" size="sm">{lead.intent}</Badge>
                      {lead.follow_up_date && (
                        <div className="flex items-center gap-1 text-xs text-orange-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lead.follow_up_date)}
                        </div>
                      )}
                    </div>
                    {lead.budget && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        ₹{Number(lead.budget).toLocaleString("en-IN")}
                      </div>
                    )}
                    {/* Tags */}
                    {lead.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {lead.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 text-xs rounded-full text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {stageData.count > stageData.leads.length && (
                  <button
                    onClick={() => navigate(`/crm/leads?status=${stage.key}`)}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 py-2 text-center border border-dashed border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    +{stageData.count - stageData.leads.length} more →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
