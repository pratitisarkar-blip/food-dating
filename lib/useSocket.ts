"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 400,
      reconnectionDelayMax: 2500
    });
  }
  return socket;
}
