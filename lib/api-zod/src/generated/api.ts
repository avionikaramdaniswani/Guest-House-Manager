/**
 * Wisma Eucaliptus PMS — API Zod schemas
 * Manually maintained (no codegen). Do not auto-generate.
 */
import * as zod from 'zod';

// ── Health ──────────────────────────────────────────────────────
export const HealthCheckResponse = zod.object({
  "status": zod.string()
})

// ── Auth ────────────────────────────────────────────────────────
export const loginBodyPinMin = 4;
export const loginBodyPinMax = 4;
export const LoginBody = zod.object({
  "pin": zod.string().min(loginBodyPinMin).max(loginBodyPinMax)
})
export const LoginResponse = zod.object({
  "token": zod.string(),
  "staff": zod.string()
})
export const VerifySessionResponse = zod.object({
  "token": zod.string(),
  "staff": zod.string()
})

// ── Rooms ────────────────────────────────────────────────────────
export const GetRoomsResponseItem = zod.object({
  "id": zod.number(),
  "number": zod.string(),
  "block": zod.enum(['A', 'C', 'D', 'E', 'G', 'facility']),
  "type": zod.enum(['single', 'double', 'family']),
  "stars": zod.number(),
  "room_name": zod.string().nullish(),
  "status": zod.enum(['available', 'occupied_regular', 'long_stay_japan', 'long_stay_local', 'blocked', 'facility']),
  "notes": zod.string().nullish(),
  "is_facility": zod.boolean()
})
export const GetRoomsResponse = zod.array(GetRoomsResponseItem)

export const GetRoomParams = zod.object({
  "id": zod.coerce.number()
})
export const GetRoomResponse = zod.object({
  "id": zod.number(),
  "number": zod.string(),
  "block": zod.string(),
  "type": zod.string(),
  "stars": zod.number(),
  "room_name": zod.string().nullish(),
  "status": zod.string(),
  "notes": zod.string().nullish(),
  "is_facility": zod.boolean(),
  "current_booking": zod.object({
    "id": zod.number(),
    "room_id": zod.number(),
    "room_number": zod.string(),
    "guest_id": zod.number(),
    "guest_name": zod.string(),
    "guest_company": zod.string().nullish(),
    "guest_nationality": zod.string(),
    "check_in_date": zod.coerce.date(),
    "check_out_date": zod.coerce.date(),
    "actual_check_in": zod.coerce.date().nullish(),
    "actual_check_out": zod.coerce.date().nullish(),
    "status": zod.enum(['reserved', 'checked_in', 'checked_out', 'cancelled']),
    "stay_type": zod.enum(['regular', 'long_stay']),
    "occupied_persons": zod.number(),
    "notes": zod.string().nullish(),
    "created_at": zod.coerce.date()
  }).nullish()
})

export const UpdateRoomParams = zod.object({
  "id": zod.coerce.number()
})
export const UpdateRoomBody = zod.object({
  "notes": zod.string().nullish(),
  "status": zod.enum(['available', 'occupied_regular', 'long_stay_japan', 'long_stay_local', 'blocked', 'facility']).optional()
})
export const UpdateRoomResponse = zod.object({
  "id": zod.number(),
  "number": zod.string(),
  "block": zod.enum(['A', 'C', 'D', 'E', 'G', 'facility']),
  "type": zod.enum(['single', 'double', 'family']),
  "stars": zod.number(),
  "room_name": zod.string().nullish(),
  "status": zod.enum(['available', 'occupied_regular', 'long_stay_japan', 'long_stay_local', 'blocked', 'facility']),
  "notes": zod.string().nullish(),
  "is_facility": zod.boolean()
})

// ── Guests ────────────────────────────────────────────────────────
export const GetGuestsQueryParams = zod.object({
  "active": zod.coerce.boolean().optional(),
  "search": zod.coerce.string().optional()
})
export const GetGuestsResponseItem = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "company": zod.string().nullish(),
  "id_number": zod.string(),
  "id_type": zod.enum(['ktp', 'passport']),
  "nationality": zod.string(),
  "phone": zod.string().nullish(),
  "created_at": zod.coerce.date()
})
export const GetGuestsResponse = zod.array(GetGuestsResponseItem)

export const CreateGuestBody = zod.object({
  "name": zod.string(),
  "company": zod.string().optional(),
  "id_number": zod.string(),
  "id_type": zod.enum(['ktp', 'passport']),
  "nationality": zod.string(),
  "phone": zod.string().optional()
})

export const GetGuestParams = zod.object({
  "id": zod.coerce.number()
})
export const GetGuestResponse = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "company": zod.string().nullish(),
  "id_number": zod.string(),
  "id_type": zod.enum(['ktp', 'passport']),
  "nationality": zod.string(),
  "phone": zod.string().nullish(),
  "created_at": zod.coerce.date()
})

export const UpdateGuestParams = zod.object({
  "id": zod.coerce.number()
})
export const UpdateGuestBody = zod.object({
  "name": zod.string().optional(),
  "company": zod.string().nullish(),
  "id_number": zod.string().optional(),
  "id_type": zod.string().optional(),
  "nationality": zod.string().optional(),
  "phone": zod.string().nullish()
})
export const UpdateGuestResponse = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "company": zod.string().nullish(),
  "id_number": zod.string(),
  "id_type": zod.enum(['ktp', 'passport']),
  "nationality": zod.string(),
  "phone": zod.string().nullish(),
  "created_at": zod.coerce.date()
})

// ── Bookings ──────────────────────────────────────────────────────
// Shared booking shape (reused in list, get, update, checkin responses)
const BookingShape = {
  "id": zod.number(),
  "room_id": zod.number(),
  "room_number": zod.string(),
  "guest_id": zod.number(),
  "guest_name": zod.string(),
  "guest_company": zod.string().nullish(),
  "guest_nationality": zod.string(),
  "check_in_date": zod.coerce.date(),
  "check_out_date": zod.coerce.date(),
  "actual_check_in": zod.coerce.date().nullish(),
  "actual_check_out": zod.coerce.date().nullish(),
  "status": zod.enum(['reserved', 'checked_in', 'checked_out', 'cancelled']),
  "stay_type": zod.enum(['regular', 'long_stay']),
  "occupied_persons": zod.number(),
  "notes": zod.string().nullish(),
  "created_at": zod.coerce.date()
};

export const GetBookingsQueryParams = zod.object({
  "status": zod.enum(['reserved', 'checked_in', 'checked_out', 'cancelled']).optional(),
  "room_id": zod.coerce.number().optional(),
  "date": zod.date().optional()
})
export const GetBookingsResponseItem = zod.object(BookingShape)
export const GetBookingsResponse = zod.array(GetBookingsResponseItem)

export const CreateBookingBody = zod.object({
  "room_id": zod.number(),
  "guest_id": zod.number().nullish(),
  "guest": zod.object({
    "name": zod.string(),
    "company": zod.string().optional(),
    "id_number": zod.string(),
    "id_type": zod.enum(['ktp', 'passport']),
    "nationality": zod.string(),
    "phone": zod.string().optional()
  }).optional(),
  "check_in_date": zod.coerce.date(),
  "check_out_date": zod.coerce.date(),
  "stay_type": zod.enum(['regular', 'long_stay']),
  "occupied_persons": zod.number().default(1),
  "notes": zod.string().nullish()
})

export const GetBookingParams = zod.object({
  "id": zod.coerce.number()
})
export const GetBookingResponse = zod.object(BookingShape)

export const UpdateBookingParams = zod.object({
  "id": zod.coerce.number()
})
export const UpdateBookingBody = zod.object({
  "check_in_date": zod.coerce.date().optional(),
  "check_out_date": zod.coerce.date().optional(),
  "occupied_persons": zod.number().optional(),
  "notes": zod.string().nullish(),
  "status": zod.enum(['reserved', 'checked_in', 'checked_out', 'cancelled']).optional()
})
export const UpdateBookingResponse = zod.object(BookingShape)

export const DeleteBookingParams = zod.object({
  "id": zod.coerce.number()
})

export const CheckInParams = zod.object({
  "id": zod.coerce.number()
})
export const CheckInBody = zod.object({
  "notes": zod.string().nullish()
})
export const CheckInResponse = zod.object(BookingShape)

export const CheckOutParams = zod.object({
  "id": zod.coerce.number()
})
export const CheckOutBody = zod.object({
  "notes": zod.string().nullish()
})
export const CheckOutResponse = zod.object({
  "booking": zod.object(BookingShape),
  "nights": zod.number(),
})

// ── Direct Check-in (one-step: create guest + booking + check-in) ──
export const DirectCheckInBody = zod.object({
  "room_id": zod.number(),
  "guest_name": zod.string().min(1),
  "company": zod.string().nullish(),
  "nationality": zod.string().default("Indonesia"),
  "id_number": zod.string().default("KARYAWAN"),
  "id_type": zod.enum(['ktp', 'passport']).default('ktp'),
  "check_in_date": zod.string(),   // YYYY-MM-DD
  "check_out_date": zod.string(),  // YYYY-MM-DD
  "stay_type": zod.enum(['regular', 'long_stay']).default('regular'),
  "occupied_persons": zod.number().int().min(1).default(1),
  "notes": zod.string().nullish()
})
export const DirectCheckInResponse = zod.object(BookingShape)

// ── Dashboard ─────────────────────────────────────────────────────
export const GetDashboardSummaryResponse = zod.object({
  "total_rooms": zod.number(),
  "occupied": zod.number(),
  "available": zod.number(),
  "long_stay_japan": zod.number(),
  "long_stay_local": zod.number(),
  "blocked": zod.number(),
  "occupancy_rate": zod.number()
})

export const GetTodayActivityResponse = zod.object({
  "check_ins": zod.array(zod.object(BookingShape)),
  "check_outs": zod.array(zod.object(BookingShape))
})

export const GetAlertsResponseItem = zod.object({
  "room_id": zod.number(),
  "room_number": zod.string(),
  "alert_type": zod.enum(['expiring_soon', 'overdue', 'blocked']),
  "message": zod.string(),
  "days_remaining": zod.number().nullish()
})
export const GetAlertsResponse = zod.array(GetAlertsResponseItem)

// ── Reports ───────────────────────────────────────────────────────
export const GetDailyReportQueryParams = zod.object({
  "date": zod.date()
})
export const GetDailyReportResponse = zod.object({
  "date": zod.coerce.date(),
  "check_ins": zod.number(),
  "check_outs": zod.number(),
  "new_reservations": zod.number(),
  "bookings": zod.array(zod.object(BookingShape))
})

export const GetMonthlyReportQueryParams = zod.object({
  "year": zod.coerce.number(),
  "month": zod.coerce.number()
})
export const GetMonthlyReportResponse = zod.object({
  "year": zod.number(),
  "month": zod.number(),
  "avg_occupancy_rate": zod.number(),
  "total_guests": zod.number(),
  "nationality_breakdown": zod.array(zod.object({
    "nationality": zod.string(),
    "count": zod.number()
  }))
})

export const getOccupancyChartQueryPeriodDefault = `weekly`;
export const GetOccupancyChartQueryParams = zod.object({
  "period": zod.enum(['weekly', 'monthly']).default(getOccupancyChartQueryPeriodDefault)
})
export const GetOccupancyChartResponseItem = zod.object({
  "label": zod.string(),
  "date": zod.string(),
  "occupied": zod.number(),
  "total": zod.number(),
  "rate": zod.number()
})
export const GetOccupancyChartResponse = zod.array(GetOccupancyChartResponseItem)

export const getActivityLogQueryLimitDefault = 50;
export const GetActivityLogQueryParams = zod.object({
  "limit": zod.coerce.number().default(getActivityLogQueryLimitDefault)
})
export const GetActivityLogResponseItem = zod.object({
  "id": zod.number(),
  "action": zod.string(),
  "description": zod.string(),
  "room_number": zod.string().nullish(),
  "guest_name": zod.string().nullish(),
  "created_at": zod.coerce.date()
})
export const GetActivityLogResponse = zod.array(GetActivityLogResponseItem)
