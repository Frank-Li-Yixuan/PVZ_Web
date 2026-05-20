import http from "node:http";
import { Server } from "socket.io";
import { Phase0RuntimeConfig, PROJECT_VERSION, type HealthCheckPayload } from "@sprout-and-steel/shared";

const PORT = Number(process.env.PORT ?? Phase0RuntimeConfig.serverPort);
const HOST = process.env.HOST ?? Phase0RuntimeConfig.serverHost;

const httpServer = http.createServer((request, response) => {
  const payload: HealthCheckPayload = {
    ok: true,
    service: "sprout-and-steel-server",
    version: PROJECT_VERSION,
    phase: "phase-0"
  };

  if (request.url === "/" || request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(payload));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: false, error: "not_found" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`[server] socket connected: ${socket.id}`);
  socket.emit("server.ready", {
    version: PROJECT_VERSION,
    message: "Phase 0 server is ready."
  });

  socket.on("disconnect", (reason) => {
    console.log(`[server] socket disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[server] Sprout & Steel ${PROJECT_VERSION} Phase 0 listening on http://${HOST}:${PORT}`);
});
