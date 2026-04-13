// REACT_APP_API_URL can be set at build time to override the backend URL.
// - Local dev: defaults to http://127.0.0.1:8000/
// - Server deploy: set to https://clusterchirp.mssm.edu/backend/index.wsgi/
// - Docker: set to /api/ (nginx proxies to backend container)
export const BASE_API_PATH = process.env.REACT_APP_API_URL
    || (process.env.NODE_ENV !== "production"
        ? "http://127.0.0.1:8000/"
        : "https://clusterchirp.mssm.edu/backend/index.wsgi/");
    