/** A room is "on fire" when it has this many listeners or more. */
export const HOT_THRESHOLD = 3

export const isHot = (count: number) => count >= HOT_THRESHOLD
