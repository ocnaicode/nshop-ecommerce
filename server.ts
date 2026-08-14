// =============================================================================
// LocalMart Realtime Server
// Custom Next.js server with socket.io attached — enables realtime features
// (live order updates, notifications, chat) via /socket.io.
//
// Run:   npm run dev:realtime     (development)
//        npm run build && npm run start:realtime   (production)
//
// The standard `next dev` / `next start` flows keep working without
// realtime (UI falls back to REST polling automatically).
// =============================================================================

import { createServer } from 'http';
import next from 'next';
import { initRealtimeServer } from './src/server/realtime';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Attach socket.io to the same HTTP server
  initRealtimeServer(server);

  server.listen(port, hostname, () => {
    console.log(`✓ LocalMart running at http://${hostname}:${port}${dev ? ' (dev, realtime enabled)' : ' (production, realtime enabled)'}`);
  });
});
