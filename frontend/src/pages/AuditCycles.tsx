import { FileDown, Lock, Plus, ClipboardCheck, ShieldCheck, AlertCircle, Edit, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Field, Input, Select } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { StatsBar } from "../components/ui/StatsBar";
import { DataTable } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard } from "../components/ui/Skeleton";
import { StatusPill } from "../components/ui/StatusPill";
import { statusTone } from "../lib/utils";
import { useAllAssets } from "../hooks/useAssets";
import { useAuditCycles, useCreateAuditCycle, useUpdateAuditItem, useCloseAuditCycle, useOrg, useUpdateAuditCycle, useDeleteAuditCycle } from "../hooks/useApi";
import type { AuditItem, AuditCycle } from "../types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function AuditCycles() {
  const { data: assets = [], isLoading: loadingAssets } = useAllAssets();
  const { data: orgData, isLoading: loadingOrg } = useOrg();
  const { data: cycles = [], isLoading: loadingCycles } = useAuditCycles();
  const createAuditCycle = useCreateAuditCycle();
  const updateAuditItem = useUpdateAuditItem();
  const closeAuditCycle = useCloseAuditCycle();

  const departments = orgData?.departments ?? [];
  const profiles = orgData?.profiles ?? [];

  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [location, setLocation] = useState("");
  const [auditorId, setAuditorId] = useState("");
  const [message, setMessage] = useState("");

  const updateAuditCycle = useUpdateAuditCycle();
  const deleteAuditCycle = useDeleteAuditCycle();

  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAuditorId, setEditAuditorId] = useState("");

  const [deleteId, setDeleteId] = useState("");

  const openEdit = (cycle: AuditCycle) => {
    setEditId(cycle.id);
    setEditTitle(cycle.title);
    setEditDeptId(cycle.scope_department_id || "");
    setEditLocation(cycle.scope_location || "");
    setEditAuditorId(cycle.auditor_ids[0] || "");
  };

  const handleEditSave = async () => {
    if (!editId) return;
    try {
      await updateAuditCycle.mutateAsync({
        id: editId,
        title: editTitle,
        scope_department_id: editDeptId || undefined,
        scope_location: editLocation || undefined,
        auditor_ids: editAuditorId ? [editAuditorId] : []
      });
      setEditId("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAuditCycle.mutateAsync(deleteId);
      setDeleteId("");
    } catch (e) {
      console.error(e);
    }
  };

  const create = async () => {
    if (!title) { setMessage("Title is required."); return; }
    if (!auditorId) { setMessage("Select an auditor."); return; }
    try {
      await createAuditCycle.mutateAsync({
        title,
        scope_department_id: departmentId || undefined,
        scope_location: location || undefined,
        start_date: new Date().toISOString().slice(0, 10),
        auditor_ids: [auditorId]
      });
      setMessage("Audit cycle created.");
      setTimeout(() => setMessage(""), 3000);
      setTitle("");
      setDepartmentId("");
      setLocation("");
      setAuditorId("");
    } catch (e: any) {
      setMessage(e.message ?? "Failed to create cycle.");
    }
  };

  const exportPdf = (cycleId: string) => {
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) return;
    const doc = new jsPDF();
    doc.text(cycle.title, 14, 16);
    cycle.items.forEach((item, index) => {
      const asset = assets.find((a) => a.id === item.asset_id);
      doc.text(`${asset?.asset_tag} ${asset?.name} - ${item.status} - ${item.notes ?? ""}`, 14, 28 + index * 8);
    });
    doc.save(`${cycle.title.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
  };

  if (loadingAssets || loadingOrg || loadingCycles) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Cycles" subtitle="Manage physical asset verification." />
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
          <SkeletonCard />
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const activeCycles = cycles.filter(c => c.status !== "Closed");
  const totalAssetsInActive = activeCycles.reduce((sum, c) => sum + c.items.length, 0);
  const verifiedAssetsInActive = activeCycles.reduce((sum, c) => sum + c.items.filter(i => i.status === "Verified").length, 0);

  const stats = [
    { label: "Active Audits", value: activeCycles.length, icon: ClipboardCheck, iconColor: "text-brand", iconBg: "bg-brand-muted", accentBorder: "border-t-brand" },
    { label: "Pending Verification", value: totalAssetsInActive - verifiedAssetsInActive, icon: AlertCircle, iconColor: "text-warning", iconBg: "bg-warning-muted", accentBorder: "border-t-warning" },
    { label: "Verified Assets", value: verifiedAssetsInActive, icon: ShieldCheck, iconColor: "text-success", iconBg: "bg-success-muted", accentBorder: "border-t-success" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Cycles" 
        subtitle="Manage physical asset verification and inventory checks."
      />

      <StatsBar stats={stats} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]"
      >
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col h-full p-6 sticky top-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted">
                <ClipboardCheck className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">New Audit Cycle</h2>
                <p className="text-xs font-semibold text-muted">Initialize an inventory check</p>
              </div>
            </div>

            <div className="grid gap-4 flex-1 content-start">
              <Field label="Audit Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 IT Hardware Audit" className="h-11" />
              </Field>
              <Field label="Target Department">
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-11">
                  <option value="">All departments (Global)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Location Filter (Optional)">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. New York Office" className="h-11" />
              </Field>
              <Field label="Lead Auditor">
                <Select value={auditorId} onChange={(e) => setAuditorId(e.target.value)} className="h-11">
                  <option value="">Select auditor…</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </Select>
              </Field>

              {message && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <Notice tone={message.includes("Failed") || message.includes("Select") || message.includes("required") ? "danger" : "success"} message={message} />
                </motion.div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <Button 
                  onClick={create} 
                  title="Create audit" 
                  disabled={createAuditCycle.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" /> {createAuditCycle.isPending ? "Creating…" : "Initialize Audit"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-6 content-start">
          {cycles.length === 0 ? (
            <EmptyState 
              icon={ClipboardCheck} 
              title="No audit cycles" 
              description="Create an audit cycle to begin verifying physical assets." 
            />
          ) : (
            <AnimatePresence>
              {cycles.map((cycle) => {
                const total = cycle.items.length;
                const verified = cycle.items.filter(i => i.status === "Verified").length;
                const missing = cycle.items.filter(i => i.status === "Missing").length;
                const damaged = cycle.items.filter(i => i.status === "Damaged").length;
                
                const progress = total > 0 ? (verified / total) * 100 : 0;
                
                return (
                  <motion.section 
                    key={cycle.id} 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-white px-5 py-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-bold text-ink">{cycle.title}</h2>
                          <StatusPill status={cycle.status} />
                          {cycle.status !== "Closed" && (
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => openEdit(cycle)} className="p-1 rounded text-muted hover:text-brand hover:bg-brand-muted transition-colors" title="Edit Scope">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeleteId(cycle.id)} className="p-1 rounded text-muted hover:text-danger hover:bg-danger-muted transition-colors" title="Cancel Audit">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-muted mb-3 flex items-center gap-3">
                          <span>{total} assets in scope</span>
                          <span className="text-border">•</span>
                          <span className="text-success">{verified} Verified</span>
                          {missing > 0 && <><span className="text-border">•</span><span className="text-danger">{missing} Missing</span></>}
                          {damaged > 0 && <><span className="text-border">•</span><span className="text-warning">{damaged} Damaged</span></>}
                        </div>
                        
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 max-w-md">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute h-full rounded-full bg-success" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => exportPdf(cycle.id)} title="Export PDF" className="h-9">
                          <FileDown className="h-4 w-4" /> Export Report
                        </Button>
                        <Button 
                          variant={cycle.status === "Closed" ? "secondary" : "primary"}
                          className={`h-9 ${cycle.status !== "Closed" ? "bg-ink hover:bg-ink/90 text-white" : ""}`}
                          onClick={() => closeAuditCycle.mutate(cycle.id)}
                          disabled={cycle.status === "Closed" || closeAuditCycle.isPending}
                          title="Close audit"
                        >
                          <Lock className="h-4 w-4" /> {cycle.status === "Closed" ? "Closed" : "Close Audit"}
                        </Button>
                      </div>
                    </div>

                    <div className="p-0 bg-slate-50">
                      <DataTable className="border-0 shadow-none rounded-none" isEmpty={cycle.items.length === 0} emptyState={<div />}>
                        <thead>
                          <tr>
                            <th>Asset Details</th>
                            <th>Verification Status</th>
                            <th>Auditor Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycle.items.map((item) => {
                            const asset = assets.find((a) => a.id === item.asset_id);
                            return (
                              <tr key={item.id} className="hover:bg-hover transition-colors">
                                <td>
                                  <div className="font-semibold text-ink">{asset?.name}</div>
                                  <div className="text-xs font-mono text-muted">{asset?.asset_tag}</div>
                                </td>
                                <td>
                                  <Select
                                    className={`h-9 text-sm font-medium border-border focus:ring-1 focus:ring-brand
                                      ${item.status === 'Verified' ? 'bg-success/5 border-success/30 text-success-dark' : ''}
                                      ${item.status === 'Missing' ? 'bg-danger/5 border-danger/30 text-danger-dark' : ''}
                                      ${item.status === 'Damaged' ? 'bg-warning/5 border-warning/30 text-warning-dark' : ''}
                                    `}
                                    value={item.status}
                                    disabled={cycle.status === "Closed"}
                                    onChange={(e) =>
                                      updateAuditItem.mutate({ cycleId: cycle.id, itemId: item.id, status: e.target.value as AuditItem["status"], notes: item.notes })
                                    }
                                  >
                                    {["Pending", "Verified", "Missing", "Damaged"].map((s) => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </Select>
                                </td>
                                <td>
                                  <Input
                                    className="h-9 text-sm"
                                    value={item.notes ?? ""}
                                    disabled={cycle.status === "Closed"}
                                    onChange={(e) => updateAuditItem.mutate({ cycleId: cycle.id, itemId: item.id, status: item.status, notes: e.target.value })}
                                    placeholder="Add context..."
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </DataTable>
                    </div>
                  </motion.section>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>

      <Dialog open={!!editId} onClose={() => setEditId("")} title="Edit Audit Scope">
        <div className="grid gap-4">
          <Field label="Audit Title"><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></Field>
          <Field label="Target Department">
            <Select value={editDeptId} onChange={e => setEditDeptId(e.target.value)}>
              <option value="">All departments (Global)</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Location Filter"><Input value={editLocation} onChange={e => setEditLocation(e.target.value)} /></Field>
          <Field label="Lead Auditor">
            <Select value={editAuditorId} onChange={e => setEditAuditorId(e.target.value)}>
              <option value="">Select auditor…</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="ghost" onClick={() => setEditId("")}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateAuditCycle.isPending}>Save Changes</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId("")} title="Cancel Audit">
        <div className="space-y-4">
          <Notice tone="warning" message="Are you sure you want to cancel this audit cycle? This action cannot be undone." />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setDeleteId("")}>Keep Audit</Button>
            <Button className="bg-danger hover:bg-danger-dark text-white" onClick={handleDelete} disabled={deleteAuditCycle.isPending}>Yes, Cancel It</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
