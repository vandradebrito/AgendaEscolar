import app from "../artifacts/api-server/src/app";

// Expose the Express app as a single Vercel Serverless Function.
// All requests to /api/* are routed here via vercel.json rewrites.
export default app;
