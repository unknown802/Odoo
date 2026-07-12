import { CalendarPlus, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { formatTimeRange, isOverlapping, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

export function ResourceBooking() {
  const assets = useAssetFlowStore((state) => state.assets);
  const bookings = useAssetFlowStore((state) => state.bookings);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const createBooking = useAssetFlowStore((state) => state.createBooking);
  const cancelBooking = useAssetFlowStore((state) => state.cancelBooking);
  const resources = assets.filter((asset) => asset.is_bookable);
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const [start, setStart] = useState("2026-07-12T12:00");
  const [end, setEnd] = useState("2026-07-12T13:00");
  const [purpose, setPurpose] = useState("Planning session");
  const [message, setMessage] = useState("");

  const conflicts = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.resource_id === resourceId &&
          booking.status !== "Cancelled" &&
          isOverlapping(booking.start_time, booking.end_time, new Date(start).toISOString(), new Date(end).toISOString())
      ),
    [bookings, end, resourceId, start]
  );

  const submit = () => {
    const result = createBooking({
      resource_id: resourceId,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      purpose
    });
    setMessage(result.message);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
      <Card>
        <h2 className="font-bold">Book Resource</h2>
        <div className="mt-4 grid gap-3">
          <Field label="Resource">
            <Select value={resourceId} onChange={(event) => setResourceId(event.target.value)}>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} - {resource.location}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start">
              <Input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
            </Field>
            <Field label="End">
              <Input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
            </Field>
          </div>
          <Field label="Purpose">
            <Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} />
          </Field>
          {conflicts.length > 0 && <Notice tone="warning" message={`Conflicts with ${conflicts.length} existing booking.`} />}
          <Button onClick={submit} title="Create booking">
            <CalendarPlus className="h-4 w-4" /> Confirm Booking
          </Button>
          {message && <Notice tone={message.includes("conflict") ? "warning" : "success"} message={message} />}
        </div>
      </Card>

      <div className="grid gap-5">
        <section className="rounded-md border border-border bg-white p-4">
          <h2 className="font-bold">Calendar</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {bookings.map((booking) => {
              const resource = assets.find((asset) => asset.id === booking.resource_id);
              const booker = profiles.find((profile) => profile.id === booking.booked_by_id);
              return (
                <div key={booking.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{resource?.name}</div>
                      <div className="mt-1 text-sm text-muted">{formatTimeRange(booking.start_time, booking.end_time)}</div>
                    </div>
                    <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                  </div>
                  <div className="mt-3 text-sm">{booking.purpose}</div>
                  <div className="mt-1 text-xs text-muted">Booked by {booker?.full_name}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="table-shell">
          <table>
            <thead>
              <tr>
                <th>My Bookings</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{assets.find((asset) => asset.id === booking.resource_id)?.name}</td>
                  <td>{formatTimeRange(booking.start_time, booking.end_time)}</td>
                  <td>
                    <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                  </td>
                  <td>
                    <Button variant="ghost" onClick={() => cancelBooking(booking.id)} title="Cancel booking">
                      <XCircle className="h-4 w-4" /> Cancel
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
