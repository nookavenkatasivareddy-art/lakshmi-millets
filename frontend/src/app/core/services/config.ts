// Central place for the backend API base URL.
// Resolution order:
//  1. window.__API_BASE_URL__  -> set at deploy time without rebuilding
//     e.g. in frontend/dist/.../index.html add before main bundle:
//     <script>window.__API_BASE_URL__ = 'https://api.yourdomain.com/api';</script>
//  2. Same-origin /api          -> when frontend dist is served by the backend
//     or behind the same reverse proxy (nginx). Works on EC2 with zero config.
//  3. localhost fallback        -> local `ng serve` development only.
function resolveApiBaseUrl(): string {
  const w = window as any;
  if (w.__API_BASE_URL__ && typeof w.__API_BASE_URL__ === 'string') {
    return w.__API_BASE_URL__.replace(/\/$/, '');
  }
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

