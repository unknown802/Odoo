import { z } from "zod";

const uuid = z.string().uuid();
const optionalUuid = uuid.optional().nullable();

export const createAssetSchema = z.object({
  name: z.string().min(2),
  category_id: uuid,
  serial_number: z.string().optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.coerce.number().nonnegative().optional(),
  condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]).default("Good"),
  location: z.string().optional(),
  is_bookable: z.boolean().default(false),
  current_department_id: optionalUuid,
  photos: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([])
});

export const createAllocationSchema = z.object({
  asset_id: uuid,
  allocated_to_id: optionalUuid,
  allocated_to_department_id: optionalUuid,
  expected_return_date: z.string().optional()
});

export const returnAllocationSchema = z.object({
  return_condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]),
  return_notes: z.string().optional()
});

export const createBookingSchema = z
  .object({
    resource_id: uuid,
    department_id: optionalUuid,
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    purpose: z.string().min(2).optional()
  })
  .refine((value) => new Date(value.end_time) > new Date(value.start_time), {
    message: "end_time must be after start_time",
    path: ["end_time"]
  });

export const createMaintenanceSchema = z.object({
  asset_id: uuid,
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  photos: z.array(z.string()).default([])
});

export const resolveMaintenanceSchema = z.object({
  resolution_notes: z.string().min(2),
  cost: z.coerce.number().nonnegative().optional()
});

export const createTransferSchema = z.object({
  asset_id: uuid,
  from_holder_id: optionalUuid,
  to_holder_id: uuid,
  notes: z.string().optional()
});

export const createAuditCycleSchema = z.object({
  title: z.string().min(3),
  scope_department_id: optionalUuid,
  scope_location: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  auditor_ids: z.array(uuid).default([])
});

export const updateAuditItemSchema = z.object({
  status: z.enum(["Pending", "Verified", "Missing", "Damaged"]),
  notes: z.string().optional()
});

export const idParamsSchema = z.object({
  id: uuid
});

export const auditItemParamsSchema = z.object({
  id: uuid,
  itemId: uuid
});
