import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  guestId: integer("guest_id").notNull(),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }).notNull(),
  actualCheckIn: timestamp("actual_check_in", { withTimezone: true }),
  actualCheckOut: timestamp("actual_check_out", { withTimezone: true }),
  status: text("status").notNull().default("reserved"),
  // reserved, checked_in, checked_out, cancelled
  stayType: text("stay_type").notNull().default("regular"), // regular, long_stay
  pricePerNight: integer("price_per_night").notNull().default(0),
  occupiedPersons: integer("occupied_persons").notNull().default(1),
  totalAmount: integer("total_amount"),
  deposit: integer("deposit"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
