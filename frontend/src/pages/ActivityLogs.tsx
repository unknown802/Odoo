import { CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Field";
import { formatDate, statusTone } from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

export function ActivityLogs() {
  const currentUserId = useAssetFlowStore((state) => state.currentUserId);
  const currentRole = useAssetFlowStore((state) => state.currentRole);
  const notifications = useAssetFlowStore((state) => state.notifications);
  const markAllNotificationsRead = useAssetFlowStore((state) => state.markAllNotificationsRead);
  const activityLogs = useAssetFlowStore((state) => state.activityLogs);
  const profiles = useAssetFlowStore((state) => state.profiles);
  const [filter, setFilter] = useState("");

  const filteredLogs = useMemo(
    () => activityLogs.filter((log) => !filter || log.action.toLowerCase().includes(filter.toLowerCase())),
    [activityLogs, filter]
  );
  const canViewLogs = currentRole === "Admin" || currentRole === "Asset_Manager";

  return (
    <div className={`grid gap-5 ${canViewLogs ? "xl:grid-cols-[0.8fr_1.2fr]" : ""}`}>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">Notifications</h2>
          <Button variant="secondary" onClick={markAllNotificationsRead} title="Mark all read">
            <CheckCheck className="h-4 w-4" /> Mark All
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {notifications
            .filter((notification) => notification.user_id === currentUserId || currentUserId === "user-admin")
            .map((notification) => (
              <article key={notification.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{notification.title}</div>
                    <div className="mt-1 text-sm text-muted">{notification.message}</div>
                  </div>
                  <Badge tone={notification.is_read ? "neutral" : "info"}>{notification.is_read ? "Read" : "Unread"}</Badge>
                </div>
              </article>
            ))}
        </div>
      </Card>

      {canViewLogs && (
        <section className="grid gap-4 content-start">
          <Card>
            <Field label="Filter action">
              <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="maintenance, transfer, booking" />
            </Field>
          </Card>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{profiles.find((profile) => profile.id === log.user_id)?.full_name}</td>
                    <td>
                      <Badge tone={statusTone(log.action)}>{log.action}</Badge>
                    </td>
                    <td>{log.entity_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
