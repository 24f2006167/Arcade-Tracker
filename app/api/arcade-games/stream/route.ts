import type { NextRequest } from "next/server";

/**
 * GET /api/arcade-games/stream
 *
 * Server-Sent Events endpoint.  The client connects once and receives:
 *   - An immediate "ping" with the current game list
 *   - A new event every 30 minutes when the server re-checks go.cloudskillsboost.google/arcade
 *
 * This keeps the dashboard live without the user ever refreshing.
 */

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export const runtime = "nodejs"; // SSE requires a long-lived Node.js runtime

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Helper: fetch the arcade-games API internally
      async function fetchGames() {
        try {
          const origin =
            req.headers.get("origin") ||
            req.headers.get("x-forwarded-proto") + "://" + req.headers.get("host") ||
            "http://localhost:3000";
          const res = await fetch(`${origin}/api/arcade-games`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (err) {
          return {
            source: "error",
            games: [],
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      // 1. Send initial data immediately
      const initial = await fetchGames();
      send("games", initial);

      // 2. Poll every 30 minutes
      const interval = setInterval(async () => {
        const data = await fetchGames();
        send("games", data);
      }, POLL_INTERVAL_MS);

      // 3. Send a heartbeat every 20 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          clearInterval(interval);
        }
      }, 20_000);

      // 4. Cleanup when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
