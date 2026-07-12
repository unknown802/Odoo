import { Check, Play, Plus, Wrench, AlertTriangle, AlertCircle, CheckCircle2, Clock, Edit, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Field, Select, Textarea, Input } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { StatsBar } from "../components/ui/StatsBar";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { DataTable } from "../components/ui/DataTable";
import { StatusPill } from "../components/ui/StatusPill";
import { formatDate } from "../lib/utils";
import { useAllAssets } from "../hooks/useAssets";
import { useMaintenance, useCreateMaintenance, useMoveMaintenance, useUpdateMaintenance, useDeleteMaintenance } from "../hooks/useApi";
import type { MaintenanceRequest } from "../types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

const columns: MaintenanceRequest["status"][] = ["Pending", "Approved", "In_Progress", "Resolved"];

export function Maintenance() {
  const { data: assets = [], isLoading: loadingAssets } = useAllAssets();
  const { data: requests = [], isLoading: loadingMaintenance } = useMaintenance();
  const createMaintenance = useCreateMaintenance();
  const moveMaintenance = useMoveMaintenance();

  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenanceRequest["priority"]>("Medium");
  const [message, setMessage] = useState("");

  const [editId, setEditId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();

  const handleEditOpen = (req: MaintenanceRequest) => {
    setEditId(req.id);
    setTitle(req.title);
    setDescription(req.description || "");
    setPriority(req.priority);
  };

  const handleEditSave = async () => {
    try {
      await updateMaintenance.mutateAsync({ id: editId, title, description, priority });
      setEditId("");
      setTitle("");
      setDescription("");
      setPriority("Medium");
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMaintenance.mutateAsync(deleteId);
      setDeleteId("");
    } catch (e: any) {
      console.error(e);
    }
  };

  const submit = async () => {
    if (!assetId) { setMessage("Please select an asset."); return; }
    if (!title) { setMessage("Title is required."); return; }
    try {
      await createMaintenance.mutateAsync({ asset_id: assetId, title, description, priority });
      setMessage("Maintenance request raised.");
      setTimeout(() => setMessage(""), 3000);
      setTitle("");
      setDescription("");
      setAssetId("");
    } catch (e: any) {
      setMessage(e.message ?? "Failed to create request.");
    }
  };

  const move = async (id: string, action: "approve" | "reject" | "start" | "resolve") => {
    try {
      await moveMaintenance.mutateAsync({ id, action });
    } catch (e: any) {
      console.error(e);
    }
  };

  if (loadingAssets || loadingMaintenance) {
    return (
      <div className="space-y-6">
        <PageHeader title="Maintenance" subtitle="Track repairs and service requests." />
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <SkeletonCard />
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const inProgressCount = requests.filter(r => r.status === "In_Progress").length;
  const criticalCount = requests.filter(r => r.priority === "Critical" && r.status !== "Resolved").length;

  const stats = [
    { label: "Pending Requests", value: pendingCount, icon: Clock, iconColor: "text-brand", iconBg: "bg-brand-muted", accentBorder: "border-t-brand" },
    { label: "In Progress", value: inProgressCount, icon: Wrench, iconColor: "text-warning", iconBg: "bg-warning-muted", accentBorder: "border-t-warning" },
    { label: "Critical Priority", value: criticalCount, icon: AlertCircle, iconColor: criticalCount > 0 ? "text-danger" : "text-success", iconBg: criticalCount > 0 ? "bg-danger-muted" : "bg-success-muted", accentBorder: criticalCount > 0 ? "border-t-danger" : "border-t-success" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Maintenance" 
        subtitle="Track repairs, schedule service, and manage equipment health."
      />

      <StatsBar stats={stats} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]"
      >
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col h-full p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-muted">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">Raise Request</h2>
                <p className="text-xs font-semibold text-muted">Report an issue or request service</p>
              </div>
            </div>

            <div className="grid gap-4 flex-1 content-start">
              <Field label="Asset">
                <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="h-11">
                  <option value="">Select asset…</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.asset_tag} - {asset.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Issue Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Screen flickering" className="h-11" />
              </Field>
              <Field label="Priority Level">
                <Select value={priority} onChange={(e) => setPriority(e.target.value as MaintenanceRequest["priority"])} className="h-11">
                  {["Low", "Medium", "High", "Critical"].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Detailed Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details about the issue..." className="min-h-[100px]" />
              </Field>
              
              {message && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <Notice tone={message.includes("Failed") || message.includes("select") || message.includes("required") ? "danger" : "success"} message={message} />
                </motion.div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <Button 
                  onClick={submit} 
                  title="Raise maintenance" 
                  disabled={createMaintenance.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" /> {createMaintenance.isPending ? "Submitting…" : "Submit Request"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="min-w-0">
          <Card className="p-6 h-full flex flex-col bg-slate-50 border-border/60">
            <h3 className="text-base font-bold text-ink mb-4">Service Pipeline</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1">
              {columns.map((column) => {
                const columnRequests = requests.filter((r) => r.status === column);
                return (
                  <div key={column} className="flex flex-col bg-surface rounded-xl border border-border shadow-sm overflow-hidden h-[400px] overflow-y-auto hide-scrollbar">
                    <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur px-3 py-3 border-b border-border flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink">{column.replace("_", " ")}</h4>
                      <Badge tone="neutral" className="text-[10px]">{columnRequests.length}</Badge>
                    </div>
                    
                    <div className="p-2 grid gap-2">
                      {columnRequests.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted font-medium border-2 border-dashed border-border rounded-lg m-1">
                          Empty
                        </div>
                      ) : (
                        columnRequests.map((request) => {
                          const asset = assets.find((a) => a.id === request.asset_id);
                          return (
                            <motion.article 
                              layoutId={request.id}
                              key={request.id} 
                              className="group relative rounded-lg border border-border bg-white p-3 shadow-sm hover:shadow transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="font-semibold text-sm leading-tight text-ink line-clamp-2 pr-6">{request.title}</div>
                                {request.status === "Pending" && (
                                  <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditOpen(request)} className="p-1 rounded text-muted hover:text-brand hover:bg-brand/10 transition-colors" title="Edit">
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setDeleteId(request.id)} className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors" title="Delete">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge tone={request.priority === "Critical" ? "danger" : request.priority === "High" ? "warning" : "neutral"} className="text-[10px] px-1.5 py-0">
                                  {request.priority}
                                </Badge>
                                <span className="text-[10px] font-mono text-muted">{asset?.asset_tag}</span>
                              </div>
                              
                              <div className="mt-3 pt-2 border-t border-border/50">
                                {request.status === "Pending" && (
                                  <Button variant="secondary" className="w-full h-7 text-xs bg-brand/5 hover:bg-brand/10 text-brand border-brand/20" onClick={() => move(request.id, "approve")}>
                                    <Check className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                )}
                                {request.status === "Approved" && (
                                  <Button variant="secondary" className="w-full h-7 text-xs" onClick={() => move(request.id, "start")}>
                                    <Play className="h-3 w-3 mr-1" /> Start Work
                                  </Button>
                                )}
                                {request.status === "In_Progress" && (
                                  <Button variant="secondary" className="w-full h-7 text-xs bg-success/5 hover:bg-success/10 text-success border-success/20" onClick={() => move(request.id, "resolve")}>
                                    <Wrench className="h-3 w-3 mr-1" /> Resolve
                                  </Button>
                                )}
                                {request.status === "Resolved" && (
                                  <div className="flex items-center justify-center gap-1 text-xs text-success font-medium py-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                                  </div>
                                )}
                              </div>
                            </motion.article>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
            <Wrench className="h-5 w-5 text-ink" />
            <h3 className="text-sm font-bold text-ink">All Maintenance Records</h3>
          </div>
          
          <DataTable
            className="border-0 rounded-none shadow-none"
            isEmpty={requests.length === 0}
            emptyState={
              <EmptyState 
                icon={Wrench} 
                title="No maintenance records" 
                description="There are no maintenance requests logged yet." 
              />
            }
          >
            <thead>
              <tr>
                <th>Request Details</th>
                <th>Asset</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-hover transition-colors">
                  <td>
                    <div className="font-medium text-ink">{request.title}</div>
                    <div className="text-xs text-muted mt-0.5">{formatDate(request.requested_at)}</div>
                  </td>
                  <td>
                    <div className="text-sm">{assets.find((a) => a.id === request.asset_id)?.name}</div>
                    <div className="text-xs font-mono text-muted">{assets.find((a) => a.id === request.asset_id)?.asset_tag}</div>
                  </td>
                  <td>
                    <Badge tone={request.priority === "Critical" ? "danger" : request.priority === "High" ? "warning" : request.priority === "Medium" ? "info" : "neutral"}>
                      {request.priority}
                    </Badge>
                  </td>
                  <td>
                    <StatusPill status={request.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </motion.div>

      <Dialog 
        open={!!editId} 
        onClose={() => { setEditId(""); setTitle(""); setDescription(""); setPriority("Medium"); }} 
        title="Edit Maintenance Request"
      >
        <div className="space-y-4">
          <Field label="Issue Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Priority Level">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as MaintenanceRequest["priority"])}>
              {["Low", "Medium", "High", "Critical"].map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label="Detailed Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="ghost" onClick={() => { setEditId(""); setTitle(""); setDescription(""); setPriority("Medium"); }}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateMaintenance.isPending}>Save Changes</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId("")}
        title="Delete Request"
      >
        <div className="space-y-4">
          <Notice tone="warning" message="Are you sure you want to delete this maintenance request?" />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setDeleteId("")}>Cancel</Button>
            <Button className="bg-danger hover:bg-danger-dark text-white" onClick={handleDelete} disabled={deleteMaintenance.isPending}>Yes, Delete</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
