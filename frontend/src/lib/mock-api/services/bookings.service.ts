// @ts-nocheck
import { repo } from "../repository";
import type { Booking } from "../../../types";
import { isOverlapping } from "../../utils";

export const bookingsService = {
  getAll: () => {
    const data = repo.get("bookings");
    data.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return data;
  },

  create: (userId: string, data: Partial<Booking>) => {
    return repo.transaction((db) => {
      const asset = db.assets.find(a => a.id === data.resource_id);
      if (!asset || !asset.is_bookable) throw new Error("Resource is not bookable");

      const conflicts = db.bookings.filter((b: any) => 
        b.resource_id === data.resource_id && 
        b.status !== "Cancelled" &&
        isOverlapping(b.start_time, b.end_time, data.start_time!, data.end_time!)
      );

      if (conflicts.length > 0) {
        throw new Error("Time slot conflicts with an existing booking");
      }

      const profile = db.profiles.find(p => p.id === userId);

      const booking = {
        ...data,
        id: `book-${Math.random().toString(36).substring(2, 10)}`,
        booked_by_id: userId,
        department_id: profile?.department_id,
        status: "Upcoming"
      };
      db.bookings.unshift(booking);

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Resource booked",
        entity_type: "booking",
        entity_id: booking.id,
        details: { resource: asset.name },
        created_at: new Date().toISOString()
      });

      return booking;
    });
  },

  update: (userId: string, id: string, data: Partial<Booking>) => {
    return repo.transaction((db) => {
      const booking = db.bookings.find(b => b.id === id);
      if (!booking) throw new Error("Booking not found");

      if (data.start_time || data.end_time || data.resource_id) {
        const resourceId = data.resource_id || booking.resource_id;
        const start = data.start_time || booking.start_time;
        const end = data.end_time || booking.end_time;

        const conflicts = db.bookings.filter((b: any) => 
          b.id !== id &&
          b.resource_id === resourceId && 
          b.status !== "Cancelled" &&
          isOverlapping(b.start_time, b.end_time, start, end)
        );

        if (conflicts.length > 0) throw new Error("Time slot conflicts with an existing booking");
      }

      Object.assign(booking, data);
      return booking;
    });
  },

  cancel: (userId: string, id: string) => {
    return repo.transaction((db) => {
      const booking = db.bookings.find(b => b.id === id);
      if (!booking) throw new Error("Booking not found");
      
      booking.status = "Cancelled";

      db.activityLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 10)}`,
        user_id: userId,
        action: "Booking cancelled",
        entity_type: "booking",
        entity_id: booking.id,
        details: {},
        created_at: new Date().toISOString()
      });
    });
  }
};
