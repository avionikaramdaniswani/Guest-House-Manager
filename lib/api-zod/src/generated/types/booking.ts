/**
 * Wisma Eucaliptus PMS — manually maintained, do not auto-generate.
 */
import type { BookingStatus } from './bookingStatus';
import type { BookingStayType } from './bookingStayType';

export interface Booking {
  id: number;
  room_id: number;
  room_number: string;
  guest_id: number;
  guest_name: string;
  /** @nullable */
  guest_company?: string | null;
  check_in_date: Date;
  check_out_date: Date;
  /** @nullable */
  actual_check_in?: Date | null;
  /** @nullable */
  actual_check_out?: Date | null;
  status: BookingStatus;
  stay_type: BookingStayType;
  occupied_persons: number;
  /** @nullable */
  notes?: string | null;
  created_at: Date;
}
