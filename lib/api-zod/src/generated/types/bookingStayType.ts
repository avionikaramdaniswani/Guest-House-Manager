/**
 * Wisma Eucaliptus PMS — manually maintained, do not auto-generate.
 */

export type BookingStayType = typeof BookingStayType[keyof typeof BookingStayType];


export const BookingStayType = {
  regular: 'regular',
  long_stay_japan: 'long_stay_japan',
  long_stay_local: 'long_stay_local',
} as const;
