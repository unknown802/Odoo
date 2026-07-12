import type {
  ActivityLog,
  Allocation,
  Asset,
  AssetCategory,
  AuditCycle,
  Booking,
  Department,
  MaintenanceRequest,
  NotificationItem,
  Profile,
  TransferRequest
} from "../../types";

const now = new Date();
const msPerDay = 24 * 60 * 60 * 1000;

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateId(prefix: string, index: number) {
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

export function generateSeedData() {
  const departments: Department[] = [
    { id: "dept-0001", name: "Engineering", head_id: "prof-0001", status: "Active" },
    { id: "dept-0002", name: "Operations", head_id: "prof-0002", status: "Active" },
    { id: "dept-0003", name: "Sales", head_id: "prof-0003", status: "Active" },
    { id: "dept-0004", name: "Human Resources", head_id: "prof-0004", status: "Active" },
    { id: "dept-0005", name: "Finance", head_id: "prof-0005", status: "Active" },
    { id: "dept-0006", name: "IT Services", head_id: "prof-0006", parent_department_id: "dept-0001", status: "Active" },
    { id: "dept-0007", name: "Marketing", head_id: "prof-0007", status: "Active" },
    { id: "dept-0008", name: "Product", head_id: "prof-0008", parent_department_id: "dept-0001", status: "Active" },
  ];

  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona", "George", "Hannah", "Ian", "Jane", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Sam", "Tina"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
  const profiles: Profile[] = [];
  
  for (let i = 1; i <= 30; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    profiles.push({
      id: generateId("prof", i),
      full_name: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@assetflow.local`,
      role: i === 1 ? "Admin" : i <= 3 ? "Asset_Manager" : i <= 8 ? "Department_Head" : "Employee",
      department_id: departments[i % departments.length].id,
      status: "Active"
    });
  }
  // Ensure the Admin (the one we log in as) is always the first profile for the mock org/me
  profiles[0].id = "user-admin";
  profiles[0].full_name = "Admin User";
  profiles[0].role = "Admin";
  departments[0].head_id = "user-admin";

  const categories: AssetCategory[] = [
    { id: "cat-0001", name: "Laptops", custom_fields: { "ram_gb": "number", "cpu": "string" }, status: "Active" },
    { id: "cat-0002", name: "Monitors", custom_fields: { "resolution": "string", "size_inches": "number" }, status: "Active" },
    { id: "cat-0003", name: "Mobile Devices", custom_fields: { "os": "string", "imei": "string" }, status: "Active" },
    { id: "cat-0004", name: "Meeting Rooms", custom_fields: { "capacity": "number", "has_video": "boolean" }, status: "Active" },
    { id: "cat-0005", name: "Vehicles", custom_fields: { "license_plate": "string", "make": "string" }, status: "Active" },
    { id: "cat-0006", name: "Lab Equipment", custom_fields: { "last_calibration": "date" }, status: "Active" },
  ];

  const laptopModels = ["MacBook Pro 16", "MacBook Air M2", "ThinkPad T14", "Dell XPS 15", "Surface Laptop 5"];
  const monitorModels = ["Dell UltraSharp 27", "LG 34 UltraWide", "Samsung Odyssey", "Apple Studio Display"];
  
  const assets: Asset[] = [];
  for (let i = 1; i <= 100; i++) {
    const catIndex = i % categories.length;
    const cat = categories[catIndex];
    let name = `Asset ${i}`;
    let isBookable = false;
    
    if (cat.name === "Laptops") name = laptopModels[i % laptopModels.length];
    if (cat.name === "Monitors") name = monitorModels[i % monitorModels.length];
    if (cat.name === "Meeting Rooms") { name = `Conference Room ${i}`; isBookable = true; }
    if (cat.name === "Vehicles") { name = `Company Car ${i}`; isBookable = true; }
    if (cat.name === "Lab Equipment") name = `Microscope ${i}`;

    const date = randomDate(new Date(2022, 0, 1), new Date(2025, 11, 31));

    assets.push({
      id: generateId("asset", i),
      name,
      category_id: cat.id,
      asset_tag: `AF-${String(i).padStart(4, "0")}`,
      serial_number: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      acquisition_date: date.toISOString().slice(0, 10),
      acquisition_cost: Math.floor(Math.random() * 3000) + 500,
      condition: ["New", "Good", "Fair", "Poor", "Damaged"][Math.floor(Math.random() * 5)] as Asset["condition"],
      location: ["HQ Floor 1", "HQ Floor 2", "Remote", "Warehouse A", "Lab B"][Math.floor(Math.random() * 5)],
      status: "Available", // Will be updated by allocations/maintenance below
      is_bookable: isBookable,
      current_holder_id: null,
      current_department_id: departments[Math.floor(Math.random() * departments.length)].id,
      photos: [],
      documents: [],
      created_at: date.toISOString()
    });
  }

  const allocations: Allocation[] = [];
  const activityLogs: ActivityLog[] = [];
  let logId = 1;

  // Generate Allocations
  for (let i = 1; i <= 60; i++) {
    const asset = assets[i]; // First 60 assets get allocated
    if (asset.is_bookable) continue;

    const profile = profiles[i % profiles.length];
    const isHistorical = i % 3 === 0; // 1/3rd are historical (returned)
    const allocStart = randomDate(new Date(now.getTime() - 90 * msPerDay), new Date(now.getTime() - 10 * msPerDay));
    const expectedReturn = new Date(allocStart.getTime() + 60 * msPerDay);
    
    const allocation: Allocation = {
      id: generateId("alloc", i),
      asset_id: asset.id,
      allocated_to_id: profile.id,
      allocated_to_department_id: profile.department_id,
      allocated_by_id: profiles[0].id,
      allocated_at: allocStart.toISOString(),
      expected_return_date: expectedReturn.toISOString().slice(0, 10),
      returned_at: isHistorical ? randomDate(allocStart, now).toISOString() : null,
      status: isHistorical ? "Returned" : "Active"
    };
    
    allocations.push(allocation);

    if (!isHistorical) {
      asset.status = "Allocated";
      asset.current_holder_id = profile.id;
    }

    activityLogs.push({
      id: generateId("log", logId++),
      user_id: profiles[0].id,
      action: "Asset Allocated",
      entity_type: "asset",
      entity_id: asset.id,
      details: { to: profile.full_name },
      created_at: allocStart.toISOString()
    });
  }

  // Generate Maintenance
  const maintenanceRequests: MaintenanceRequest[] = [];
  for (let i = 1; i <= 20; i++) {
    const asset = assets[99 - i]; // Last 20 assets
    const reqStart = randomDate(new Date(now.getTime() - 30 * msPerDay), now);
    const isResolved = i % 2 === 0;

    const req: MaintenanceRequest = {
      id: generateId("maint", i),
      asset_id: asset.id,
      requested_by_id: profiles[i % profiles.length].id,
      approved_by_id: profiles[0].id,
      title: `Issue with ${asset.name}`,
      description: "Needs routine checkup or repair due to wear and tear.",
      priority: ["Low", "Medium", "High", "Critical"][i % 4] as MaintenanceRequest["priority"],
      photos: [],
      status: isResolved ? "Resolved" : (i % 3 === 0 ? "In_Progress" : "Pending"),
      requested_at: reqStart.toISOString()
    };
    maintenanceRequests.push(req);

    if (!isResolved) {
      asset.status = "Under_Maintenance";
      asset.current_holder_id = null; // Removed from holder if under maintenance
    }

    activityLogs.push({
      id: generateId("log", logId++),
      user_id: req.requested_by_id,
      action: "Maintenance Requested",
      entity_type: "maintenance_request",
      entity_id: req.id,
      details: { priority: req.priority },
      created_at: reqStart.toISOString()
    });
  }

  // Generate Bookings
  const bookings: Booking[] = [];
  const bookableAssets = assets.filter(a => a.is_bookable);
  for (let i = 1; i <= 30; i++) {
    const asset = bookableAssets[i % bookableAssets.length];
    if (!asset) continue;

    const bStart = randomDate(new Date(now.getTime() - 5 * msPerDay), new Date(now.getTime() + 10 * msPerDay));
    const bEnd = new Date(bStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    let status: Booking["status"] = "Upcoming";
    if (bStart < now && bEnd > now) status = "Ongoing";
    if (bEnd < now) status = "Completed";

    bookings.push({
      id: generateId("book", i),
      resource_id: asset.id,
      booked_by_id: profiles[i % profiles.length].id,
      department_id: profiles[i % profiles.length].department_id,
      start_time: bStart.toISOString(),
      end_time: bEnd.toISOString(),
      purpose: "Team Collaboration Session",
      status
    });
  }

  // Generate Audit Cycles
  const auditCycles: AuditCycle[] = [
    {
      id: generateId("audit", 1),
      title: "Q1 Global Inventory Audit",
      scope_department_id: undefined,
      scope_location: undefined,
      start_date: new Date(now.getTime() - 100 * msPerDay).toISOString().slice(0, 10),
      status: "Closed",
      created_by_id: "user-admin",
      auditor_ids: [profiles[1].id, profiles[2].id],
      items: assets.slice(0, 20).map(a => ({
        id: generateId("aitem", a.id as any), // dirty hack for seed
        audit_cycle_id: "audit-0001",
        asset_id: a.id,
        auditor_id: profiles[1].id,
        status: "Verified",
        notes: "All good"
      }))
    },
    {
      id: generateId("audit", 2),
      title: "Annual Q3 IT Hardware Audit",
      scope_department_id: departments[0].id,
      scope_location: "HQ Floor 1",
      start_date: now.toISOString().slice(0, 10),
      status: "In_Progress",
      created_by_id: "user-admin",
      auditor_ids: [profiles[3].id],
      items: assets.slice(20, 30).map((a, idx) => ({
        id: generateId("aitem", 1000 + idx),
        audit_cycle_id: "audit-0002",
        asset_id: a.id,
        auditor_id: profiles[3].id,
        status: idx % 4 === 0 ? "Pending" : (idx % 5 === 0 ? "Missing" : "Verified"),
        notes: ""
      }))
    }
  ];

  const notifications: NotificationItem[] = [
    {
      id: "notif-001",
      user_id: "user-admin",
      type: "Overdue_Return",
      title: "Overdue Asset",
      message: "Allocation alloc-0001 is overdue.",
      is_read: false,
      created_at: now.toISOString()
    }
  ];
  
  const transfers: TransferRequest[] = [];

  // Finally order activity logs chronologically
  activityLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    departments,
    profiles,
    categories,
    assets,
    allocations,
    maintenanceRequests,
    bookings,
    auditCycles,
    activityLogs,
    notifications,
    transfers
  };
}
