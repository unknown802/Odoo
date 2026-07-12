import { CheckCircle2, RotateCcw, Send, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { daysOverdue, formatDate, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

export function AssetAllocation() {
  const assets = useAssetFlowStore((state) => state.assets);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const allocations = useAssetFlowStore((state) => state.allocations);
  const transfers = useAssetFlowStore((state) => state.transfers);
  const allocateAsset = useAssetFlowStore((state) => state.allocateAsset);
  const returnAllocation = useAssetFlowStore((state) => state.returnAllocation);
  const requestTransfer = useAssetFlowStore((state) => state.requestTransfer);
  const approveTransfer = useAssetFlowStore((state) => state.approveTransfer);
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(profiles.find((profile) => profile.role === "Employee")?.id ?? profiles[0]?.id ?? "");
  const [expectedReturn, setExpectedReturn] = useState("2026-07-25");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const selectedAsset = assets.find((asset) => asset.id === assetId);
  const activeAllocations = useMemo(() => allocations.filter((allocation) => allocation.status === "Active"), [allocations]);

  const runAllocation = () => {
    const result = allocateAsset(assetId, employeeId, expectedReturn);
    setMessage(result.message);
  };

  const runTransfer = () => {
    const result = requestTransfer(assetId, employeeId, notes);
    setMessage(result.message);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <h2 className="font-bold">Allocate Asset</h2>
        <div className="mt-4 grid gap-3">
          <Field label="Asset">
            <Select value={assetId} onChange={(event) => setAssetId(event.target.value)}>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_tag} - {asset.name} ({asset.status.replace("_", " ")})
                </option>
              ))}
            </Select>
          </Field>
          {selectedAsset?.status === "Allocated" && (
            <Notice tone="warning" message={`${selectedAsset.asset_tag} is already allocated. Use transfer request for handoff.`} />
          )}
          {selectedAsset?.status === "Under_Maintenance" && <Notice tone="warning" message={`${selectedAsset.asset_tag} is under maintenance.`} />}
          <Field label="Employee">
            <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected return">
            <Input type="date" value={expectedReturn} onChange={(event) => setExpectedReturn(event.target.value)} />
          </Field>
          <Field label="Transfer notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllocation} title="Allocate asset">
              <CheckCircle2 className="h-4 w-4" /> Allocate
            </Button>
            <Button variant="secondary" onClick={runTransfer} title="Create transfer request">
              <Send className="h-4 w-4" /> Transfer Request
            </Button>
          </div>
          {message && <Notice tone={message.includes("already") || message.includes("under") ? "warning" : "success"} message={message} />}
        </div>
      </Card>

      <div className="grid gap-5">
        <section className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Active Allocation</th>
                <th>Holder</th>
                <th>Due</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeAllocations.map((allocation) => {
                const asset = assets.find((candidate) => candidate.id === allocation.asset_id);
                const holder = profiles.find((candidate) => candidate.id === allocation.allocated_to_id);
                const overdue = daysOverdue(allocation.expected_return_date);
                return (
                  <tr key={allocation.id}>
                    <td>
                      <div className="font-semibold">{asset?.name}</div>
                      <div className="text-xs text-muted">{asset?.asset_tag}</div>
                    </td>
                    <td>{holder?.full_name}</td>
                    <td>
                      <div>{formatDate(allocation.expected_return_date)}</div>
                      {overdue > 0 && <Badge tone="danger">{overdue} days overdue</Badge>}
                    </td>
                    <td>
                      <Button variant="secondary" title="Mark returned" onClick={() => setMessage(returnAllocation(allocation.id, "Good", "Checked in from UI").message)}>
                        <Undo2 className="h-4 w-4" /> Return
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Transfer</th>
                <th>To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => {
                const asset = assets.find((candidate) => candidate.id === transfer.asset_id);
                const target = profiles.find((candidate) => candidate.id === transfer.to_holder_id);
                return (
                  <tr key={transfer.id}>
                    <td>
                      <div className="font-semibold">{asset?.asset_tag}</div>
                      <div className="text-xs text-muted">{transfer.notes}</div>
                    </td>
                    <td>{target?.full_name}</td>
                    <td>
                      <Badge tone={statusTone(transfer.status)}>{transfer.status}</Badge>
                    </td>
                    <td>
                      <Button variant="secondary" disabled={transfer.status !== "Requested"} onClick={() => setMessage(approveTransfer(transfer.id).message)} title="Approve transfer">
                        <RotateCcw className="h-4 w-4" /> Approve
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
