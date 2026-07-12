import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Users,
  X,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  Field,
  Input,
  Select,
  Textarea
} from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import {
  formatTimeRange,
  isOverlapping,
  statusTone
} from "../lib/utils";
import { useAssetFlowStore } from "../store/assetFlowStore";

type CalendarView = "day" | "week" | "month";

const DAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset();

  const local = new Date(
    date.getTime() - offset * 60 * 1000
  );

  return local.toISOString().slice(0, 16);
}

function getDefaultStart() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);

  return toLocalDateTimeInput(date);
}

function getDefaultEnd() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 2);

  return toLocalDateTimeInput(date);
}

function startOfWeek(date: Date) {
  const next = new Date(date);

  next.setDate(
    next.getDate() - next.getDay()
  );

  next.setHours(0, 0, 0, 0);

  return next;
}

function sameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

export function ResourceBooking() {
  const assets = useAssetFlowStore(
    (state) => state.assets
  );

  const bookings = useAssetFlowStore(
    (state) => state.bookings
  );

  const profiles = useAssetFlowStore(
    (state) => state.profiles
  );

  const currentUserId = useAssetFlowStore(
    (state) => state.currentUserId
  );

  const createBooking = useAssetFlowStore(
    (state) => state.createBooking
  );

  const cancelBooking = useAssetFlowStore(
    (state) => state.cancelBooking
  );

  const resources = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.is_bookable &&
          ![
            "Under_Maintenance",
            "Lost",
            "Retired",
            "Disposed"
          ].includes(asset.status)
      ),
    [assets]
  );

  const [calendarView, setCalendarView] =
    useState<CalendarView>("week");

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [bookingPanelOpen, setBookingPanelOpen] =
    useState(false);

  const [resourceId, setResourceId] =
    useState(resources[0]?.id ?? "");

  const [start, setStart] =
    useState(getDefaultStart());

  const [end, setEnd] =
    useState(getDefaultEnd());

  const [purpose, setPurpose] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageTone, setMessageTone] =
    useState<"success" | "warning">(
      "success"
    );

  const [search, setSearch] =
    useState("");

  const [resourceFilter, setResourceFilter] =
    useState("All");

  const [bookingScope, setBookingScope] =
    useState<"all" | "mine">("all");

  const weekDays = useMemo(() => {
    const firstDay =
      startOfWeek(currentDate);

    return Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(firstDay);

        date.setDate(
          firstDay.getDate() + index
        );

        return date;
      }
    );
  }, [currentDate]);

  const conflicts = useMemo(() => {
    if (
      !resourceId ||
      !start ||
      !end
    ) {
      return [];
    }

    const startDate =
      new Date(start);

    const endDate =
      new Date(end);

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      ) ||
      endDate <= startDate
    ) {
      return [];
    }

    return bookings.filter(
      (booking) =>
        booking.resource_id ===
          resourceId &&
        booking.status !==
          "Cancelled" &&
        isOverlapping(
          booking.start_time,
          booking.end_time,
          startDate.toISOString(),
          endDate.toISOString()
        )
    );
  }, [
    bookings,
    resourceId,
    start,
    end
  ]);

  const visibleBookings =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return bookings.filter(
        (booking) => {
          const resource =
            assets.find(
              (asset) =>
                asset.id ===
                booking.resource_id
            );

          const booker =
            profiles.find(
              (profile) =>
                profile.id ===
                booking.booked_by_id
            );

          const matchesSearch =
            !query ||
            [
              resource?.name ?? "",
              resource?.location ?? "",
              booking.purpose ?? "",
              booker?.full_name ?? ""
            ].some((value) =>
              value
                .toLowerCase()
                .includes(query)
            );

          const matchesResource =
            resourceFilter === "All" ||
            booking.resource_id ===
              resourceFilter;

          const matchesScope =
            bookingScope === "all" ||
            booking.booked_by_id ===
              currentUserId;

          return (
            matchesSearch &&
            matchesResource &&
            matchesScope
          );
        }
      );
    }, [
      assets,
      bookingScope,
      bookings,
      currentUserId,
      profiles,
      resourceFilter,
      search
    ]);

  const activeBookings =
    visibleBookings.filter(
      (booking) =>
        booking.status !==
        "Cancelled"
    );

  const upcomingBookings =
    visibleBookings
      .filter(
        (booking) =>
          booking.status ===
            "Upcoming" &&
          new Date(
            booking.end_time
          ).getTime() >=
            Date.now()
      )
      .sort(
        (first, second) =>
          new Date(
            first.start_time
          ).getTime() -
          new Date(
            second.start_time
          ).getTime()
      );

  const todayBookings =
    activeBookings.filter(
      (booking) =>
        sameDay(
          new Date(
            booking.start_time
          ),
          new Date()
        )
    ).length;

  const navigatePrevious = () => {
    const next =
      new Date(currentDate);

    if (calendarView === "day") {
      next.setDate(
        next.getDate() - 1
      );
    } else if (
      calendarView === "week"
    ) {
      next.setDate(
        next.getDate() - 7
      );
    } else {
      next.setMonth(
        next.getMonth() - 1
      );
    }

    setCurrentDate(next);
  };

  const navigateNext = () => {
    const next =
      new Date(currentDate);

    if (calendarView === "day") {
      next.setDate(
        next.getDate() + 1
      );
    } else if (
      calendarView === "week"
    ) {
      next.setDate(
        next.getDate() + 7
      );
    } else {
      next.setMonth(
        next.getMonth() + 1
      );
    }

    setCurrentDate(next);
  };

  const openBookingPanel = (
    date?: Date
  ) => {
    if (date) {
      const startDate =
        new Date(date);

      startDate.setHours(
        10,
        0,
        0,
        0
      );

      const endDate =
        new Date(date);

      endDate.setHours(
        11,
        0,
        0,
        0
      );

      setStart(
        toLocalDateTimeInput(
          startDate
        )
      );

      setEnd(
        toLocalDateTimeInput(
          endDate
        )
      );
    }

    setMessage("");
    setBookingPanelOpen(true);
  };

  const resetForm = () => {
    setResourceId(
      resources[0]?.id ?? ""
    );

    setStart(
      getDefaultStart()
    );

    setEnd(
      getDefaultEnd()
    );

    setPurpose("");
    setMessage("");
  };

  const submitBooking = () => {
    setMessage("");

    if (!resourceId) {
      setMessageTone("warning");
      setMessage(
        "Please select a resource."
      );
      return;
    }

    if (!start || !end) {
      setMessageTone("warning");
      setMessage(
        "Please select the start and end time."
      );
      return;
    }

    const startDate =
      new Date(start);

    const endDate =
      new Date(end);

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      setMessageTone("warning");
      setMessage(
        "Please enter a valid date and time."
      );
      return;
    }

    if (
      endDate <= startDate
    ) {
      setMessageTone("warning");
      setMessage(
        "End time must be later than start time."
      );
      return;
    }

    if (!purpose.trim()) {
      setMessageTone("warning");
      setMessage(
        "Please enter the booking purpose."
      );
      return;
    }

    if (
      conflicts.length > 0
    ) {
      setMessageTone("warning");

      setMessage(
        `This time slot conflicts with ${
          conflicts.length
        } existing booking${
          conflicts.length > 1
            ? "s"
            : ""
        }.`
      );

      return;
    }

    const result =
      createBooking({
        resource_id:
          resourceId,
        start_time:
          startDate.toISOString(),
        end_time:
          endDate.toISOString(),
        purpose:
          purpose.trim()
      });

    setMessageTone(
      result.ok
        ? "success"
        : "warning"
    );

    setMessage(
      result.message
    );

    if (result.ok) {
      setPurpose("");

      setTimeout(() => {
        setBookingPanelOpen(
          false
        );
        setMessage("");
      }, 800);
    }
  };

  const handleCancel = (
    bookingId: string
  ) => {
    cancelBooking(bookingId);
  };

  const calendarTitle =
    calendarView === "month"
      ? `${
          MONTH_NAMES[
            currentDate.getMonth()
          ]
        } ${currentDate.getFullYear()}`
      : calendarView === "day"
        ? currentDate.toLocaleDateString(
            undefined,
            {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric"
            }
          )
        : `${formatShortDate(
            weekDays[0]
          )} – ${formatShortDate(
            weekDays[6]
          )}, ${weekDays[6].getFullYear()}`;

  return (
    <div className="relative grid gap-5">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Resource Bookings
          </h1>

          <p className="mt-1 text-sm text-muted">
            Plan and manage shared
            resources from one scheduling
            workspace.
          </p>
        </div>

        <Button
          onClick={() =>
            openBookingPanel()
          }
          title="Create new booking"
        >
          <CalendarPlus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* COMPACT OVERVIEW */}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-100 p-3 text-brand">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <div className="text-2xl font-bold">
                {
                  activeBookings.length
                }
              </div>

              <div className="text-sm text-muted">
                Active bookings
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-100 p-3 text-brand">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <div className="text-2xl font-bold">
                {todayBookings}
              </div>

              <div className="text-sm text-muted">
                Bookings today
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-100 p-3 text-brand">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <div className="text-2xl font-bold">
                {resources.length}
              </div>

              <div className="text-sm text-muted">
                Bookable resources
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* TOOLBAR */}

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />

            <Input
              className="w-full pl-9"
              placeholder="Search bookings, resources or employees"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <Select
            className="w-52"
            value={resourceFilter}
            onChange={(event) =>
              setResourceFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All resources
            </option>

            {resources.map(
              (resource) => (
                <option
                  key={resource.id}
                  value={resource.id}
                >
                  {resource.name}
                </option>
              )
            )}
          </Select>

          <div className="flex rounded-md border border-border bg-white p-1">
            <button
              type="button"
              onClick={() =>
                setBookingScope(
                  "all"
                )
              }
              className={`rounded px-4 py-2 text-sm font-semibold ${
                bookingScope ===
                "all"
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-slate-50"
              }`}
            >
              All Bookings
            </button>

            <button
              type="button"
              onClick={() =>
                setBookingScope(
                  "mine"
                )
              }
              className={`rounded px-4 py-2 text-sm font-semibold ${
                bookingScope ===
                "mine"
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-slate-50"
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>
      </Card>

      {/* MAIN CALENDAR WORKSPACE */}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        {/* CALENDAR */}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentDate(
                    new Date()
                  )
                }
                title="Go to today"
              >
                Today
              </Button>

              <Button
                variant="ghost"
                onClick={
                  navigatePrevious
                }
                title="Previous period"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={
                  navigateNext
                }
                title="Next period"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <h2 className="ml-2 font-bold">
                {calendarTitle}
              </h2>
            </div>

            <div className="flex rounded-md border border-border bg-white p-1">
              {(
                [
                  "day",
                  "week",
                  "month"
                ] as CalendarView[]
              ).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() =>
                    setCalendarView(
                      view
                    )
                  }
                  className={`rounded px-4 py-2 text-sm font-semibold capitalize ${
                    calendarView ===
                    view
                      ? "bg-brand text-white"
                      : "text-muted hover:bg-slate-50"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* WEEK VIEW */}

          {calendarView ===
            "week" && (
            <div className="mt-4 overflow-x-auto">
              <div className="grid min-w-[850px] grid-cols-7 gap-2">
                {weekDays.map(
                  (date) => {
                    const dayBookings =
                      visibleBookings.filter(
                        (booking) =>
                          booking.status !==
                            "Cancelled" &&
                          sameDay(
                            new Date(
                              booking.start_time
                            ),
                            date
                          )
                      );

                    const isToday =
                      sameDay(
                        date,
                        new Date()
                      );

                    return (
                      <div
                        key={date.toISOString()}
                        className="min-h-[430px] rounded-md border border-border bg-slate-50/50"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openBookingPanel(
                              date
                            )
                          }
                          className={`w-full border-b border-border p-3 text-center ${
                            isToday
                              ? "bg-emerald-50"
                              : "bg-white"
                          }`}
                        >
                          <div className="text-xs font-semibold uppercase text-muted">
                            {
                              DAY_NAMES[
                                date.getDay()
                              ]
                            }
                          </div>

                          <div
                            className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                              isToday
                                ? "bg-brand text-white"
                                : ""
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        </button>

                        <div className="grid gap-2 p-2">
                          {dayBookings.length ===
                          0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                openBookingPanel(
                                  date
                                )
                              }
                              className="rounded-md border border-dashed border-border px-2 py-6 text-xs text-muted hover:bg-white"
                            >
                              + Add booking
                            </button>
                          ) : (
                            dayBookings.map(
                              (
                                booking
                              ) => {
                                const resource =
                                  assets.find(
                                    (
                                      asset
                                    ) =>
                                      asset.id ===
                                      booking.resource_id
                                  );

                                return (
                                  <div
                                    key={
                                      booking.id
                                    }
                                    className="rounded-md border border-emerald-200 bg-emerald-50 p-2"
                                  >
                                    <div className="text-xs font-bold text-slate-900">
                                      {
                                        resource?.name
                                      }
                                    </div>

                                    <div className="mt-1 text-[11px] text-muted">
                                      {formatTime(
                                        booking.start_time
                                      )}{" "}
                                      –{" "}
                                      {formatTime(
                                        booking.end_time
                                      )}
                                    </div>

                                    <div className="mt-2 truncate text-[11px]">
                                      {
                                        booking.purpose
                                      }
                                    </div>
                                  </div>
                                );
                              }
                            )
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* DAY VIEW */}

          {calendarView ===
            "day" && (
            <div className="mt-4 grid gap-3">
              {visibleBookings
                .filter(
                  (booking) =>
                    booking.status !==
                      "Cancelled" &&
                    sameDay(
                      new Date(
                        booking.start_time
                      ),
                      currentDate
                    )
                )
                .map((booking) => {
                  const resource =
                    assets.find(
                      (asset) =>
                        asset.id ===
                        booking.resource_id
                    );

                  const booker =
                    profiles.find(
                      (profile) =>
                        profile.id ===
                        booking.booked_by_id
                    );

                  return (
                    <div
                      key={booking.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-28 font-semibold text-brand">
                          {formatTime(
                            booking.start_time
                          )}
                        </div>

                        <div>
                          <div className="font-bold">
                            {
                              resource?.name
                            }
                          </div>

                          <div className="mt-1 text-sm text-muted">
                            {
                              booking.purpose
                            }
                          </div>

                          <div className="mt-2 text-xs text-muted">
                            Booked by{" "}
                            {booker?.full_name ??
                              "Unknown"}
                          </div>
                        </div>
                      </div>

                      <Badge
                        tone={statusTone(
                          booking.status
                        )}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  );
                })}

              {visibleBookings.filter(
                (booking) =>
                  booking.status !==
                    "Cancelled" &&
                  sameDay(
                    new Date(
                      booking.start_time
                    ),
                    currentDate
                  )
              ).length === 0 && (
                <button
                  type="button"
                  onClick={() =>
                    openBookingPanel(
                      currentDate
                    )
                  }
                  className="rounded-md border border-dashed border-border py-16 text-center text-sm text-muted hover:bg-slate-50"
                >
                  No bookings for this
                  day. Click to create one.
                </button>
              )}
            </div>
          )}

          {/* MONTH VIEW */}

          {calendarView ===
            "month" && (
            <div className="mt-4 grid grid-cols-7 gap-2">
              {Array.from(
                { length: 35 },
                (_, index) => {
                  const first =
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      1
                    );

                  const date =
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      index -
                        first.getDay() +
                        1
                    );

                  const dayBookings =
                    visibleBookings.filter(
                      (booking) =>
                        booking.status !==
                          "Cancelled" &&
                        sameDay(
                          new Date(
                            booking.start_time
                          ),
                          date
                        )
                    );

                  const inMonth =
                    date.getMonth() ===
                    currentDate.getMonth();

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() =>
                        openBookingPanel(
                          date
                        )
                      }
                      className={`min-h-28 rounded-md border border-border p-2 text-left hover:bg-slate-50 ${
                        inMonth
                          ? "bg-white"
                          : "bg-slate-50 text-muted"
                      }`}
                    >
                      <div className="text-sm font-semibold">
                        {date.getDate()}
                      </div>

                      <div className="mt-2 grid gap-1">
                        {dayBookings
                          .slice(0, 2)
                          .map(
                            (
                              booking
                            ) => {
                              const resource =
                                assets.find(
                                  (
                                    asset
                                  ) =>
                                    asset.id ===
                                    booking.resource_id
                                );

                              return (
                                <div
                                  key={
                                    booking.id
                                  }
                                  className="truncate rounded bg-emerald-50 px-2 py-1 text-xs text-brand"
                                >
                                  {
                                    resource?.name
                                  }
                                </div>
                              );
                            }
                          )}

                        {dayBookings.length >
                          2 && (
                          <div className="text-xs text-muted">
                            +
                            {dayBookings.length -
                              2}{" "}
                            more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </Card>

        {/* UPCOMING AGENDA */}

        <div className="grid content-start gap-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">
                  Upcoming
                </h2>

                <p className="mt-1 text-xs text-muted">
                  Next scheduled bookings
                </p>
              </div>

              <Badge tone="info">
                {
                  upcomingBookings.length
                }
              </Badge>
            </div>

            <div className="mt-4 grid gap-3">
              {upcomingBookings
                .slice(0, 6)
                .map((booking) => {
                  const resource =
                    assets.find(
                      (asset) =>
                        asset.id ===
                        booking.resource_id
                    );

                  const booker =
                    profiles.find(
                      (profile) =>
                        profile.id ===
                        booking.booked_by_id
                    );

                  return (
                    <div
                      key={booking.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold">
                          {
                            resource?.name
                          }
                        </div>

                        <Badge
                          tone={statusTone(
                            booking.status
                          )}
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-start gap-2 text-xs text-muted">
                        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                        <span>
                          {formatTimeRange(
                            booking.start_time,
                            booking.end_time
                          )}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <MapPin className="h-3.5 w-3.5" />

                        <span>
                          {resource?.location}
                        </span>
                      </div>

                      <div className="mt-3 text-sm">
                        {booking.purpose}
                      </div>

                      <div className="mt-3 border-t border-border pt-3 text-xs text-muted">
                        Booked by{" "}
                        <span className="font-semibold">
                          {booker?.full_name ??
                            "Unknown"}
                        </span>
                      </div>

                      {booking.status !==
                        "Cancelled" &&
                        booking.status !==
                          "Completed" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancel(
                                booking.id
                              )
                            }
                            className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Booking
                          </button>
                        )}
                    </div>
                  );
                })}

              {upcomingBookings.length ===
                0 && (
                <div className="py-8 text-center text-sm text-muted">
                  No upcoming bookings.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* BOOKING SIDE PANEL */}

      {bookingPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
          <button
            type="button"
            aria-label="Close booking panel"
            className="absolute inset-0 cursor-default"
            onClick={() =>
              setBookingPanelOpen(
                false
              )
            }
          />

          <div className="relative z-10 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">
                  New Booking
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Reserve an available
                  resource and time slot.
                </p>
              </div>

              <Button
                variant="ghost"
                onClick={() =>
                  setBookingPanelOpen(
                    false
                  )
                }
                title="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-5 p-6">
              {resources.length === 0 ? (
                <Notice
                  tone="warning"
                  message="No bookable resources are currently available."
                />
              ) : (
                <>
                  <Field label="Resource">
                    <Select
                      value={
                        resourceId
                      }
                      onChange={(
                        event
                      ) => {
                        setResourceId(
                          event.target
                            .value
                        );

                        setMessage("");
                      }}
                    >
                      <option value="">
                        Select resource
                      </option>

                      {resources.map(
                        (
                          resource
                        ) => (
                          <option
                            key={
                              resource.id
                            }
                            value={
                              resource.id
                            }
                          >
                            {
                              resource.name
                            }{" "}
                            -{" "}
                            {
                              resource.location
                            }
                          </option>
                        )
                      )}
                    </Select>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Start Date & Time">
                      <Input
                        type="datetime-local"
                        value={start}
                        onChange={(
                          event
                        ) => {
                          setStart(
                            event.target
                              .value
                          );

                          setMessage("");
                        }}
                      />
                    </Field>

                    <Field label="End Date & Time">
                      <Input
                        type="datetime-local"
                        value={end}
                        onChange={(
                          event
                        ) => {
                          setEnd(
                            event.target
                              .value
                          );

                          setMessage("");
                        }}
                      />
                    </Field>
                  </div>

                  <Field label="Purpose">
                    <Textarea
                      value={purpose}
                      onChange={(
                        event
                      ) => {
                        setPurpose(
                          event.target
                            .value
                        );

                        setMessage("");
                      }}
                      placeholder="Example: Sprint planning meeting"
                    />
                  </Field>

                  {conflicts.length >
                    0 && (
                    <Notice
                      tone="warning"
                      message={`This time slot conflicts with ${
                        conflicts.length
                      } existing booking${
                        conflicts.length >
                        1
                          ? "s"
                          : ""
                      }.`}
                    />
                  )}

                  {message && (
                    <Notice
                      tone={
                        messageTone
                      }
                      message={
                        message
                      }
                    />
                  )}

                  <div className="flex justify-end gap-3 border-t border-border pt-5">
                    <Button
                      variant="secondary"
                      onClick={
                        resetForm
                      }
                      title="Reset form"
                    >
                      Reset
                    </Button>

                    <Button
                      onClick={
                        submitBooking
                      }
                      title="Confirm booking"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Confirm Booking
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}