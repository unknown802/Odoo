import { FileDown, Lock, Plus } from "lucide-react";
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

  const exportPdf = async (cycleId: string) => {
    const cycle = cycles.find((candidate) => candidate.id === cycleId);
    if (!cycle) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.text(cycle.title, 14, 16);
    cycle.items.forEach((item, index) => {
      const asset = assets.find((candidate) => candidate.id === item.asset_id);
      doc.text(`${asset?.asset_tag} ${asset?.name} - ${item.status} - ${item.notes ?? ""}`, 14, 28 + index * 8);
    });
    doc.save(`${cycle.title.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
  };

  return (
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
          {message && <Notice tone="success" message={message} />}
        </div>
      </Card>

      <div className="grid gap-5">
        {cycles.map((cycle) => (
          <section key={cycle.id} className="rounded-md border border-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="font-bold">{cycle.title}</h2>
                <div className="text-sm text-muted">{cycle.items.length} assets in scope</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={statusTone(cycle.status)}>{cycle.status.replace("_", " ")}</Badge>
                <Button variant="secondary" onClick={() => void exportPdf(cycle.id)} title="Export PDF">
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <Button variant="secondary" onClick={() => setMessage(closeAuditCycle(cycle.id).message)} title="Close audit">
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
  );
}
