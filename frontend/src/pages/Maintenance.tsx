import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Package,
  Play,
  Plus,
  Search,
  User,
  Wrench,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  Field,
  Input,
  Select,
  Textarea
} from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { formatDate, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { MaintenanceRequest } from "../types";

const columns: MaintenanceRequest["status"][] = [
  "Pending",
  "Approved",
  "In_Progress",
  "Resolved"
];

type ViewMode = "board" | "list";

const priorityTone = (
  priority: MaintenanceRequest["priority"]
): "neutral" | "info" | "warning" | "danger" => {
  if (priority === "Critical" || priority === "High") {
    return "danger";
  }

  if (priority === "Medium") {
    return "warning";
  }

  return "info";
};

const statusLabel = (status: MaintenanceRequest["status"]) =>
  status.replace("_", " ");

const getWorkOrderId = (requestId: string, index: number) => {
  const cleanId = requestId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-5)
    .toUpperCase();

  return cleanId
    ? `WO-${cleanId}`
    : `WO-${String(index + 1).padStart(4, "0")}`;
};

export function Maintenance() {
  const assets = useAssetFlowStore((state) => state.assets);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const requests = useAssetFlowStore((state) => state.maintenance);
  const createMaintenance = useAssetFlowStore(
    (state) => state.createMaintenance
  );
  const moveMaintenance = useAssetFlowStore(
    (state) => state.moveMaintenance
  );

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<MaintenanceRequest["priority"]>("Medium");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [selectedId, setSelectedId] = useState(
    requests[0]?.id ?? ""
  );

  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<
    "success" | "warning"
  >("success");

  const selectedRequest =
    requests.find((request) => request.id === selectedId) ??
    requests[0];

  const selectedAsset = selectedRequest
    ? assets.find(
        (asset) => asset.id === selectedRequest.asset_id
      )
    : undefined;

  const selectedRequester = selectedRequest
    ? profiles.find(
        (profile) =>
          profile.id === selectedRequest.requested_by_id
      )
    : undefined;

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const asset = assets.find(
        (candidate) => candidate.id === request.asset_id
      );

      const requester = profiles.find(
        (candidate) =>
          candidate.id === request.requested_by_id
      );

      const searchMatch =
        !query ||
        [
          request.title,
          request.description ?? "",
          request.priority,
          request.status,
          asset?.name ?? "",
          asset?.asset_tag ?? "",
          asset?.location ?? "",
          requester?.full_name ?? ""
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const statusMatch =
        statusFilter === "All" ||
        request.status === statusFilter;

      const priorityMatch =
        priorityFilter === "All" ||
        request.priority === priorityFilter;

      return searchMatch && statusMatch && priorityMatch;
    });
  }, [
    requests,
    assets,
    profiles,
    search,
    statusFilter,
    priorityFilter
  ]);

  const openRequests = requests.filter(
    (request) => request.status !== "Resolved"
  ).length;

  const criticalRequests = requests.filter(
    (request) =>
      request.priority === "Critical" &&
      request.status !== "Resolved"
  ).length;

  const inProgressRequests = requests.filter(
    (request) => request.status === "In_Progress"
  ).length;

  const resolvedRequests = requests.filter(
    (request) => request.status === "Resolved"
  ).length;

  const assetsUnderMaintenance = assets.filter(
    (asset) => asset.status === "Under_Maintenance"
  ).length;

  const resetForm = () => {
    setAssetId(assets[0]?.id ?? "");
    setTitle("");
    setDescription("");
    setPriority("Medium");
  };

  const submit = () => {
    if (!assetId) {
      setMessageTone("warning");
      setMessage("Please select an asset.");
      return;
    }

    if (!title.trim()) {
      setMessageTone("warning");
      setMessage("Please enter a maintenance request title.");
      return;
    }

    if (!description.trim()) {
      setMessageTone("warning");
      setMessage(
        "Please provide a short description of the issue."
      );
      return;
    }

    const result = createMaintenance({
      asset_id: assetId,
      title: title.trim(),
      description: description.trim(),
      priority
    });

    setMessageTone(result.ok ? "success" : "warning");
    setMessage(result.message);

    if (result.ok) {
      resetForm();
      setShowForm(false);
    }
  };

  const performAction = (
    requestId: string,
    nextStatus: MaintenanceRequest["status"],
    notes?: string
  ) => {
    const result = moveMaintenance(
      requestId,
      nextStatus,
      notes
    );

    setMessageTone(result.ok ? "success" : "warning");
    setMessage(result.message);
    setSelectedId(requestId);
  };

  const renderWorkflowButton = (
    request: MaintenanceRequest,
    fullWidth = false
  ) => {
    if (request.status === "Pending") {
      return (
        <Button
          variant="secondary"
          className={fullWidth ? "w-full" : ""}
          onClick={(event) => {
            event.stopPropagation();
            performAction(request.id, "Approved");
          }}
          title="Approve maintenance request"
        >
          <Check className="h-4 w-4" />
          Approve Request
        </Button>
      );
    }

    if (request.status === "Approved") {
      return (
        <Button
          variant="secondary"
          className={fullWidth ? "w-full" : ""}
          onClick={(event) => {
            event.stopPropagation();
            performAction(request.id, "In_Progress");
          }}
          title="Start maintenance work"
        >
          <Play className="h-4 w-4" />
          Start Work
        </Button>
      );
    }

    if (request.status === "In_Progress") {
      return (
        <Button
          variant="secondary"
          className={fullWidth ? "w-full" : ""}
          onClick={(event) => {
            event.stopPropagation();
            performAction(
              request.id,
              "Resolved",
              "Maintenance work completed and asset restored."
            );
          }}
          title="Resolve maintenance request"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark Resolved
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Maintenance completed
      </div>
    );
  };

  return (
    <div className="grid gap-6">
      {/* Page Header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Maintenance Operations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Monitor asset health, manage work orders and track
            maintenance workflows.
          </p>
        </div>

        <Button
          onClick={() => setShowForm((value) => !value)}
          title={
            showForm
              ? "Close maintenance form"
              : "Create maintenance request"
          }
        >
          {showForm ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showForm
            ? "Close Form"
            : "New Maintenance Request"}
        </Button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">
                Open Requests
              </div>
              <div className="mt-2 text-3xl font-bold">
                {openRequests}
              </div>
              <div className="mt-1 text-xs text-muted">
                Active work orders
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-brand">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">
                Critical Issues
              </div>
              <div className="mt-2 text-3xl font-bold">
                {criticalRequests}
              </div>
              <div className="mt-1 text-xs text-muted">
                Require immediate action
              </div>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">
                In Progress
              </div>
              <div className="mt-2 text-3xl font-bold">
                {inProgressRequests}
              </div>
              <div className="mt-1 text-xs text-muted">
                Currently being serviced
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-brand">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">
                Resolved
              </div>
              <div className="mt-2 text-3xl font-bold">
                {resolvedRequests}
              </div>
              <div className="mt-1 text-xs text-muted">
                Completed requests
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">
                Assets Under Maintenance
              </div>
              <div className="mt-2 text-3xl font-bold">
                {assetsUnderMaintenance}
              </div>
              <div className="mt-1 text-xs text-muted">
                Temporarily unavailable
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-brand">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </section>

      {/* Message */}
      {message && (
        <Notice tone={messageTone} message={message} />
      )}

      {/* New Maintenance Request */}
      {showForm && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold">
                Create Maintenance Request
              </h2>
              <p className="mt-1 text-sm text-muted">
                Record an asset issue and create a new maintenance
                work order.
              </p>
            </div>

            <Badge tone="info">New Work Order</Badge>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <Field label="Asset">
              <Select
                value={assetId}
                onChange={(event) =>
                  setAssetId(event.target.value)
                }
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} - {asset.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority">
              <Select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as MaintenanceRequest["priority"]
                  )
                }
              >
             {["Low", "Medium", "High", "Critical"].map((item) => (
  <option key={item} value={item}>
    {item}
  </option>
))}
              </Select>
            </Field>

            <div className="lg:col-span-2">
              <Field label="Request Title">
                <Input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Example: Cooling fan requires inspection"
                />
              </Field>
            </div>

            <div className="lg:col-span-2 xl:col-span-4">
              <Field label="Issue Description">
                <Textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe the issue, symptoms, damage or maintenance requirement..."
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="secondary"
              onClick={resetForm}
              title="Reset form"
            >
              Reset
            </Button>

            <Button
              onClick={submit}
              title="Create maintenance request"
            >
              <Plus className="h-4 w-4" />
              Create Work Order
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <section className="rounded-md border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
            <Input
              className="w-full pl-9"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search work order, asset, location or requester"
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <Select
            className="w-44"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All statuses</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {statusLabel(column)}
              </option>
            ))}
          </Select>

          <Select
            className="w-44"
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
          >
            <option value="All">All priorities</option>
            {["Low", "Medium", "High", "Critical"].map((item) => (
  <option key={item} value={item}>
    {item}
  </option>
))}
          </Select>

          <div className="flex rounded-md border border-border bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold ${
                viewMode === "board"
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold ${
                viewMode === "list"
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-slate-50"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm text-muted">
          Showing {filteredRequests.length} of {requests.length}{" "}
          maintenance requests
        </div>
      </section>

      {/* Main Workspace */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Maintenance Workspace
            </h2>
            <p className="mt-1 text-sm text-muted">
              Track every work order through its maintenance
              lifecycle.
            </p>
          </div>

          {/* Board View */}
          {viewMode === "board" && (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {columns.map((column) => {
                const columnRequests =
                  filteredRequests.filter(
                    (request) =>
                      request.status === column
                  );

                return (
                  <div
                    key={column}
                    className="min-h-[430px] rounded-md border border-border bg-slate-50 p-3"
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-brand" />
                        <h3 className="text-sm font-bold">
                          {statusLabel(column)}
                        </h3>
                      </div>

                      <Badge tone="neutral">
                        {columnRequests.length}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {columnRequests.map(
                        (request, requestIndex) => {
                          const asset = assets.find(
                            (candidate) =>
                              candidate.id ===
                              request.asset_id
                          );

                          const requester = profiles.find(
                            (candidate) =>
                              candidate.id ===
                              request.requested_by_id
                          );

                          const globalIndex =
                            requests.findIndex(
                              (item) =>
                                item.id === request.id
                            );

                          return (
                            <article
                              key={request.id}
                              onClick={() =>
                                setSelectedId(request.id)
                              }
                              className={`cursor-pointer rounded-md border bg-white p-4 transition hover:shadow-md ${
                                selectedRequest?.id ===
                                request.id
                                  ? "border-brand shadow-sm"
                                  : "border-border"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-semibold text-muted">
                                  {getWorkOrderId(
                                    request.id,
                                    globalIndex >= 0
                                      ? globalIndex
                                      : requestIndex
                                  )}
                                </div>

                                <Badge
                                  tone={priorityTone(
                                    request.priority
                                  )}
                                >
                                  {request.priority}
                                </Badge>
                              </div>

                              <h4 className="mt-3 font-bold">
                                {request.title}
                              </h4>

                              <div className="mt-2 text-sm font-semibold text-brand">
                                {asset?.asset_tag}
                              </div>

                              <div className="mt-1 text-sm text-muted">
                                {asset?.name ??
                                  "Unknown asset"}
                              </div>

                              {asset?.location && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {asset.location}
                                </div>
                              )}

                              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                                <User className="h-3.5 w-3.5" />
                                {requester?.full_name ??
                                  "Unknown requester"}
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDate(
                                  request.requested_at
                                )}
                              </div>

                              {request.description && (
                                <p className="mt-3 line-clamp-2 text-sm text-muted">
                                  {request.description}
                                </p>
                              )}

                              <div className="mt-4 border-t border-border pt-3">
                                {renderWorkflowButton(
                                  request,
                                  true
                                )}
                              </div>
                            </article>
                          );
                        }
                      )}

                      {columnRequests.length === 0 && (
                        <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-border bg-white p-4 text-center text-sm text-muted">
                          No requests in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <section className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Work Order</th>
                    <th>Asset</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map(
                    (request, index) => {
                      const asset = assets.find(
                        (candidate) =>
                          candidate.id ===
                          request.asset_id
                      );

                      return (
                        <tr
                          key={request.id}
                          onClick={() =>
                            setSelectedId(request.id)
                          }
                          className="cursor-pointer hover:bg-slate-50"
                        >
                          <td>
                            <div className="font-semibold">
                              {request.title}
                            </div>
                            <div className="mt-1 text-xs text-muted">
                              {getWorkOrderId(
                                request.id,
                                index
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="font-semibold">
                              {asset?.name}
                            </div>
                            <div className="text-xs text-muted">
                              {asset?.asset_tag}
                            </div>
                          </td>

                          <td>
                            <Badge
                              tone={priorityTone(
                                request.priority
                              )}
                            >
                              {request.priority}
                            </Badge>
                          </td>

                          <td>
                            <Badge
                              tone={statusTone(
                                request.status
                              )}
                            >
                              {statusLabel(
                                request.status
                              )}
                            </Badge>
                          </td>

                          <td>
                            {formatDate(
                              request.requested_at
                            )}
                          </td>

                          <td>
                            <ChevronRight className="h-4 w-4 text-muted" />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {filteredRequests.length === 0 && (
                <div className="p-10 text-center text-sm text-muted">
                  No maintenance requests match the selected
                  filters.
                </div>
              )}
            </section>
          )}
        </section>

        {/* Detail Panel */}
        <aside className="xl:sticky xl:top-4 xl:self-start">
          {selectedRequest ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Work Order
                  </div>

                  <div className="mt-1 text-sm font-bold text-brand">
                    {getWorkOrderId(
                      selectedRequest.id,
                      requests.findIndex(
                        (request) =>
                          request.id ===
                          selectedRequest.id
                      )
                    )}
                  </div>
                </div>

                <Badge
                  tone={statusTone(
                    selectedRequest.status
                  )}
                >
                  {statusLabel(
                    selectedRequest.status
                  )}
                </Badge>
              </div>

              <div className="mt-5">
                <h2 className="text-xl font-bold">
                  {selectedRequest.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {selectedRequest.description ||
                    "No issue description was provided."}
                </p>
              </div>

              <div className="mt-5 rounded-md border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-white p-2 text-brand">
                    <Package className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="font-bold">
                      {selectedAsset?.name ??
                        "Unknown Asset"}
                    </div>
                    <div className="text-sm text-muted">
                      {selectedAsset?.asset_tag}
                    </div>
                  </div>
                </div>

                {selectedAsset?.location && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                    <MapPin className="h-4 w-4" />
                    {selectedAsset.location}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <span className="text-sm text-muted">
                    Priority
                  </span>
                  <Badge
                    tone={priorityTone(
                      selectedRequest.priority
                    )}
                  >
                    {selectedRequest.priority}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <span className="text-sm text-muted">
                    Requested by
                  </span>
                  <span className="text-right text-sm font-semibold">
                    {selectedRequester?.full_name ??
                      "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <span className="text-sm text-muted">
                    Requested on
                  </span>
                  <span className="text-right text-sm font-semibold">
                    {formatDate(
                      selectedRequest.requested_at
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <span className="text-sm text-muted">
                    Asset condition
                  </span>
                  <span className="text-right text-sm font-semibold">
                    {selectedAsset?.condition ?? "—"}
                  </span>
                </div>
              </div>

              {/* Workflow Timeline */}
              <div className="mt-6">
                <h3 className="font-bold">
                  Maintenance Timeline
                </h3>

                <div className="mt-4 grid gap-0">
                  {columns.map((column, index) => {
                    const currentIndex =
                      columns.indexOf(
                        selectedRequest.status
                      );

                    const completed =
                      index <= currentIndex;

                    return (
                      <div
                        key={column}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                              completed
                                ? "border-brand bg-brand text-white"
                                : "border-border bg-white text-muted"
                            }`}
                          >
                            {completed ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <CircleDot className="h-3 w-3" />
                            )}
                          </div>

                          {index <
                            columns.length - 1 && (
                            <div
                              className={`h-8 w-px ${
                                index < currentIndex
                                  ? "bg-brand"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>

                        <div className="pt-1 text-sm font-semibold">
                          {statusLabel(column)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                {renderWorkflowButton(
                  selectedRequest,
                  true
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="py-10 text-center">
                <Wrench className="mx-auto h-8 w-8 text-muted" />
                <h3 className="mt-3 font-bold">
                  No work order selected
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Select a maintenance request to view its
                  details.
                </p>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}