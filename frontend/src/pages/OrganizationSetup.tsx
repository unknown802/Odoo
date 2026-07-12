import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { roleLabels } from "../lib/constants";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { Role } from "../types";

export function OrganizationSetup() {
  const [tab, setTab] = useState<"departments" | "categories" | "employees">("departments");
  const departments = useAssetFlowStore((state) => state.departments);
  const categories = useAssetFlowStore((state) => state.categories);
  const profiles = useAssetFlowStore((state) => state.profiles);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {[
          ["departments", "Departments"],
          ["categories", "Categories"],
          ["employees", "Employees"]
        ].map(([key, label]) => (
          <Button key={key} variant={tab === key ? "primary" : "secondary"} onClick={() => setTab(key as typeof tab)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "departments" && (
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <h2 className="font-bold">Department Form</h2>
            <div className="mt-4 grid gap-3">
              <Field label="Name">
                <Input placeholder="Facilities" />
              </Field>
              <Field label="Head">
                <Select>
                  {profiles.map((profile) => (
                    <option key={profile.id}>{profile.full_name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Parent">
                <Select>
                  <option>None</option>
                  {departments.map((department) => (
                    <option key={department.id}>{department.name}</option>
                  ))}
                </Select>
              </Field>
              <Button title="Save department">Save Department</Button>
            </div>
          </Card>
          <section className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Head</th>
                  <th>Parent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id}>
                    <td className="font-semibold">{department.name}</td>
                    <td>{profiles.find((profile) => profile.id === department.head_id)?.full_name ?? "Unassigned"}</td>
                    <td>{departments.find((parent) => parent.id === department.parent_department_id)?.name ?? "Root"}</td>
                    <td>
                      <Badge tone="success">{department.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {tab === "categories" && (
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <h2 className="font-bold">Category Form</h2>
            <div className="mt-4 grid gap-3">
              <Field label="Name">
                <Input placeholder="AV Equipment" />
              </Field>
              <Field label="Custom fields JSON">
                <Textarea defaultValue={'{ "warranty_months": "number" }'} />
              </Field>
              <Button title="Save category">Save Category</Button>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.id}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{category.name}</h3>
                  <Badge tone="success">{category.status}</Badge>
                </div>
                <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(category.custom_fields, null, 2)}</pre>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "employees" && (
        <section className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="font-semibold">{profile.full_name}</td>
                  <td>{profile.email}</td>
                  <td>{departments.find((department) => department.id === profile.department_id)?.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand" />
                      <select className="focus-ring rounded-md border border-border bg-white px-2 py-1 text-sm" defaultValue={profile.role}>
                        {Object.entries(roleLabels).map(([role, label]) => (
                          <option key={role} value={role as Role}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <Badge tone="success">{profile.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
