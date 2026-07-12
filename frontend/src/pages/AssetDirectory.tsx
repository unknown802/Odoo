import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Camera, FileDown, PackagePlus, QrCode, Search, Package, CheckCircle2, AlertTriangle, X, Edit, Trash2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { StatsBar } from "../components/ui/StatsBar";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { DataTable } from "../components/ui/DataTable";
import { Dialog } from "../components/ui/Dialog";
import { StatusPill } from "../components/ui/StatusPill";
import { formatDate } from "../lib/utils";
import { useAssets, useUpdateAsset, useDeleteAsset } from "../hooks/useAssets";
import { useOrg } from "../hooks/useApi";
import { fetchApi } from "../lib/api";

const PAGE_SIZE = 25;

const assetSchema = z.object({
  name: z.string().min(2),
  category_id: z.string().min(1),
  serial_number: z.string().optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.coerce.number().nonnegative().optional(),
  condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]),
  location: z.string().min(2),
  current_department_id: z.string().optional(),
  is_bookable: z.boolean().default(false)
});

type AssetFormValues = z.infer<typeof assetSchema>;

function AssetQr({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 120, color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then(setSrc).catch(() => setSrc(""));
  }, [value]);
  return src ? <img src={src} alt={`${value} QR code`} className="h-24 w-24 rounded-xl border border-border/50" /> : <div className="h-24 w-24 rounded-xl border border-border bg-hover animate-pulse" />;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function AssetDirectory() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, status]);

  const { data: pagedData, isLoading: loadingAssets } = useAssets({
    status,
    search,
    page,
    limit: PAGE_SIZE,
  });
  const assets = pagedData?.data ?? [];
  const meta = pagedData?.meta;

  const { data: orgData, isLoading: loadingOrg } = useOrg();

  const queryClient = useQueryClient();
  const categories = orgData?.categories ?? [];
  const departments = orgData?.departments ?? [];
  const profiles = orgData?.profiles ?? [];

  const selected = useMemo(() => assets.find((asset) => asset.id === selectedId), [assets, selectedId]);

  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      category_id: "",
      condition: "Good",
      location: "",
      current_department_id: "",
      is_bookable: false
    }
  });

  useEffect(() => {
    if (categories.length > 0 && !form.getValues("category_id")) {
      form.setValue("category_id", categories[0].id);
    }
    if (departments.length > 0 && !form.getValues("current_department_id")) {
      form.setValue("current_department_id", departments[0].id);
    }
  }, [categories, departments, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEditOpen && selectedId) {
        await updateAsset.mutateAsync({ id: selectedId, ...values, acquisition_cost: values.acquisition_cost ?? 0 });
        setMessage("Asset updated successfully.");
        setTimeout(() => { setIsEditOpen(false); setMessage(""); }, 1500);
      } else {
        await fetchApi("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, acquisition_cost: values.acquisition_cost ?? 0 })
        });
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        setMessage("Asset registered successfully.");
        form.reset({ ...form.getValues(), name: "", serial_number: "", location: "" });
        setTimeout(() => { setIsRegisterOpen(false); setMessage(""); }, 1500);
      }
    } catch (e: any) {
      setMessage(e.message ?? "Operation failed.");
    }
  });

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteAsset.mutateAsync(selectedId);
      setIsDeleteOpen(false);
      setSelectedId("");
    } catch (e: any) {
      setMessage(e.message ?? "Failed to delete asset.");
    }
  };

  const openEdit = () => {
    if (!selected) return;
    form.reset({
      name: selected.name,
      category_id: selected.category_id,
      condition: selected.condition,
      location: selected.location,
      current_department_id: selected.current_department_id || undefined,
      is_bookable: selected.is_bookable,
      serial_number: selected.serial_number,
      acquisition_cost: selected.acquisition_cost,
      acquisition_date: selected.acquisition_date
    });
    setIsEditOpen(true);
  };

  if (loadingAssets || loadingOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Asset Directory" subtitle="Manage and track your organization's physical resources." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const availableCount = assets.filter(a => a.status === "Available").length;
  const allocatedCount = assets.filter(a => a.status === "Allocated").length;
  const maintenanceCount = assets.filter(a => a.status === "Under_Maintenance").length;

  const stats = [
    { label: "Total Assets", value: meta?.total ?? assets.length, icon: Package, iconColor: "text-ink", iconBg: "bg-slate-100", accentBorder: "border-t-slate-300" },
    { label: "Available", value: availableCount, icon: PackagePlus, iconColor: "text-brand", iconBg: "bg-brand-muted", accentBorder: "border-t-brand" },
    { label: "Allocated", value: allocatedCount, icon: CheckCircle2, iconColor: "text-success", iconBg: "bg-success-muted", accentBorder: "border-t-success" },
    { label: "In Maintenance", value: maintenanceCount, icon: AlertTriangle, iconColor: "text-warning", iconBg: "bg-warning-muted", accentBorder: "border-t-warning" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Asset Directory" 
        subtitle="Manage and track your organization's physical resources."
      >
        <Button onClick={() => setIsRegisterOpen(true)}>
          <PackagePlus className="h-4 w-4" /> Register Asset
        </Button>
      </PageHeader>

      <StatsBar stats={stats} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-[1fr_320px]"
      >
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <Card className="flex flex-wrap items-center gap-3 p-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <Input 
                className="w-full pl-9 h-9" 
                placeholder="Search asset tag, serial, name, location..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[160px] h-9">
              {["All", "Available", "Allocated", "Under_Maintenance", "Lost", "Retired", "Disposed"].map((option) => (
                <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
              ))}
            </Select>
            <Button variant="secondary" className="h-9 px-3" title="Open scanner" onClick={() => setScannerOpen((v) => !v)}>
              <Camera className="h-4 w-4" /> <span className="hidden sm:inline">Scan</span>
            </Button>
            <Button variant="ghost" className="h-9 px-3" title="Export assets">
              <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
            </Button>
          </Card>

          <AnimatePresence>
            {scannerOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pb-4">
                  <Notice tone="info" message="Camera scanner panel ready for html5-qrcode wiring in live mode." />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DataTable
            isEmpty={assets.length === 0}
            emptyState={
              <EmptyState 
                icon={Search} 
                title="No assets found" 
                description="Try adjusting your search or filters to find what you're looking for." 
                action={<Button variant="secondary" onClick={() => { setSearch(""); setStatus("All"); }}>Clear filters</Button>}
              />
            }
            pagination={meta && meta.totalPages > 1 ? {
              currentPage: meta.page,
              totalPages: meta.totalPages,
              totalItems: meta.total,
              pageSize: meta.pageSize,
              onPageChange: setPage,
            } : undefined}
          >
            <thead>
              <tr>
                <th>Asset Details</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th className="hidden sm:table-cell">Acquired</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr 
                  key={asset.id} 
                  className={selectedId === asset.id ? "bg-brand/[0.03]" : "cursor-pointer hover:bg-hover transition-colors"} 
                  onClick={() => setSelectedId(asset.id)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border shadow-sm">
                        <QrCode className="h-4 w-4 text-muted" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{asset.name}</div>
                        <div className="text-xs text-muted font-mono">{asset.asset_tag}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{categories.find((c) => c.id === asset.category_id)?.name}</span>
                  </td>
                  <td>
                    <StatusPill status={asset.status} />
                  </td>
                  <td>
                    <span className="text-sm truncate max-w-[120px] block">{asset.location}</span>
                  </td>
                  <td className="hidden sm:table-cell text-sm text-muted">
                    {formatDate(asset.acquisition_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </motion.div>

        <motion.div variants={fadeUp} className="hidden xl:block">
          {selected ? (
            <Card className="sticky top-[88px] flex flex-col p-0 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-border flex flex-col items-center text-center relative">
                <Button 
                  variant="ghost" 
                  className="absolute top-2 right-2 h-8 w-8 p-0" 
                  onClick={() => setSelectedId("")}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute top-2 left-2 flex gap-1">
                  <Button variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-brand" onClick={openEdit} title="Edit asset">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-danger hover:bg-danger-muted" onClick={() => setIsDeleteOpen(true)} title="Delete asset">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-4 mt-6 rounded-xl bg-white p-2 shadow-sm border border-border">
                  <AssetQr value={selected.asset_tag} />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight text-ink">{selected.name}</h3>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <Badge tone="neutral" className="font-mono">{selected.asset_tag}</Badge>
                  <StatusPill status={selected.status} />
                </div>
              </div>
              <div className="p-5 flex-1 divide-y divide-border/60">
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Holder</span>
                  <span className="text-sm font-semibold text-ink text-right">
                    {profiles.find((p) => p.id === selected.current_holder_id)?.full_name ?? "None"}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Category</span>
                  <span className="text-sm text-ink text-right">
                    {categories.find((c) => c.id === selected.category_id)?.name}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Department</span>
                  <span className="text-sm text-ink text-right">
                    {departments.find((d) => d.id === selected.current_department_id)?.name ?? "N/A"}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Serial No</span>
                  <span className="text-sm font-mono text-ink text-right">{selected.serial_number || "—"}</span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Location</span>
                  <span className="text-sm text-ink text-right">{selected.location}</span>
                </div>
              </div>
            </Card>
          ) : (
            <div className="sticky top-[88px]">
              <EmptyState 
                icon={QrCode} 
                title="No asset selected" 
                description="Select an asset from the list to view its details and scan QR code." 
                className="h-[400px] border border-dashed border-border rounded-2xl"
              />
            </div>
          )}
        </motion.div>
      </motion.div>

      <Dialog 
        open={isRegisterOpen || isEditOpen} 
        onClose={() => { setIsRegisterOpen(false); setIsEditOpen(false); form.reset(); setMessage(""); }} 
        title={isEditOpen ? "Edit Asset" : "Register Asset"}
        description={isEditOpen ? "Update asset details." : `Next tag: AF-${String((meta?.total ?? 0) + 1).padStart(4, "0")}`}
      >
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="Asset Name">
            <Input {...form.register("name")} placeholder="e.g. MacBook Pro M3" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select {...form.register("category_id")}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Condition">
              <Select {...form.register("condition")}>
                {["New", "Good", "Fair", "Poor", "Damaged"].map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Serial Number"><Input {...form.register("serial_number")} placeholder="Optional" /></Field>
            <Field label="Acquisition Cost ($)"><Input type="number" step="0.01" {...form.register("acquisition_cost")} placeholder="0.00" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Acquisition Date"><Input type="date" {...form.register("acquisition_date")} /></Field>
            <Field label="Department">
              <Select {...form.register("current_department_id")}>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Physical Location"><Input {...form.register("location")} placeholder="e.g. HQ Building, Floor 3" /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold p-3 border border-border rounded-xl bg-hover cursor-pointer transition-colors hover:border-brand/30">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-brand focus-ring" {...form.register("is_bookable")} />
            Make this a bookable resource
          </label>
          
          {message && <Notice tone={message.includes("success") ? "success" : "danger"} message={message} />}
          
          <div className="mt-2 flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => { setIsRegisterOpen(false); setIsEditOpen(false); form.reset(); setMessage(""); }}>Cancel</Button>
            <Button type="submit">
              <PackagePlus className="h-4 w-4" /> {isEditOpen ? "Save Changes" : "Register"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Asset"
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <Notice tone="warning" message={`Are you sure you want to permanently delete ${selected?.name} (${selected?.asset_tag})?`} />
          {message && <Notice tone="danger" message={message} />}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button className="bg-danger hover:bg-danger-dark focus:ring-danger text-white" onClick={handleDelete} disabled={deleteAsset.isPending}>
              {deleteAsset.isPending ? "Deleting..." : "Yes, Delete Asset"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
