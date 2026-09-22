import { existsSync, readFileSync } from "fs";
import { networkInterfaces } from "os";
import { join } from "path";
import { DEFAULT_EVENT_ID } from "./types";

function isLocalWifi(ip: string) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

export function lanOrigins(port: number) {
  const ips: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      const family = addr.family === "IPv4" || String(addr.family) === "4";
      if (family && !addr.internal) ips.push(addr.address);
    }
  }
  ips.sort((a, b) => Number(isLocalWifi(b)) - Number(isLocalWifi(a)));
  return ips.map((ip) => `http://${ip}:${port}`);
}

function stripOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function tunnelUrl() {
  const fromEnv = process.env.PUBLIC_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const render = process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "");
  if (render) return render;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) {
    if (railway.startsWith("http://") || railway.startsWith("https://")) return stripOrigin(railway);
    return `https://${railway.replace(/\/$/, "")}`;
  }
  const file = join(process.cwd(), "data", "tunnel-url.txt");
  try {
    if (existsSync(file)) {
      const value = readFileSync(file, "utf8").trim().replace(/\/$/, "");
      if (value) return value;
    }
  } catch {
    /* ignore */
  }
  return "";
}

export function phoneOrigin(port = Number(process.env.PORT || 3000)) {
  return tunnelUrl() || lanOrigins(port)[0] || `http://localhost:${port}`;
}

export function joinUrl(eventId = DEFAULT_EVENT_ID) {
  return `${phoneOrigin()}/join/${eventId}`;
}

export function stablePrintOrigin() {
  const fromEnv = process.env.STABLE_QR_ORIGIN?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const file = join(process.cwd(), "data", "stable-print-origin.txt");
  try {
    if (existsSync(file)) {
      const value = readFileSync(file, "utf8").trim().replace(/\/$/, "");
      if (value) return value;
    }
  } catch {
    /* ignore */
  }
  return "";
}
