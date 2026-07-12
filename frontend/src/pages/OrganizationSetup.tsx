import { ShieldCheck, Building2, Tags, Users, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { StatsBar } from "../components/ui/StatsBar";
import { TabBar } from "../components/ui/TabBar";
import { DataTable } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { StatusPill } from "../components/ui/StatusPill";
import { roleLabels } from "../lib/constants";
import { useOrg, useCreateDepartment, useDeleteDepartment, useCreateCategory, useDeleteCategory } from "../hooks/useApi";
import { fetchApi } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Role } from "../types";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

export function OrganizationSetup() {
  const [tab, setTab] = useState<"departments" | "categories" | "employees">("departments");
  const { data: orgData, isLoading } = useOrg();
  const queryClient = useQueryClient();

  const departments = orgData?.departments ?? [];
  const categories = orgData?.categories ?? [];
  const profiles = orgData?.profiles ?? [];

  const updateRole = async (profileId: string, role: string) => {
    try {
      await fetchApi(`/api/org/profiles/${profileId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      queryClient.invalidateQueries({ queryKey: ["org"] });
    } catch {
      // silent
    }
  };

  const createDeptMutation = useCreateDepartment();
  const deleteDeptMutation = useDeleteDepartment();
  const createCatMutation = useCreateCategory();
  const deleteCatMutation = useDeleteCategory();

  const [deptName, setDeptName] = useState("");
  const [deptHeadId, setDeptHeadId] = useState("");
  const [deptParentId, setDeptParentId] = useState("");

  const [catName, setCatName] = useState("");
  const [catSchema, setCatSchema] = useState('{ "warranty_months": "number", "brand": "string" }');

  const handleCreateDept = async () => {
    if (!deptName) return;
    await createDeptMutation.mutateAsync({ name: deptName, head_id: deptHeadId, parent_department_id: deptParentId || undefined });
    setDeptName(""); setDeptHeadId(""); setDeptParentId("");
  };

  const handleCreateCat = async () => {
    if (!catName) return;
    let custom_fields = {};
    try { custom_fields = JSON.parse(catSchema); } catch (e) { alert("Invalid JSON schema"); return; }
    await createCatMutation.mutateAsync({ name: catName, custom_fields });
    setCatName("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organization Setup" subtitle="Manage structure and profiles." />
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

  const stats = [
    { label: "Departments", value: departments.length, icon: Building2, iconColor: "text-brand", iconBg: "bg-brand-muted", accentBorder: "border-t-brand" },
    { label: "Asset Categories", value: categories.length, icon: Tags, iconColor: "text-info", iconBg: "bg-info-muted", accentBorder: "border-t-info" },
    { label: "Total Employees", value: profiles.length, icon: Users, iconColor: "text-success", iconBg: "bg-success-muted", accentBorder: "border-t-success" },
  ];

  const tabs = [
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "employees", label: "Employees", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Organization Setup" 
        subtitle="Manage your company structure, asset categories, and employee profiles." 
      />

      <StatsBar stats={stats} />

      <TabBar 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(id: string) => setTab(id as typeof tab)} 
      />

      <AnimatePresence mode="wait">
        {tab === "departments" && (
          <motion.div key="departments" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <Card className="flex flex-col p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-ink">New Department</h2>
                  <p className="text-xs font-semibold text-muted">Create a structural unit</p>
                </div>
              </div>

              <div className="grid gap-4 flex-1 content-start">
                <Field label="Department Name">
                  <Input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Facilities Management" className="h-11" />
                </Field>
                <Field label="Department Head">
                  <Select value={deptHeadId} onChange={e => setDeptHeadId(e.target.value)} className="h-11">
                    <option value="">Select manager…</option>
                    {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </Select>
                </Field>
                <Field label="Parent Department">
                  <Select value={deptParentId} onChange={e => setDeptParentId(e.target.value)} className="h-11">
                    <option value="">None (Top Level)</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <Button onClick={handleCreateDept} disabled={createDeptMutation.isPending} title="Save department" className="w-full">
                    <Plus className="h-4 w-4" /> Add Department
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col p-0 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
                <Building2 className="h-5 w-5 text-ink" />
                <h3 className="text-sm font-bold text-ink">Department Structure</h3>
              </div>
              <DataTable
                className="border-0 rounded-none shadow-none"
                isEmpty={departments.length === 0}
                emptyState={<EmptyState icon={Building2} title="No departments" description="Create your first department to organize your assets and employees." />}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Head</th>
                    <th>Parent</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id} className="hover:bg-hover transition-colors">
                      <td className="font-semibold text-ink">{department.name}</td>
                      <td>
                        <div className="text-sm font-medium">{profiles.find((p) => p.id === department.head_id)?.full_name ?? <span className="text-muted italic">Unassigned</span>}</div>
                      </td>
                      <td>
                        <div className="text-sm">{departments.find((parent) => parent.id === department.parent_department_id)?.name ?? <Badge tone="neutral">Root</Badge>}</div>
                      </td>
                      <td>
                        <StatusPill status={department.status} />
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-danger hover:bg-danger-muted" onClick={() => deleteDeptMutation.mutate(department.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
          </motion.div>
        )}

        {tab === "categories" && (
          <motion.div key="categories" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <Card className="flex flex-col p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-muted">
                  <Tags className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-ink">New Category</h2>
                  <p className="text-xs font-semibold text-muted">Define an asset group</p>
                </div>
              </div>

              <div className="grid gap-4 flex-1 content-start">
                <Field label="Category Name">
                  <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. IT Equipment" className="h-11" />
                </Field>
                <Field label="Custom Fields Schema (JSON)">
                  <Textarea value={catSchema} onChange={e => setCatSchema(e.target.value)} className="min-h-[160px] font-mono text-sm" />
                </Field>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <Button onClick={handleCreateCat} disabled={createCatMutation.isPending} title="Save category" className="w-full">
                    <Plus className="h-4 w-4" /> Add Category
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 content-start">
              {categories.map((category) => (
                <Card key={category.id} className="group hover:border-brand/30 transition-colors relative">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-danger hover:bg-danger-muted" onClick={() => deleteCatMutation.mutate(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-4 pr-8">
                    <h3 className="font-bold text-ink">{category.name}</h3>
                    <StatusPill status={category.status} />
                  </div>
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Schema Fields</div>
                  <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-brand-light font-mono leading-relaxed hide-scrollbar">
                    {JSON.stringify(category.custom_fields, null, 2)}
                  </pre>
                </Card>
              ))}
              {categories.length === 0 && (
                <div className="col-span-2">
                  <EmptyState icon={Tags} title="No categories" description="Asset categories with custom fields allow you to track specific data points." />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "employees" && (
          <motion.div key="employees" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <Card className="flex flex-col p-0 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
                <Users className="h-5 w-5 text-ink" />
                <h3 className="text-sm font-bold text-ink">Employee Roster</h3>
              </div>
              <DataTable
                className="border-0 rounded-none shadow-none"
                isEmpty={profiles.length === 0}
                emptyState={<EmptyState icon={Users} title="No employees" description="Wait for employees to sign up via the auth portal." />}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role (Auto-saves)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-hover transition-colors">
                      <td className="font-semibold text-ink">{profile.full_name}</td>
                      <td className="text-sm text-muted">{profile.email}</td>
                      <td>
                        <div className="text-sm">
                          {departments.find((d) => d.id === profile.department_id)?.name ?? <span className="text-muted italic">None</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-brand" />
                          <select
                            className="focus-ring rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand/30 transition-colors"
                            defaultValue={profile.role}
                            onChange={(e) => updateRole(profile.id, e.target.value)}
                          >
                            {Object.entries(roleLabels).map(([role, label]) => (
                              <option key={role} value={role as Role}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <StatusPill status={profile.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
