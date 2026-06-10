/**
 * Wisma Eucaliptus PMS — manually maintained, do not auto-generate.
 */

export type BookingInputStayType = typeof BookingInputStayType[keyof typeof BookingInputStayType];


export const BookingInputStayType = {
  regular: 'regular',
  long_stay_japan: 'long_stay_japan',
  long_stay_local: 'long_stay_local',
} as const;
