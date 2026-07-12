import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileDown,
  Lock,
  Plus
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { AuditItem } from "../types";

export function AuditCycles() {
  const departments = useAssetFlowStore((state) => state.departments);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const assets = useAssetFlowStore((state) => state.assets);
  const cycles = useAssetFlowStore((state) => state.auditCycles);
  const createAuditCycle = useAssetFlowStore((state) => state.createAuditCycle);
  const updateAuditItem = useAssetFlowStore((state) => state.updateAuditItem);
  const closeAuditCycle = useAssetFlowStore((state) => state.closeAuditCycle);
  const auditSummary = useAssetFlowStore((state) => state.getAuditSummary());
  const [title, setTitle] = useState("Monthly Asset Audit");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [location, setLocation] = useState("");
  const [auditorId, setAuditorId] = useState(profiles[0]?.id ?? "");
  const [message, setMessage] = useState("");

  const create = () => {
    const result = createAuditCycle({
      title,
      scope_department_id: departmentId,
      scope_location: location,
      start_date: new Date().toISOString().slice(0, 10),
      auditor_ids: [auditorId]
    });
    setMessage(result.message);
  };

  const exportPdf = (cycleId: string) => {
    const cycle = cycles.find((candidate) => candidate.id === cycleId);
    if (!cycle) return;
    const doc = new jsPDF();
    doc.text(cycle.title, 14, 16);
    cycle.items.forEach((item, index) => {
      const asset = assets.find((candidate) => candidate.id === item.asset_id);
      doc.text(`${asset?.asset_tag} ${asset?.name} - ${item.status} - ${item.notes ?? ""}`, 14, 28 + index * 8);
    });
    doc.save(`${cycle.title.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Assets</p>
              <h2 className="text-3xl font-bold">{auditSummary.total}</h2>
            </div>
            <ClipboardCheck className="text-blue-600" size={28} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Verified</p>
              <h2 className="text-3xl font-bold text-green-600">{auditSummary.verified}</h2>
            </div>
            <CheckCircle2 className="text-green-600" size={28} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Pending</p>
              <h2 className="text-3xl font-bold text-amber-600">{auditSummary.pending}</h2>
            </div>
            <Clock className="text-amber-600" size={28} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Missing</p>
              <h2 className="text-3xl font-bold text-red-600">{auditSummary.missing}</h2>
            </div>
            <AlertTriangle className="text-red-600" size={28} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Damaged</p>
              <h2 className="text-3xl font-bold text-orange-600">{auditSummary.damaged}</h2>
            </div>
            <AlertTriangle className="text-orange-600" size={28} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <h2 className="font-bold">Create Audit Cycle</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Title">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Department">
              <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location contains">
              <Input value={location} onChange={(event) => setLocation(event.target.value)} />
            </Field>
            <Field label="Auditor">
              <Select value={auditorId} onChange={(event) => setAuditorId(event.target.value)}>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={create} title="Create audit">
              <Plus className="h-4 w-4" /> Create Cycle
            </Button>
            {message && (
              <Notice tone={message.toLowerCase().includes("no assets") ? "warning" : "success"} message={message} />
            )}
          </div>
        </Card>

        <div className="grid gap-5">
          {cycles.map((cycle) => (
            <section key={cycle.id} className="rounded-md border border-border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <h2 className="font-bold">{cycle.title}</h2>
                  <div className="text-sm text-muted">{cycle.items.length} assets in scope</div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Completion</span>
                      <span>
                        {Math.round((cycle.items.filter((item) => item.status !== "Pending").length / cycle.items.length) * 100)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${Math.round((cycle.items.filter((item) => item.status !== "Pending").length / cycle.items.length) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(cycle.status)}>{cycle.status.replace("_", " ")}</Badge>
                  <Button variant="secondary" onClick={() => exportPdf(cycle.id)} title="Export PDF">
                    <FileDown className="h-4 w-4" /> PDF
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={cycle.status === "Closed"}
                    onClick={() => {
                      const result = closeAuditCycle(cycle.id);
                      setMessage(result.message);
                    }}
                    title="Close audit"
                  >
                    <Lock className="h-4 w-4" /> Close
                  </Button>
                </div>
              </div>
              <div className="table-shell rounded-none border-0">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycle.items.map((item) => {
                      const asset = assets.find((candidate) => candidate.id === item.asset_id);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="font-semibold">{asset?.asset_tag}</div>
                            <div className="text-xs text-muted">{asset?.name}</div>
                          </td>
                          <td>
                            <Select
                              className={
                                item.status === "Verified"
                                  ? "border-green-500 text-green-700"
                                  : item.status === "Missing"
                                    ? "border-red-500 text-red-700"
                                    : item.status === "Damaged"
                                      ? "border-orange-500 text-orange-700"
                                      : ""
                              }
                              value={item.status}
                              onChange={(event) => updateAuditItem(cycle.id, item.id, event.target.value as AuditItem["status"], item.notes)}
                            >
                              {["Pending", "Verified", "Missing", "Damaged"].map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </Select>
                          </td>
                          <td>
                            <Input
                              value={item.notes ?? ""}
                              onChange={(event) => updateAuditItem(cycle.id, item.id, item.status, event.target.value)}
                              placeholder="Auditor notes"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
