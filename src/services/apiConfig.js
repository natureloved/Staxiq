// Single source of truth for the backend API base URL.
//
// Dev falls back to the local server. Production builds MUST set VITE_API_BASE
// (e.g. https://staxiq-api.onrender.com in Vercel) — without it we refuse to
// fire requests at localhost from a visitor's browser and instead surface a
// clear configuration error through each page's normal error UI.
export const API_BASE =
    import.meta.env.VITE_API_BASE ||
    (import.meta.env.DEV ? 'http://localhost:3002' : '');

export const API_CONFIGURED = Boolean(API_BASE);

if (!API_CONFIGURED) {
    console.error(
        'Staxiq: VITE_API_BASE is not set in this production build — backend features are disabled. ' +
        'Set VITE_API_BASE to your API server URL and rebuild.'
    );
}

/** Throw a user-readable error when the backend URL is missing. */
export function assertApiConfigured() {
    if (!API_CONFIGURED) {
        throw new Error('Backend is not configured for this deployment. Please try again later.');
    }
}
