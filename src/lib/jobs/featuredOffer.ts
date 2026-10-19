/** Featured-listing price and duration. No Stripe import — safe for pages and FAQ copy. */
export const FEATURED_PRICE_CENTS = 9900;
export const FEATURED_DURATION_DAYS = 30;

export function featuredPriceLabel(): string {
  return `$${FEATURED_PRICE_CENTS / 100}`;
}

/** Placement a featured listing actually gets. Keep this aligned with the product. */
export function featuredPlacementSentence(): string {
  return `For ${FEATURED_DURATION_DAYS} days it is pinned to the top of the jobs board and shown on the homepage, with a Featured badge, and included in every Monday digest sent during those ${FEATURED_DURATION_DAYS} days.`;
}
