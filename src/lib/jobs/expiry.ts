// How long a job stays live before it auto-expires off the public board.
export const JOB_DURATION_DAYS = 60;

export function expiryFromNow(days = JOB_DURATION_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
