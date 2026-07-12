import { CalendarPlus, XCircle, Calendar, Clock, CheckCircle2, AlertCircle, Edit, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { StatsBar } from "../components/ui/StatsBar";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeleton";
import { DataTable } from "../components/ui/DataTable";
import { StatusPill } from "../components/ui/StatusPill";
import { formatTimeRange, isOverlapping } from "../lib/utils";
import { useAllAssets } from "../hooks/useAssets";
import { useBookings, useCreateBooking, useCancelBooking, useUpdateBooking } from "../hooks/useApi";
import type { Booking } from "../types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export function ResourceBooking() {
  const { data: assets = [], isLoading: loadingAssets } = useAllAssets();
  const { data: bookings = [], isLoading: loadingBookings } = useBookings();
  const createBookingMutation = useCreateBooking();
  const cancelBookingMutation = useCancelBooking();

  const resources = useMemo(() => assets.filter((a) => a.is_bookable), [assets]);
  
  const [resourceId, setResourceId] = useState("");
  // Default to today at noon
  const defaultStart = new Date();
  defaultStart.setHours(12, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(13, 0, 0, 0);

  const [start, setStart] = useState(defaultStart.toISOString().slice(0, 16));
  const [end, setEnd] = useState(defaultEnd.toISOString().slice(0, 16));
  const [purpose, setPurpose] = useState("Planning session");
  const [message, setMessage] = useState("");

  const updateBookingMutation = useUpdateBooking();
  const [editId, setEditId] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editResourceId, setEditResourceId] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const conflicts = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.resource_id === resourceId &&
          b.status !== "Cancelled" &&
          isOverlapping(b.start_time, b.end_time, new Date(start).toISOString(), new Date(end).toISOString())
      ),
    [bookings, end, resourceId, start]
  );

  const activeBookings = useMemo(() => bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing"), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter(b => b.status === "Cancelled"), [bookings]);

  const submit = async () => {
    if (!resourceId) { setMessage("Select a resource."); return; }
    try {
      await createBookingMutation.mutateAsync({
        resource_id: resourceId,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        purpose
      });
      setMessage("Booking confirmed.");
      setTimeout(() => setMessage(""), 3000);
      setPurpose("");
    } catch (e: any) {
      setMessage(e.message ?? "Booking failed.");
    }
  };

  const handleEditOpen = (booking: Booking) => {
    setEditId(booking.id);
    setEditStart(new Date(booking.start_time).toISOString().slice(0, 16));
    setEditEnd(new Date(booking.end_time).toISOString().slice(0, 16));
    setEditPurpose(booking.purpose || "");
    setEditResourceId(booking.resource_id);
    setEditMessage("");
  };

  const submitEdit = async () => {
    if (!editId) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: editId,
        resource_id: editResourceId,
        start_time: new Date(editStart).toISOString(),
        end_time: new Date(editEnd).toISOString(),
        purpose: editPurpose
      });
      setEditId("");
    } catch (e: any) {
      setEditMessage(e.message ?? "Update failed.");
    }
  };

  if (loadingAssets || loadingBookings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Resource Bookings" subtitle="Schedule and manage bookable assets." />
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <SkeletonCard />
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonTable rows={4} />
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Bookings", value: bookings.length, icon: Calendar, iconColor: "text-brand", iconBg: "bg-brand-muted", accentBorder: "border-t-brand" },
    { label: "Active", value: activeBookings.length, icon: CheckCircle2, iconColor: "text-success", iconBg: "bg-success-muted", accentBorder: "border-t-success" },
    { label: "Cancelled", value: cancelledBookings.length, icon: XCircle, iconColor: "text-neutral", iconBg: "bg-slate-100", accentBorder: "border-t-slate-300" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Resource Bookings" 
        subtitle="Schedule and manage bookable assets for your teams."
      />

      <StatsBar stats={stats} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"
      >
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col h-full p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted">
                <CalendarPlus className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">New Booking</h2>
                <p className="text-xs font-semibold text-muted">Reserve a shared resource</p>
              </div>
            </div>

            <div className="grid gap-4 flex-1 content-start">
              <Field label="Bookable Resource">
                <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="h-11">
                  <option value="">Select resource…</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>{resource.name} - {resource.location}</option>
                  ))}
                </Select>
              </Field>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start Time">
                  <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="h-11" />
                </Field>
                <Field label="End Time">
                  <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11" />
                </Field>
              </div>
              
              <Field label="Booking Purpose">
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What will this resource be used for?" className="min-h-[100px]" />
              </Field>
              
              {conflicts.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <Notice tone="danger" message={`Time slot conflicts with ${conflicts.length} existing booking(s).`} />
                </motion.div>
              )}

              {message && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <Notice tone={message.includes("conflict") || message.includes("failed") || message.includes("Select") ? "danger" : "success"} message={message} />
                </motion.div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <Button 
                  onClick={submit} 
                  title="Create booking" 
                  disabled={createBookingMutation.isPending || conflicts.length > 0}
                  className="w-full"
                >
                  <CalendarPlus className="h-4 w-4" /> {createBookingMutation.isPending ? "Confirming…" : "Confirm Booking"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-5 min-w-0">
          <Card className="flex flex-col p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <Clock className="h-5 w-5 text-brand" />
              <h3 className="text-base font-bold text-ink">Upcoming Schedule</h3>
            </div>
            
            {bookings.length === 0 ? (
              <EmptyState 
                icon={Calendar} 
                title="No upcoming bookings" 
                description="The schedule is clear. Book a resource to see it here."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").slice(0, 4).map((booking) => {
                  const resource = assets.find((a) => a.id === booking.resource_id);
                  return (
                    <div key={booking.id} className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-brand/30 transition-colors group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand"></div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink truncate">{resource?.name}</div>
                          <div className="mt-0.5 text-xs font-medium text-muted flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimeRange(booking.start_time, booking.end_time)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-ink bg-slate-50 p-2 rounded-md border border-border/50 truncate">
                        {booking.purpose}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-slate-50">
              <Calendar className="h-5 w-5 text-brand" />
              <h3 className="text-sm font-bold text-ink">All Bookings</h3>
            </div>
            
            <DataTable
              className="border-0 rounded-none shadow-none"
              isEmpty={bookings.length === 0}
              emptyState={
                <EmptyState 
                  icon={Calendar} 
                  title="No bookings found" 
                  description="There is no booking history available." 
                />
              }
            >
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-hover transition-colors">
                    <td>
                      <div className="font-medium text-ink">{assets.find((a) => a.id === booking.resource_id)?.name}</div>
                      <div className="text-xs text-muted mt-0.5 max-w-[200px] truncate">{booking.purpose}</div>
                    </td>
                    <td>
                      <div className="text-sm">{formatTimeRange(booking.start_time, booking.end_time)}</div>
                    </td>
                    <td>
                      <StatusPill status={booking.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        {booking.status !== "Cancelled" && (
                          <Button 
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted hover:bg-brand-muted hover:text-brand"
                            onClick={() => handleEditOpen(booking)}
                            title="Reschedule booking"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted hover:bg-danger-muted hover:text-danger"
                          onClick={() => cancelBookingMutation.mutate(booking.id)}
                          disabled={booking.status === "Cancelled" || cancelBookingMutation.isPending}
                          title="Cancel booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog 
        open={!!editId} 
        onClose={() => setEditId("")} 
        title="Reschedule Booking"
      >
        <div className="grid gap-4">
          <Field label="Bookable Resource">
            <Select value={editResourceId} onChange={(e) => setEditResourceId(e.target.value)} className="h-11">
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>{resource.name} - {resource.location}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Time"><Input type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)} /></Field>
            <Field label="End Time"><Input type="datetime-local" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} /></Field>
          </div>
          <Field label="Purpose">
            <Textarea value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} className="min-h-[80px]" />
          </Field>
          
          {editMessage && <Notice tone="danger" message={editMessage} />}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="ghost" onClick={() => setEditId("")}>Cancel</Button>
            <Button onClick={submitEdit} disabled={updateBookingMutation.isPending}>Save Changes</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
