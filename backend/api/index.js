// Vercel serverless entrypoint for the backend
// Re-exports the Express app so Vercel can serve it as an API function
import app from '../src/server.js'
export default app
