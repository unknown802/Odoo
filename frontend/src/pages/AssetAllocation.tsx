import { CheckCircle2, RotateCcw, Send, Undo2, Users, AlertTriangle, ArrowRightLeft, FileText, ClipboardList, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { StatsBar } from "../components/ui/StatsBar";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { DataTable } from "../components/ui/DataTable";
import { StatusPill } from "../components/ui/StatusPill";
import { daysOverdue, formatDate, statusTone } from "../lib/utils";
import { useAllAssets } from "../hooks/useAssets";
import { useAllocations, useCreateAllocation, useReturnAllocation, useTransfers, useApproveTransfer, useCreateTransfer, useOrg } from "../hooks/useApi";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function AssetAllocation() {
  const { data: assets = [], isLoading: loadingAssets } = useAllAssets();
  const { data: orgData, isLoading: loadingOrg } = useOrg();
  const { data: allocations = [], isLoading: loadingAllocations } = useAllocations();
  const { data: transfers = [], isLoading: loadingTransfers } = useTransfers();
  
  const createAllocation = useCreateAllocation();
  const returnAllocation = useReturnAllocation();
  const createTransfer = useCreateTransfer();
  const approveTransfer = useApproveTransfer();

  const profiles = orgData?.profiles ?? [];

  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("2026-07-25");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  
  // Return Dialog State
  const [returnId, setReturnId] = useState("");
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNotes, setReturnNotes] = useState("");

  const selectedAsset = useMemo(() => assets.find((a) => a.id === assetId), [assets, assetId]);
  const activeAllocations = useMemo(() => allocations.filter((a) => a.status === "Active"), [allocations]);
  const overdueAllocations = useMemo(() => activeAllocations.filter(a => daysOverdue(a.expected_return_date) > 0), [activeAllocations]);
  const pendingTransfers = useMemo(() => transfers.filter(t => t.status === "Requested"), [transfers]);

  const runAllocation = async () => {
    if (!assetId || !employeeId) { setMessage("Select both an asset and employee."); return; }
    try {
      await createAllocation.mutateAsync({ asset_id: assetId, allocated_to_id: employeeId, expected_return_date: expectedReturn });
      setMessage("Asset allocated successfully.");
      setTimeout(() => setMessage(""), 3000);
      setAssetId("");
      setEmployeeId("");
    } catch (e: any) { setMessage(e.message ?? "Allocation failed."); }
  };

  const runTransfer = async () => {
    if (!assetId || !employeeId) { setMessage("Select both an asset and employee."); return; }
    try {
      await createTransfer.mutateAsync({ asset_id: assetId, to_holder_id: employeeId, notes });
      setMessage("Transfer request created.");
      setTimeout(() => setMessage(""), 3000);
      setAssetId("");
      setEmployeeId("");
      setNotes("");
    } catch (e: any) { setMessage(e.message ?? "Transfer failed."); }
  };

  const submitReturn = async () => {
    if (!returnId) return;
    try {
      await returnAllocation.mutateAsync({
        id: returnId,
        return_condition: returnCondition,
        return_notes: returnNotes
      });
      setReturnId("");
      setReturnCondition("Good");
      setReturnNotes("");
    } catch (e: any) {
      console.error(e);
    }
  };

  if (loadingAssets || loadingOrg || loadingAllocations || loadingTransfers) {
    return (
      <div className="space-y-6">
        <PageHeader title="Asset Allocation" subtitle="Manage assignments and transfers." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <SkeletonCard />
          <div className="space-y-5">
            <SkeletonTable rows={4} />
            <SkeletonTable rows={3} />
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Active Allocations", value: activeAllocations.length, icon: Users, iconColor: "text-brand", iconBg: "bg-brand-muted", accentBorder: "border-t-brand" },
    { label: "Overdue Returns", value: overdueAllocations.length, icon: AlertTriangle, iconColor: overdueAllocations.length > 0 ? "text-danger" : "text-success", iconBg: overdueAllocations.length > 0 ? "bg-danger-muted" : "bg-success-muted", accentBorder: overdueAllocations.length > 0 ? "border-t-danger" : "border-t-success" },
    { label: "Pending Transfers", value: pendingTransfers.length, icon: ArrowRightLeft, iconColor: pendingTransfers.length > 0 ? "text-warning" : "text-neutral", iconBg: pendingTransfers.length > 0 ? "bg-warning-muted" : "bg-slate-100", accentBorder: pendingTransfers.length > 0 ? "border-t-warning" : "border-t-slate-300" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Asset Allocation" 
        subtitle="Manage assignments, track overdue returns, and approve transfers." 
      />

      <StatsBar stats={stats} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"
      >
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col h-full p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted">
                <Send className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">New Allocation</h2>
                <p className="text-xs font-semibold text-muted">Assign or transfer an asset</p>
              </div>
            </div>

            <div className="grid gap-4 flex-1 content-start">
              <Field label="Asset">
                <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="h-11">
                  <option value="">Select asset…</option>
                  {assets.filter(a => a.status !== "Lost" && a.status !== "Disposed").map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} - {asset.name} ({asset.status.replace("_", " ")})
                    </option>
                  ))}
                </Select>
              </Field>
              
              {selectedAsset?.status === "Allocated" && (
                <Notice tone="warning" message={`${selectedAsset.asset_tag} is already allocated. Submitting will create a pending transfer.`} />
              )}
              {selectedAsset?.status === "Under_Maintenance" && (
                <Notice tone="danger" message={`${selectedAsset.asset_tag} is under maintenance. Do not allocate.`} />
              )}
              
              <Field label="Assign to Employee">
                <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-11">
                  <option value="">Select employee…</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.full_name} ({profile.role.replace("_", " ")})</option>
                  ))}
                </Select>
              </Field>
              
              <Field label="Expected Return Date">
                <Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="h-11" />
              </Field>
              
              <Field label="Transfer Notes (Optional)">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition details, accessories included, etc." className="min-h-[80px]" />
              </Field>

              {message && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <Notice tone={message.includes("failed") || message.includes("Select") ? "danger" : "success"} message={message} />
                </motion.div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <Button 
                  onClick={runAllocation} 
                  title="Directly allocate asset" 
                  disabled={createAllocation.isPending || (selectedAsset?.status !== "Available" && !!selectedAsset)}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4" /> Allocate
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={runTransfer} 
                  title="Create transfer request (requires approval)" 
                  disabled={createTransfer.isPending}
                  className="flex-1"
                >
                  <ArrowRightLeft className="h-4 w-4" /> Transfer
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-5 min-w-0">
          {/* Active Allocations Section */}
          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
              <ClipboardList className="h-5 w-5 text-brand" />
              <h3 className="text-sm font-bold text-ink">Active Allocations</h3>
            </div>
            <DataTable
              className="border-0 rounded-none shadow-none"
              isEmpty={activeAllocations.length === 0}
              emptyState={
                <EmptyState 
                  icon={ClipboardList} 
                  title="No active allocations" 
                  description="Assets allocated to employees will appear here." 
                />
              }
            >
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Holder</th>
                  <th>Due Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeAllocations.map((allocation) => {
                  const asset = assets.find((a) => a.id === allocation.asset_id);
                  const holder = profiles.find((p) => p.id === allocation.allocated_to_id);
                  const overdue = daysOverdue(allocation.expected_return_date);
                  return (
                    <tr key={allocation.id} className="hover:bg-hover transition-colors">
                      <td>
                        <div className="font-semibold text-ink">{asset?.name}</div>
                        <div className="text-xs font-mono text-muted">{asset?.asset_tag}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium">{holder?.full_name}</div>
                      </td>
                      <td>
                        <div className={`text-sm ${overdue > 0 ? "font-bold text-danger" : ""}`}>
                          {formatDate(allocation.expected_return_date)}
                        </div>
                        {overdue > 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-danger mt-0.5 block">{overdue} days overdue</span>}
                      </td>
                      <td className="text-right">
                        <Button 
                          variant="secondary" 
                          className="h-8 text-xs px-3"
                          title="Mark returned"
                          onClick={() => setReturnId(allocation.id)}
                          disabled={returnAllocation.isPending}
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Return
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </Card>

          {/* Transfers Section */}
          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
              <ArrowRightLeft className="h-5 w-5 text-warning" />
              <h3 className="text-sm font-bold text-ink">Transfer Requests</h3>
              {pendingTransfers.length > 0 && <Badge tone="warning" className="ml-2">{pendingTransfers.length}</Badge>}
            </div>
            <DataTable
              className="border-0 rounded-none shadow-none"
              isEmpty={transfers.length === 0}
              emptyState={
                <EmptyState 
                  icon={FileText} 
                  title="No transfer requests" 
                  description="Pending and historical transfer requests will appear here." 
                />
              }
            >
              <thead>
                <tr>
                  <th>Asset Transfer</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => {
                  const asset = assets.find((a) => a.id === transfer.asset_id);
                  const target = profiles.find((p) => p.id === transfer.to_holder_id);
                  const source = profiles.find((p) => p.id === transfer.from_holder_id);
                  return (
                    <tr key={transfer.id} className="hover:bg-hover transition-colors">
                      <td>
                        <div className="font-semibold text-ink">{asset?.name} <span className="text-xs font-normal font-mono text-muted ml-1">({asset?.asset_tag})</span></div>
                        <div className="text-xs text-muted mt-0.5 truncate max-w-[200px]">{source?.full_name ? `From: ${source.full_name}` : transfer.notes || "No notes"}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium">{target?.full_name}</div>
                      </td>
                      <td>
                        <StatusPill status={transfer.status} />
                      </td>
                      <td className="text-right">
                        <Button 
                          variant={transfer.status === "Requested" ? "primary" : "secondary"}
                          className="h-8 text-xs px-3"
                          disabled={transfer.status !== "Requested" || approveTransfer.isPending}
                          onClick={() => approveTransfer.mutate(transfer.id)} 
                          title="Approve transfer"
                        >
                          {transfer.status === "Requested" ? <Check className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />} 
                          {transfer.status === "Requested" ? "Approve" : "Approved"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog 
        open={!!returnId} 
        onClose={() => { setReturnId(""); setReturnNotes(""); setReturnCondition("Good"); }} 
        title="Return Asset"
        description="Verify the condition of the asset upon return."
      >
        <div className="space-y-4">
          <Field label="Return Condition">
            <Select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>
              {["New", "Good", "Fair", "Poor", "Damaged"].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          
          {(returnCondition === "Damaged" || returnCondition === "Poor") && (
            <Notice tone="warning" message="This will automatically create a maintenance request for the asset." />
          )}

          <Field label="Return Notes (Optional)">
            <Textarea 
              value={returnNotes} 
              onChange={(e) => setReturnNotes(e.target.value)} 
              placeholder="e.g. Screen is scratched" 
              className="min-h-[80px]" 
            />
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="ghost" onClick={() => setReturnId("")}>Cancel</Button>
            <Button onClick={submitReturn} disabled={returnAllocation.isPending}>
              <Undo2 className="h-4 w-4" /> Confirm Return
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
