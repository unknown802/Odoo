import QRCode from "qrcode";
import { Camera, FileDown, PackagePlus, QrCode, Search } from "lucide-react";
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
    QRCode.toDataURL(value, { margin: 1, width: 120 }).then(setSrc).catch(() => setSrc(""));
  }, [value]);

  return src ? <img src={src} alt={`${value} QR code`} className="h-24 w-24 rounded-md border border-border" /> : null;
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
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      category_id: categories[0]?.id,
      condition: "Good",
      location: "",
      current_department_id: departments[0]?.id,
      is_bookable: false
    }
  });

  const filtered = useMemo(
    () =>
      assets.filter((asset) => {
        const searchMatch = [asset.name, asset.asset_tag, asset.serial_number ?? "", asset.location].some((value) =>
          value.toLowerCase().includes(search.toLowerCase())
        );
        const statusMatch = status === "All" || asset.status === status;
        return searchMatch && statusMatch;
      }),
    [assets, search, status]
  );

  const selected = assets.find((asset) => asset.id === selectedId) ?? filtered[0];

  const onSubmit = form.handleSubmit((values) => {
    const result = registerAsset({
      ...values,
      acquisition_cost: values.acquisition_cost ?? 0
    });
    setMessage(result.message);
    form.reset({ ...form.getValues(), name: "", serial_number: "", location: "" });
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="grid gap-5">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Register Asset</h2>
            <Badge tone="info">Next tag AF-{String(assets.length + 1).padStart(4, "0")}</Badge>
          </div>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Field label="Name">
              <Input {...form.register("name")} placeholder="Projector Kit" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <Select {...form.register("category_id")}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Condition">
                <Select {...form.register("condition")}>
                  {["New", "Good", "Fair", "Poor", "Damaged"].map((condition) => (
                    <option key={condition}>{condition}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Serial">
                <Input {...form.register("serial_number")} />
              </Field>
              <Field label="Cost">
                <Input type="number" {...form.register("acquisition_cost")} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Acquisition Date">
                <Input type="date" {...form.register("acquisition_date")} />
              </Field>
              <Field label="Department">
                <Select {...form.register("current_department_id")}>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Location">
              <Input {...form.register("location")} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4" {...form.register("is_bookable")} />
              Bookable resource
            </label>
            <Button type="submit" title="Register asset">
              <PackagePlus className="h-4 w-4" /> Register
            </Button>
            {message && <Notice tone="success" message={message} />}
          </form>
        </Card>

        {selected && (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold">{selected.name}</h2>
                <div className="mt-1 text-sm text-muted">{selected.asset_tag}</div>
              </div>
              <AssetQr value={selected.asset_tag} />
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Holder</span>
                <span className="font-semibold">{profiles.find((profile) => profile.id === selected.current_holder_id)?.full_name ?? "None"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Allocation events</span>
                <span className="font-semibold">{allocations.filter((allocation) => allocation.asset_id === selected.id).length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Maintenance events</span>
                <span className="font-semibold">{maintenance.filter((request) => request.asset_id === selected.id).length}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <section className="grid gap-4 content-start">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-white p-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <Input className="w-full pl-9" placeholder="Search asset tag, serial, name, location" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-44">
            {["All", "Available", "Allocated", "Under_Maintenance", "Lost"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
          <Button variant="secondary" title="Open scanner" onClick={() => setScannerOpen((value) => !value)}>
            <Camera className="h-4 w-4" /> Scanner
          </Button>
          <Button variant="ghost" title="Export assets">
            <FileDown className="h-4 w-4" /> Export
          </Button>
        </div>

        {scannerOpen && <Notice tone="info" message="Camera scanner panel ready for html5-qrcode wiring in live mode." />}

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th>Acquired</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(asset.id)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-brand" />
                      <div>
                        <div className="font-semibold">{asset.name}</div>
                        <div className="text-xs text-muted">{asset.asset_tag}</div>
                      </div>
                    </div>
                  </td>
                  <td>{categories.find((category) => category.id === asset.category_id)?.name}</td>
                  <td>
                    <Badge tone={statusTone(asset.status)}>{asset.status.replace("_", " ")}</Badge>
                  </td>
                  <td>{asset.location}</td>
                  <td>{formatDate(asset.acquisition_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
