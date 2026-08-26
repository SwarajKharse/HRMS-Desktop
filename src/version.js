// Set at build time by the deployment pipeline (REACT_APP_BUILD_VERSION).
// Falls back to "dev" when unset, e.g. local development.
export const BUILD_VERSION = process.env.REACT_APP_BUILD_VERSION || "dev";
