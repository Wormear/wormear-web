/**
 * Typed reader for Vite public environment variables.
 * Placeholders only — no real secrets. See .env.example for local overrides.
 */

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export const site = {
  /** Public site URL (canonical links / meta tags). */
  siteUrl: import.meta.env.VITE_SITE_URL ?? 'https://wormear.app',
  /** Base URL of the backend API (includes the /api/v1 prefix). */
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  /** App version shown in the footer. */
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  /** Runtime environment name. */
  appEnv: import.meta.env.VITE_ENV ?? 'development',
  /** Product analytics master switch. */
  analyticsEnabled: flag(import.meta.env.VITE_ENABLE_ANALYTICS, false),
  /** Analytics measurement id (empty = tracking disabled). */
  analyticsId: import.meta.env.VITE_ANALYTICS_ID ?? '',
  /** Sentry DSN (empty = crash reporting disabled). */
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? '',
  /** Google OAuth client id (empty = sign-in button renders setup-required state). */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
};
