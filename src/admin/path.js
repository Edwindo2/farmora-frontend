// Where the admin area lives in the browser. It's not the usual /admin, so bots and casual visitors
// scanning for an admin page don't find it. Change it with VITE_ADMIN_PATH in farmora-frontend/.env
// (and ADMIN_PATH in farmora-backend/.env, so email links match).
export const ADMIN = (import.meta.env.VITE_ADMIN_PATH || '/officerArea').replace(/\/$/, '')
