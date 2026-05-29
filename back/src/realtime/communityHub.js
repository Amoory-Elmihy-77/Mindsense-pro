const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const clients = new Map();

function encodeFrame(payload) {
  const message = Buffer.from(JSON.stringify(payload));
  const length = message.length;
  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), message]);
  }
  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, message]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, message]);
}

function send(socket, payload) {
  if (!socket || socket.destroyed) return;
  try {
    socket.write(encodeFrame(payload));
  } catch {
    socket.destroy();
  }
}

function addClient(userId, socket) {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(socket);
  socket.on("close", () => clients.get(key)?.delete(socket));
  socket.on("end", () => clients.get(key)?.delete(socket));
  socket.on("error", () => clients.get(key)?.delete(socket));
  send(socket, { event: "connected", userId: key, ts: Date.now() });
}

async function authenticate(url) {
  const parsed = new URL(url, "http://localhost");
  const token = parsed.searchParams.get("token");
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id).select("_id role name");
}

function attach(server) {
  server.on("upgrade", async (req, socket) => {
    try {
      if (!req.url.startsWith("/ws/community")) {
        socket.destroy();
        return;
      }

      const user = await authenticate(req.url);
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const key = req.headers["sec-websocket-key"];
      const accept = crypto
        .createHash("sha1")
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest("base64");

      socket.write(
        [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${accept}`,
          "\r\n",
        ].join("\r\n"),
      );

      addClient(user._id, socket);
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });
}

function publishToUser(userId, event, data) {
  const sockets = clients.get(String(userId));
  if (!sockets) return;
  sockets.forEach((socket) => send(socket, { event, data, ts: Date.now() }));
}

function publish(event, data) {
  clients.forEach((sockets) => {
    sockets.forEach((socket) => send(socket, { event, data, ts: Date.now() }));
  });
}

module.exports = {
  attach,
  publish,
  publishToUser,
};
