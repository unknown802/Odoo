import QRCode from "qrcode";
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileDown,
  Filter,
  MapPin,
  Package,
  PackageCheck,
  PackagePlus,
  QrCode,
  Search,
  User,
  Wrench,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { formatDate, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

const assetSchema = z.object({
  name: z.string().min(2, "Asset name must contain at least 2 characters."),
  category_id: z.string().min(1, "Please select a category."),
  serial_number: z.string().optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.coerce.number().nonnegative("Cost cannot be negative.").optional(),
  condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]),
  location: z.string().min(2, "Location must contain at least 2 characters."),
  current_department_id: z.string().optional(),
  is_bookable: z.boolean().default(false)
});

type AssetFormValues = z.infer<typeof assetSchema>;

const PAGE_SIZE = 6;

function AssetQr({ value }: { value: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      margin: 1,
      width: 160
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value]);

  if (!src) {
    return (
      <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50">
        <QrCode className="h-8 w-8 text-muted" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${value} QR code`}
      className="h-28 w-28 rounded-xl border border-border bg-white p-2"
    />
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-brand">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function AssetDirectory() {
  const assets = useAssetFlowStore((state) => state.assets);
  const categories = useAssetFlowStore((state) => state.categories);
  const departments = useAssetFlowStore((state) => state.departments);
  const allocations = useAssetFlowStore((state) => state.allocations);
  const maintenance = useAssetFlowStore((state) => state.maintenance);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const registerAsset = useAssetFlowStore((state) => state.registerAsset);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "info">("success");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      category_id: categories[0]?.id ?? "",
      serial_number: "",
      acquisition_date: "",
      acquisition_cost: 0,
      condition: "Good",
      location: "",
      current_department_id: departments[0]?.id ?? "",
      is_bookable: false
    }
  });

  const totalAssets = assets.length;

  const availableAssets = assets.filter(
    (asset) => asset.status === "Available"
  ).length;

  const allocatedAssets = assets.filter(
    (asset) => asset.status === "Allocated"
  ).length;

  const maintenanceAssets = assets.filter(
    (asset) => asset.status === "Under_Maintenance"
  ).length;

  const totalAssetValue = assets.reduce(
    (total, asset) => total + (asset.acquisition_cost ?? 0),
    0
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const searchMatch =
        normalizedSearch.length === 0 ||
        [
          asset.name,
          asset.asset_tag,
          asset.serial_number ?? "",
          asset.location
        ].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );

      const statusMatch =
        status === "All" || asset.status === status;

      const categoryMatch =
        categoryFilter === "All" ||
        asset.category_id === categoryFilter;

      const departmentMatch =
        departmentFilter === "All" ||
        asset.current_department_id === departmentFilter;

      return (
        searchMatch &&
        statusMatch &&
        categoryMatch &&
        departmentMatch
      );
    });
  }, [
    assets,
    search,
    status,
    categoryFilter,
    departmentFilter
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, categoryFilter, departmentFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const selected =
    assets.find((asset) => asset.id === selectedId) ??
    filtered[0];

  const selectedCategory = selected
    ? categories.find(
        (category) => category.id === selected.category_id
      )
    : undefined;

  const selectedDepartment = selected
    ? departments.find(
        (department) =>
          department.id === selected.current_department_id
      )
    : undefined;

  const selectedHolder = selected
    ? profiles.find(
        (profile) => profile.id === selected.current_holder_id
      )
    : undefined;

  const selectedAllocationCount = selected
    ? allocations.filter(
        (allocation) => allocation.asset_id === selected.id
      ).length
    : 0;

  const selectedMaintenanceCount = selected
    ? maintenance.filter(
        (request) => request.asset_id === selected.id
      ).length
    : 0;

  const onSubmit = form.handleSubmit((values) => {
    const result = registerAsset({
      ...values,
      acquisition_cost: values.acquisition_cost ?? 0,
      current_department_id:
        values.current_department_id || undefined
    });

    setMessage(result.message);
    setMessageTone(result.ok ? "success" : "info");

    if (result.ok) {
      form.reset({
        name: "",
        category_id: categories[0]?.id ?? "",
        serial_number: "",
        acquisition_date: "",
        acquisition_cost: 0,
        condition: "Good",
        location: "",
        current_department_id:
          departments[0]?.id ?? "",
        is_bookable: false
      });
    }
  });

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setCategoryFilter("All");
    setDepartmentFilter("All");
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    status !== "All" ||
    categoryFilter !== "All" ||
    departmentFilter !== "All";

  const exportAssets = () => {
    const headers = [
      "Asset Tag",
      "Name",
      "Category",
      "Status",
      "Condition",
      "Serial Number",
      "Location",
      "Department",
      "Acquisition Date",
      "Acquisition Cost",
      "Bookable"
    ];

    const rows = filtered.map((asset) => {
      const category =
        categories.find(
          (item) => item.id === asset.category_id
        )?.name ?? "";

      const department =
        departments.find(
          (item) =>
            item.id === asset.current_department_id
        )?.name ?? "";

      return [
        asset.asset_tag,
        asset.name,
        category,
        asset.status,
        asset.condition,
        asset.serial_number ?? "",
        asset.location,
        department,
        asset.acquisition_date ?? "",
        String(asset.acquisition_cost ?? 0),
        asset.is_bookable ? "Yes" : "No"
      ];
    });

    const escapeCsvValue = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `assetflow-assets-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setMessage(
      `${filtered.length} asset record${
        filtered.length === 1 ? "" : "s"
      } exported successfully.`
    );
    setMessageTone("success");
  };

  const startItem =
    filtered.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(
    currentPage * PAGE_SIZE,
    filtered.length
  );

  return (
    <div className="grid gap-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Asset Directory
          </h1>

          <p className="mt-1 text-sm text-muted">
            Register, track, search and manage organizational
            assets from one workspace.
          </p>
        </div>

        <Button
          type="button"
          title="Register a new asset"
          onClick={() =>
            setShowRegisterForm((value) => !value)
          }
        >
          {showRegisterForm ? (
            <X className="h-4 w-4" />
          ) : (
            <PackagePlus className="h-4 w-4" />
          )}

          {showRegisterForm
            ? "Close Form"
            : "Register Asset"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Assets"
          value={totalAssets}
          subtitle="All registered assets"
          icon={<Package className="h-5 w-5" />}
        />

        <StatCard
          title="Available"
          value={availableAssets}
          subtitle="Ready for allocation"
          icon={<PackageCheck className="h-5 w-5" />}
        />

        <StatCard
          title="Allocated"
          value={allocatedAssets}
          subtitle="Currently assigned"
          icon={<User className="h-5 w-5" />}
        />

        <StatCard
          title="Maintenance"
          value={maintenanceAssets}
          subtitle="Under maintenance"
          icon={<Wrench className="h-5 w-5" />}
        />

        <StatCard
          title="Asset Value"
          value={`₹${totalAssetValue.toLocaleString("en-IN")}`}
          subtitle="Recorded acquisition value"
          icon={
            <CircleDollarSign className="h-5 w-5" />
          }
        />
      </div>

      {message && (
        <Notice
          tone={messageTone}
          message={message}
        />
      )}

      {/* Register form */}
      {showRegisterForm && (
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Register New Asset
              </h2>

              <p className="mt-1 text-sm text-muted">
                Add asset identity, ownership and acquisition
                information.
              </p>
            </div>

            <Badge tone="info">
              Next tag AF-
              {String(assets.length + 1).padStart(4, "0")}
            </Badge>
          </div>

          <form
            className="grid gap-4"
            onSubmit={onSubmit}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Asset Name">
                <Input
                  {...form.register("name")}
                  placeholder="Example: MacBook Pro"
                />

                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      form.formState.errors.name
                        .message
                    }
                  </p>
                )}
              </Field>

              <Field label="Category">
                <Select
                  {...form.register("category_id")}
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </Select>

                {form.formState.errors.category_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      form.formState.errors.category_id
                        .message
                    }
                  </p>
                )}
              </Field>

              <Field label="Condition">
                <Select
                  {...form.register("condition")}
                >
                  {[
                    "New",
                    "Good",
                    "Fair",
                    "Poor",
                    "Damaged"
                  ].map((condition) => (
                    <option
                      key={condition}
                      value={condition}
                    >
                      {condition}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Serial Number">
                <Input
                  {...form.register("serial_number")}
                  placeholder="Example: SN-2026-001"
                />
              </Field>

              <Field label="Acquisition Cost">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register(
                    "acquisition_cost"
                  )}
                  placeholder="0"
                />

                {form.formState.errors
                  .acquisition_cost && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      form.formState.errors
                        .acquisition_cost.message
                    }
                  </p>
                )}
              </Field>

              <Field label="Acquisition Date">
                <Input
                  type="date"
                  {...form.register(
                    "acquisition_date"
                  )}
                />
              </Field>

              <Field label="Department">
                <Select
                  {...form.register(
                    "current_department_id"
                  )}
                >
                  <option value="">
                    No department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Location">
                <Input
                  {...form.register("location")}
                  placeholder="Example: Chennai Office"
                />

                {form.formState.errors.location && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      form.formState.errors.location
                        .message
                    }
                  </p>
                )}
              </Field>

              <div className="flex items-end">
                <label className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-slate-50 px-4 py-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    {...form.register("is_bookable")}
                  />

                  Bookable resource
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                title="Reset asset form"
                onClick={() =>
                  form.reset({
                    name: "",
                    category_id:
                      categories[0]?.id ?? "",
                    serial_number: "",
                    acquisition_date: "",
                    acquisition_cost: 0,
                    condition: "Good",
                    location: "",
                    current_department_id:
                      departments[0]?.id ?? "",
                    is_bookable: false
                  })
                }
              >
                Reset
              </Button>

              <Button
                type="submit"
                title="Register asset"
              >
                <PackagePlus className="h-4 w-4" />
                Register Asset
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search and filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />

            <Input
              className="w-full pl-9"
              placeholder="Search by asset tag, serial, name or location"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <Select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="w-44"
          >
            <option value="All">
              All statuses
            </option>
            <option value="Available">
              Available
            </option>
            <option value="Allocated">
              Allocated
            </option>
            <option value="Reserved">
              Reserved
            </option>
            <option value="Under_Maintenance">
              Under Maintenance
            </option>
            <option value="Lost">Lost</option>
            <option value="Retired">
              Retired
            </option>
            <option value="Disposed">
              Disposed
            </option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
            className="w-44"
          >
            <option value="All">
              All categories
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="w-44"
          >
            <option value="All">
              All departments
            </option>

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              title="Clear filters"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            title="Open scanner"
            onClick={() =>
              setScannerOpen((value) => !value)
            }
          >
            <Camera className="h-4 w-4" />
            Scanner
          </Button>

          <Button
            type="button"
            variant="ghost"
            title="Export filtered assets"
            onClick={exportAssets}
          >
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>
            Showing {filtered.length} of{" "}
            {assets.length} assets
          </span>

          {hasActiveFilters && (
            <span>
              Filters are currently active
            </span>
          )}
        </div>
      </Card>

      {scannerOpen && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-brand">
                <Camera className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-bold">
                  QR Scanner
                </h3>

                <p className="mt-1 text-sm text-muted">
                  Camera scanning interface is ready
                  for live QR scanner integration.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              title="Close scanner"
              onClick={() =>
                setScannerOpen(false)
              }
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>

          <div className="mt-4 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50">
            <div className="text-center">
              <QrCode className="mx-auto h-10 w-10 text-muted" />
              <p className="mt-3 text-sm font-semibold">
                Scanner preview area
              </p>
              <p className="mt-1 text-xs text-muted">
                Live camera integration can be
                connected here.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Asset table and details */}
      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">
                Asset Inventory
              </h2>

              <p className="mt-1 text-sm text-muted">
                Select an asset to view its
                complete overview.
              </p>
            </div>

            <Badge tone="info">
              {filtered.length} result
              {filtered.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th>Department</th>
                  <th>Acquired</th>
                </tr>
              </thead>

              <tbody>
                {paginatedAssets.map((asset) => {
                  const category =
                    categories.find(
                      (item) =>
                        item.id ===
                        asset.category_id
                    );

                  const department =
                    departments.find(
                      (item) =>
                        item.id ===
                        asset.current_department_id
                    );

                  const isSelected =
                    selected?.id === asset.id;

                  return (
                    <tr
                      key={asset.id}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? "bg-slate-50"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() =>
                        setSelectedId(asset.id)
                      }
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-brand">
                            <QrCode className="h-4 w-4" />
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">
                              {asset.name}
                            </div>

                            <div className="text-xs text-muted">
                              {asset.asset_tag}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {category?.name ?? "—"}
                      </td>

                      <td>
                        <Badge
                          tone={statusTone(
                            asset.status
                          )}
                        >
                          {asset.status.replace(
                            /_/g,
                            " "
                          )}
                        </Badge>
                      </td>

                      <td>
                        {asset.condition}
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted" />
                          {asset.location}
                        </div>
                      </td>

                      <td>
                        {department?.name ?? "—"}
                      </td>

                      <td>
                        {formatDate(
                          asset.acquisition_date
                        )}
                      </td>
                    </tr>
                  );
                })}

                {paginatedAssets.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center"
                    >
                      <Package className="mx-auto h-10 w-10 text-muted" />

                      <p className="mt-3 font-semibold">
                        No assets found
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        Try changing your search or
                        filters.
                      </p>

                      {hasActiveFilters && (
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="secondary"
                            title="Clear all filters"
                            onClick={clearFilters}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted">
                Showing {startItem}–{endItem} of{" "}
                {filtered.length}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  title="Previous page"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="px-2 text-sm font-semibold">
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  title="Next page"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Selected asset details */}
        {selected ? (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge
                  tone={statusTone(
                    selected.status
                  )}
                >
                  {selected.status.replace(
                    /_/g,
                    " "
                  )}
                </Badge>

                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  {selected.name}
                </h2>

                <p className="mt-1 text-sm font-medium text-muted">
                  {selected.asset_tag}
                </p>
              </div>

              <AssetQr
                value={selected.asset_tag}
              />
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Category
                </span>
                <span className="text-right font-semibold">
                  {selectedCategory?.name ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Condition
                </span>
                <span className="font-semibold">
                  {selected.condition}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Serial Number
                </span>
                <span className="text-right font-semibold">
                  {selected.serial_number ??
                    "Not provided"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Location
                </span>
                <span className="text-right font-semibold">
                  {selected.location}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Department
                </span>
                <span className="text-right font-semibold">
                  {selectedDepartment?.name ??
                    "Unassigned"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Current Holder
                </span>
                <span className="text-right font-semibold">
                  {selectedHolder?.full_name ??
                    "None"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Acquisition Date
                </span>
                <span className="font-semibold">
                  {formatDate(
                    selected.acquisition_date
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
                <span className="text-muted">
                  Acquisition Cost
                </span>
                <span className="font-semibold">
                  ₹
                  {(
                    selected.acquisition_cost ?? 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">
                  Bookable
                </span>

                <span className="flex items-center gap-1.5 font-semibold">
                  {selected.is_bookable && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}

                  {selected.is_bookable
                    ? "Yes"
                    : "No"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-xs font-medium text-muted">
                  Allocation Events
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {selectedAllocationCount}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-xs font-medium text-muted">
                  Maintenance Events
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {selectedMaintenanceCount}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <Building2 className="h-4 w-4 text-brand" />

              <span className="text-muted">
                Managed by
              </span>

              <span className="font-semibold">
                {selectedDepartment?.name ??
                  "Organization"}
              </span>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex min-h-72 items-center justify-center text-center">
              <div>
                <Package className="mx-auto h-10 w-10 text-muted" />

                <p className="mt-3 font-semibold">
                  No asset selected
                </p>

                <p className="mt-1 text-sm text-muted">
                  Select an asset from the table to
                  view its details.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}