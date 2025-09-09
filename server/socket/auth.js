import jwt from "jsonwebtoken";

export function socketAuthMiddleware(socket, next) {
  const token =
    socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: payload.sub };
    return next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
}
