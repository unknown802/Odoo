import { Check, Play, Plus, Wrench } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Select, Textarea, Input } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { formatDate, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { MaintenanceRequest } from "../types";

const columns: MaintenanceRequest["status"][] = ["Pending", "Approved", "In_Progress", "Resolved"];

export function Maintenance() {
  const assets = useAssetFlowStore((state) => state.assets);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const requests = useAssetFlowStore((state) => state.maintenance);
  const createMaintenance = useAssetFlowStore((state) => state.createMaintenance);
  const moveMaintenance = useAssetFlowStore((state) => state.moveMaintenance);
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [title, setTitle] = useState("Inspection required");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenanceRequest["priority"]>("Medium");
  const [message, setMessage] = useState("");

  const submit = () => {
    const result = createMaintenance({ asset_id: assetId, title, description, priority });
    setMessage(result.message);
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
        <Card>
          <h2 className="font-bold">Raise Maintenance</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Asset">
              <Select value={assetId} onChange={(event) => setAssetId(event.target.value)}>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} - {asset.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="Priority">
              <Select value={priority} onChange={(event) => setPriority(event.target.value as MaintenanceRequest["priority"])}>
                {["Low", "Medium", "High", "Critical"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Button onClick={submit} title="Raise maintenance">
              <Plus className="h-4 w-4" /> Raise Request
            </Button>
            {message && <Notice tone="success" message={message} />}
          </div>
        </Card>

        <section className="grid gap-3 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column} className="min-h-80 rounded-md border border-border bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{column.replace("_", " ")}</h3>
                <Badge tone="neutral">{requests.filter((request) => request.status === column).length}</Badge>
              </div>
              <div className="grid gap-3">
                {requests
                  .filter((request) => request.status === column)
                  .map((request) => {
                    const asset = assets.find((candidate) => candidate.id === request.asset_id);
                    const requester = profiles.find((candidate) => candidate.id === request.requested_by_id);
                    return (
                      <article key={request.id} className="rounded-md border border-border p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold">{request.title}</div>
                          <Badge tone={request.priority === "Critical" || request.priority === "High" ? "danger" : "warning"}>{request.priority}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted">{asset?.asset_tag} - {asset?.name}</div>
                        <div className="mt-1 text-xs text-muted">{requester?.full_name} on {formatDate(request.requested_at)}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {request.status === "Pending" && (
                            <Button variant="secondary" onClick={() => setMessage(moveMaintenance(request.id, "Approved").message)} title="Approve">
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                          )}
                          {request.status === "Approved" && (
                            <Button variant="secondary" onClick={() => setMessage(moveMaintenance(request.id, "In_Progress").message)} title="Start">
                              <Play className="h-4 w-4" /> Start
                            </Button>
                          )}
                          {request.status === "In_Progress" && (
                            <Button variant="secondary" onClick={() => setMessage(moveMaintenance(request.id, "Resolved", "Resolved from kanban").message)} title="Resolve">
                              <Wrench className="h-4 w-4" /> Resolve
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Request</th>
              <th>Asset</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="font-semibold">{request.title}</td>
                <td>{assets.find((asset) => asset.id === request.asset_id)?.asset_tag}</td>
                <td>{request.priority}</td>
                <td>
                  <Badge tone={statusTone(request.status)}>{request.status.replace("_", " ")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
