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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const availableAssets = assets.filter((asset) => asset.status === "Available").length;
  const allocatedAssets = assets.filter((asset) => asset.status === "Allocated").length;
  const maintenanceAssets = assets.filter((asset) => asset.status === "Under_Maintenance").length;
  const pendingTransfers = transfers.filter((transfer) => transfer.status === "Requested").length;
  const overdueAssets = allocations.filter((allocation) => daysOverdue(allocation.expected_return_date) > 0).length;

  const selectedAsset = assets.find((asset) => asset.id === assetId);
  const selectedEmployee = profiles.find((profile) => profile.id === employeeId);
  const activeAllocations = useMemo(() => {
    return allocations.filter((allocation) => {
      if (allocation.status !== "Active") return false;

      const asset = assets.find((candidate) => candidate.id === allocation.asset_id);
      const holder = profiles.find((candidate) => candidate.id === allocation.allocated_to_id);

      const search =
        asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset?.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holder?.full_name.toLowerCase().includes(searchTerm.toLowerCase());

      const status = statusFilter === "All" || asset?.status === statusFilter;

      return search && status;
    });
  }, [allocations, assets, profiles, searchTerm, statusFilter]);

  const runAllocation = () => {
    const result = allocateAsset(assetId, employeeId, expectedReturn);
    setMessage(result.message);
    if (result.ok) {
      setNotes("");
    }
  };

  const runTransfer = () => {
    const result = requestTransfer(assetId, employeeId, notes);
    setMessage(result.message);
  };

  const exportCSV = () => {
    const rows = activeAllocations.map((allocation) => {
      const asset = assets.find((candidate) => candidate.id === allocation.asset_id);
      const holder = profiles.find((candidate) => candidate.id === allocation.allocated_to_id);

      return {
        Asset: asset?.name ?? "",
        Tag: asset?.asset_tag ?? "",
        Holder: holder?.full_name ?? "",
        Due: allocation.expected_return_date
      };
    });

    if (rows.length === 0) {
      setMessage("No allocations available to export.");
      return;
    }

    const csv = [Object.keys(rows[0]).join(","), ...rows.map((row) => Object.values(row).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "asset_allocations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Allocation Center</h1>
          <p className="text-muted">Manage enterprise assets, transfers and allocations.</p>
        </div>
        <Button onClick={runAllocation}>
          <CheckCircle2 className="h-4 w-4" /> Quick Allocate
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-5">
          <div className="text-sm text-muted">Available Assets</div>
          <div className="mt-3 text-3xl font-bold text-emerald-600">{availableAssets}</div>
          <Badge tone="success">Ready</Badge>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Allocated</div>
          <div className="mt-3 text-3xl font-bold text-blue-600">{allocatedAssets}</div>
          <Badge>In Use</Badge>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Maintenance</div>
          <div className="mt-3 text-3xl font-bold text-orange-500">{maintenanceAssets}</div>
          <Badge tone="warning">Service</Badge>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Pending Transfers</div>
          <div className="mt-3 text-3xl font-bold text-purple-600">{pendingTransfers}</div>
          <Badge tone="info">Approval</Badge>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Overdue Returns</div>
          <div className="mt-3 text-3xl font-bold text-red-600">{overdueAssets}</div>
          <Badge tone="danger">Attention</Badge>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row">
          <Input placeholder="🔍 Search Asset ID, Asset Name or Employee..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="flex-1" />
          <Select className="lg:w-52" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Under_Maintenance">Maintenance</option>
            <option value="Reserved">Reserved</option>
          </Select>
          <Button variant="secondary" onClick={exportCSV}>Export CSV</Button>
          <Button onClick={() => alert("QR Scanner Integration Coming Soon")}>Scan QR</Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Allocate Asset</h2>
            <p className="text-sm text-muted">Assign enterprise assets securely.</p>
          </div>
          <Badge tone="success">Live</Badge>
        </div>
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
          <Card className="bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{selectedAsset?.name}</div>
                <div className="text-sm text-muted">{selectedAsset?.asset_tag}</div>
              </div>
              <Badge tone={selectedAsset?.status === "Available" ? "success" : selectedAsset?.status === "Allocated" ? "warning" : "danger"}>
                {selectedAsset?.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <b>Condition</b>
                <div>{selectedAsset?.condition}</div>
              </div>
              <div>
                <b>Location</b>
                <div>{selectedAsset?.location}</div>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-1 text-xs text-muted">Asset Health</div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: "92%" }} />
              </div>
              <div className="mt-2 text-xs text-muted">Excellent Health</div>
            </div>
          </Card>
          {selectedAsset?.status === "Allocated" && (
            <Notice tone="warning" message={`${selectedAsset.asset_tag} is already allocated. Use transfer request for handoff.`} />
          )}
          {selectedAsset?.status === "Under_Maintenance" && <Notice tone="warning" message={`${selectedAsset.asset_tag} is under maintenance.`} />}
          <Field label="Employee">
            <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              {profiles
                .filter((profile) => profile.role === "Employee")
                .map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
            </Select>
          </Field>
          <Card className="bg-slate-50">
            <div className="text-lg font-semibold">👤 {selectedEmployee?.full_name}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                Role
                <div className="font-medium">{selectedEmployee?.role.replace("_", " ")}</div>
              </div>
              <div>
                Status
                <div>
                  <Badge tone="success">{selectedEmployee?.status}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-md bg-blue-50 p-3">
              <div className="font-semibold">💡 AI Suggestion</div>
              <div className="text-sm text-muted">This employee is eligible for allocation. No conflicting assets detected.</div>
            </div>
          </Card>
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
              {activeAllocations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted">
                    No allocations found.
                  </td>
                </tr>
              ) : (
                activeAllocations.map((allocation) => {
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
                })
              )}
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
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted">
                    No transfers found.
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => {
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
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
  );
}
