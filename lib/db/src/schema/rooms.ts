import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  block: text("block").notNull(), // A, C, D, E, G, facility
  type: text("type").notNull(), // single, double, family
  stars: integer("stars").notNull(), // 1=Double Bed, 2=Family, 3=Long Stay/Big Room
  pricePerNight: integer("price_per_night").notNull(),
  status: text("status").notNull().default("available"),
  // available, occupied_regular, long_stay_japan, long_stay_local, blocked, facility
  notes: text("notes"),
  isFacility: boolean("is_facility").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
