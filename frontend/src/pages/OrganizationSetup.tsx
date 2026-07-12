import {
  Building2,
  CheckCircle2,
  Grid3X3,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Field";
import { roleLabels } from "../lib/constants";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { Role } from "../types";

type Tab = "departments" | "categories" | "employees";

type CustomField = {
  id: number;
  name: string;
  type: string;
};

export function OrganizationSetup() {
  const [tab, setTab] = useState<Tab>("departments");
  const [message, setMessage] = useState("");

  // Department form
  const [departmentName, setDepartmentName] = useState("");
  const [departmentHead, setDepartmentHead] = useState("");
  const [departmentParent, setDepartmentParent] = useState("");

  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([
    {
      id: 1,
      name: "warranty_months",
      type: "number"
    }
  ]);

  // Employee form
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [employeeRole, setEmployeeRole] = useState<Role>("Employee");

  // Employee filters
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Store data
  const departments = useAssetFlowStore((state) => state.departments);
  const categories = useAssetFlowStore((state) => state.categories);
  const profiles = useAssetFlowStore((state) => state.profiles);

  // Store actions
  const createDepartment = useAssetFlowStore(
    (state) => state.createDepartment
  );

  const createCategory = useAssetFlowStore(
    (state) => state.createCategory
  );

  const createEmployee = useAssetFlowStore(
    (state) => state.createEmployee
  );

  const updateEmployeeRole = useAssetFlowStore(
    (state) => state.updateEmployeeRole
  );

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // -------------------------
  // DEPARTMENT
  // -------------------------

  const handleCreateDepartment = () => {
    if (!departmentName.trim()) {
      showMessage("Please enter a department name.");
      return;
    }

    const result = createDepartment({
      name: departmentName.trim(),
      head_id: departmentHead || null,
      parent_department_id: departmentParent || null
    });

    showMessage(result.message);

    if (result.ok) {
      setDepartmentName("");
      setDepartmentHead("");
      setDepartmentParent("");
    }
  };

  // -------------------------
  // CATEGORY
  // -------------------------

  const addCustomField = () => {
    setCustomFields((current) => [
      ...current,
      {
        id: Date.now(),
        name: "",
        type: "text"
      }
    ]);
  };

  const updateCustomField = (
    id: number,
    key: "name" | "type",
    value: string
  ) => {
    setCustomFields((current) =>
      current.map((field) =>
        field.id === id
          ? {
              ...field,
              [key]: value
            }
          : field
      )
    );
  };

  const removeCustomField = (id: number) => {
    setCustomFields((current) =>
      current.filter((field) => field.id !== id)
    );
  };

  const handleCreateCategory = () => {
    if (!categoryName.trim()) {
      showMessage("Please enter a category name.");
      return;
    }

    const fields = customFields.reduce<Record<string, string>>(
      (result, field) => {
        const fieldName = field.name.trim();

        if (fieldName) {
          result[fieldName] = field.type;
        }

        return result;
      },
      {}
    );

    const result = createCategory({
      name: categoryName.trim(),
      custom_fields: fields
    });

    showMessage(result.message);

    if (result.ok) {
      setCategoryName("");

      setCustomFields([
        {
          id: Date.now(),
          name: "",
          type: "text"
        }
      ]);
    }
  };

  // -------------------------
  // EMPLOYEE
  // -------------------------

  const handleCreateEmployee = () => {
    if (!employeeName.trim()) {
      showMessage("Please enter the employee name.");
      return;
    }

    if (!employeeEmail.trim()) {
      showMessage("Please enter the employee email.");
      return;
    }

    const result = createEmployee({
      full_name: employeeName.trim(),
      email: employeeEmail.trim(),
      role: employeeRole,
      department_id: employeeDepartment || null
    });

    showMessage(result.message);

    if (result.ok) {
      setEmployeeName("");
      setEmployeeEmail("");
      setEmployeeDepartment("");
      setEmployeeRole("Employee");
      setShowEmployeeForm(false);
    }
  };

  const handleRoleChange = (
    profileId: string,
    role: Role
  ) => {
    const result = updateEmployeeRole(profileId, role);
    showMessage(result.message);
  };

  // -------------------------
  // FILTERING
  // -------------------------

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const departmentName =
        departments.find(
          (department) =>
            department.id === profile.department_id
        )?.name ?? "";

      const matchesSearch =
        !query ||
        profile.full_name.toLowerCase().includes(query) ||
        profile.email.toLowerCase().includes(query) ||
        departmentName.toLowerCase().includes(query);

      const matchesDepartment =
        departmentFilter === "all" ||
        profile.department_id === departmentFilter;

      const matchesRole =
        roleFilter === "all" ||
        profile.role === roleFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesRole
      );
    });
  }, [
    profiles,
    departments,
    search,
    departmentFilter,
    roleFilter
  ]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const activeEmployees = profiles.filter(
    (profile) => profile.status === "Active"
  ).length;

  const tabItems: {
    key: Tab;
    label: string;
    count: number;
  }[] = [
    {
      key: "departments",
      label: "Departments",
      count: departments.length
    },
    {
      key: "categories",
      label: "Categories",
      count: categories.length
    },
    {
      key: "employees",
      label: "Employees",
      count: profiles.length
    }
  ];

  return (
    <div className="grid gap-5">
      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Departments
              </p>

              <p className="mt-1 text-2xl font-bold">
                {departments.length}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-brand">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Asset Categories
              </p>

              <p className="mt-1 text-2xl font-bold">
                {categories.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Grid3X3 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Employees
              </p>

              <p className="mt-1 text-2xl font-bold">
                {profiles.length}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Active Employees
              </p>

              <p className="mt-1 text-2xl font-bold">
                {activeEmployees}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* TABS */}

      <div className="flex flex-wrap gap-2">
        {tabItems.map((item) => (
          <Button
            key={item.key}
            variant={
              tab === item.key
                ? "primary"
                : "secondary"
            }
            onClick={() => setTab(item.key)}
          >
            {item.label} ({item.count})
          </Button>
        ))}
      </div>

      {/* ========================= */}
      {/* DEPARTMENTS */}
      {/* ========================= */}

      {tab === "departments" && (
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-brand">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">
                  Create Department
                </h2>

                <p className="text-sm text-slate-500">
                  Build and manage your organization structure.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Department Name">
                <Input
                  value={departmentName}
                  onChange={(event) =>
                    setDepartmentName(
                      event.target.value
                    )
                  }
                  placeholder="Example: Facilities"
                />
              </Field>

              <Field label="Department Head">
                <Select
                  value={departmentHead}
                  onChange={(event) =>
                    setDepartmentHead(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Unassigned
                  </option>

                  {profiles.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.full_name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Parent Department">
                <Select
                  value={departmentParent}
                  onChange={(event) =>
                    setDepartmentParent(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    None — Root Department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    )
                  )}
                </Select>
              </Field>

              <Button
                title="Save department"
                onClick={
                  handleCreateDepartment
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Department
              </Button>
            </div>
          </Card>

          <section className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Head</th>
                  <th>Parent</th>
                  <th>Members</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {departments.map(
                  (department) => {
                    const memberCount =
                      profiles.filter(
                        (profile) =>
                          profile.department_id ===
                          department.id
                      ).length;

                    const head =
                      profiles.find(
                        (profile) =>
                          profile.id ===
                          department.head_id
                      );

                    const parent =
                      departments.find(
                        (candidate) =>
                          candidate.id ===
                          department.parent_department_id
                      );

                    return (
                      <tr
                        key={department.id}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-100 p-2">
                              <Building2 className="h-4 w-4 text-slate-600" />
                            </div>

                            <span className="font-semibold">
                              {
                                department.name
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {head?.full_name ??
                            "Unassigned"}
                        </td>

                        <td>
                          {parent?.name ??
                            "Root"}
                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            {memberCount}
                          </div>
                        </td>

                        <td>
                          <Badge
                            tone={
                              department.status ===
                              "Active"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {
                              department.status
                            }
                          </Badge>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* ========================= */}
      {/* CATEGORIES */}
      {/* ========================= */}

      {tab === "categories" && (
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Grid3X3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">
                  Create Asset Category
                </h2>

                <p className="text-sm text-slate-500">
                  Build custom category fields without writing JSON.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Category Name">
                <Input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  placeholder="Example: AV Equipment"
                />
              </Field>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Custom Fields
                    </p>

                    <p className="text-xs text-slate-500">
                      Add the information required for assets in this category.
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={addCustomField}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                <div className="grid gap-3">
                  {customFields.map(
                    (field, index) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-border bg-slate-50 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Field {index + 1}
                          </span>

                          <button
                            type="button"
                            title="Remove field"
                            onClick={() =>
                              removeCustomField(
                                field.id
                              )
                            }
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                          <Input
                            value={
                              field.name
                            }
                            onChange={(
                              event
                            ) =>
                              updateCustomField(
                                field.id,
                                "name",
                                event.target
                                  .value
                              )
                            }
                            placeholder="Example: warranty_months"
                          />

                          <Select
                            value={
                              field.type
                            }
                            onChange={(
                              event
                            ) =>
                              updateCustomField(
                                field.id,
                                "type",
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="text">
                              Text
                            </option>

                            <option value="number">
                              Number
                            </option>

                            <option value="date">
                              Date
                            </option>

                            <option value="boolean">
                              Yes / No
                            </option>
                          </Select>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <Button
                title="Save category"
                onClick={
                  handleCreateCategory
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {categories.map(
              (category) => {
                const fields =
                  Object.entries(
                    category.custom_fields
                  );

                return (
                  <Card key={category.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {fields.length} custom{" "}
                          {fields.length === 1
                            ? "field"
                            : "fields"}
                        </p>
                      </div>

                      <Badge
                        tone={
                          category.status ===
                          "Active"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {category.status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {fields.length > 0 ? (
                        fields.map(
                          ([name, type]) => (
                            <div
                              key={name}
                              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 px-3 py-2.5"
                            >
                              <span className="text-sm font-medium">
                                {
                                  name
  .replace(/_/g, " ")
  .replace(/\b\w/g, (letter: string) =>
    letter.toUpperCase()
                                  )}
                              </span>

                              <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-500">
                                {type}
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-slate-500">
                          No custom fields configured.
                        </div>
                      )}
                    </div>
                  </Card>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* EMPLOYEES */}
      {/* ========================= */}

      {tab === "employees" && (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Employee Directory
              </h2>

              <p className="text-sm text-slate-500">
                Search employees, manage departments and update access roles.
              </p>
            </div>

            <Button
              onClick={() =>
                setShowEmployeeForm(
                  (current) => !current
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />

              {showEmployeeForm
                ? "Close Form"
                : "Add Employee"}
            </Button>
          </div>

          {showEmployeeForm && (
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold">
                    Add New Employee
                  </h3>

                  <p className="text-sm text-slate-500">
                    Create a new employee profile and assign organization access.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Full Name">
                  <Input
                    value={employeeName}
                    onChange={(event) =>
                      setEmployeeName(
                        event.target.value
                      )
                    }
                    placeholder="Employee name"
                  />
                </Field>

                <Field label="Email">
                  <Input
                    value={employeeEmail}
                    onChange={(event) =>
                      setEmployeeEmail(
                        event.target.value
                      )
                    }
                    placeholder="name@company.com"
                  />
                </Field>

                <Field label="Department">
                  <Select
                    value={
                      employeeDepartment
                    }
                    onChange={(event) =>
                      setEmployeeDepartment(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>
                      )
                    )}
                  </Select>
                </Field>

                <Field label="Role">
                  <Select
                    value={employeeRole}
                    onChange={(event) =>
                      setEmployeeRole(
                        event.target
                          .value as Role
                      )
                    }
                  >
                    {Object.entries(
                      roleLabels
                    ).map(
                      ([role, label]) => (
                        <option
                          key={role}
                          value={role}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </Select>
                </Field>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={
                    handleCreateEmployee
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </Card>
          )}

          {/* SEARCH AND FILTERS */}

          <Card>
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_200px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by name, email or department..."
                  className="focus-ring w-full rounded-md border border-border bg-white py-2 pl-10 pr-3 text-sm"
                />
              </div>

              <Select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Departments
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  )
                )}
              </Select>

              <Select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Roles
                </option>

                {Object.entries(
                  roleLabels
                ).map(
                  ([role, label]) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {label}
                    </option>
                  )
                )}
              </Select>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Showing {filteredProfiles.length} of{" "}
              {profiles.length} employees
            </p>
          </Card>

          {/* EMPLOYEE TABLE */}

          <section className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredProfiles.map(
                  (profile) => {
                    const department =
                      departments.find(
                        (item) =>
                          item.id ===
                          profile.department_id
                      );

                    return (
                      <tr key={profile.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-brand">
                              {getInitials(
                                profile.full_name
                              )}
                            </div>

                            <div>
                              <p className="font-semibold">
                                {
                                  profile.full_name
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                Employee
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          {profile.email}
                        </td>

                        <td>
                          {department?.name ??
                            "Unassigned"}
                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />

                            <select
                              className="focus-ring rounded-md border border-border bg-white px-2 py-1.5 text-sm"
                              value={
                                profile.role
                              }
                              onChange={(
                                event
                              ) =>
                                handleRoleChange(
                                  profile.id,
                                  event.target
                                    .value as Role
                                )
                              }
                            >
                              {Object.entries(
                                roleLabels
                              ).map(
                                ([
                                  role,
                                  label
                                ]) => (
                                  <option
                                    key={
                                      role
                                    }
                                    value={
                                      role
                                    }
                                  >
                                    {
                                      label
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </td>

                        <td>
                          <Badge
                            tone={
                              profile.status ===
                              "Active"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {profile.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  }
                )}

                {filteredProfiles.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center"
                    >
                      <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />

                      <p className="font-medium text-slate-600">
                        No employees found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}