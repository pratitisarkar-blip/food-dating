import { spawn, type ChildProcess } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { bin, install, Tunnel } from "cloudflared";

const port = process.env.PORT || "3000";
mkdirSync(join(process.cwd(), "data"), { recursive: true });
const file = join(process.cwd(), "data", "tunnel-url.txt");
let keepAlive: ChildProcess | null = null;

function saveOrigin(origin: string) {
  const clean = origin.replace(/\/$/, "");
  writeFileSync(file, clean);
  writeFileSync(
    join(process.cwd(), "docs", "config.js"),
    `window.FOOD_DATING_ORIGIN = ${JSON.stringify(clean)};\nwindow.FOOD_DATING_EVENT = "FOOD-DATING-001";\n`
  );
  console.log(`
Share these with testers (works on mobile data, keep this terminal open):

App (audience)
${clean}/join/FOOD-DATING-001

Stage
${clean}/stage/FOOD-DATING-001

Controller
${clean}/controller/FOOD-DATING-001
Key: showtime
`);
}

function extractHttps(text: string) {
  const matches = text.match(/https:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s"'<>]*)?/g) || [];
  return matches
    .map((u) => u.replace(/[.,;]+$/, "").replace(/\/$/, ""))
    .find(
      (u) =>
        /trycloudflare\.com|pinggy(?:link)?\.|loca\.lt|localtunnel\.me|lhr\.life|localhost\.run|ngrok-free\.app|ngrok\.io/i.test(
          u
        )
    );
}

function waitForProcessUrl(child: ChildProcess, timeoutMs: number) {
  return new Promise<string>((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Timed out waiting for a public URL"));
    }, timeoutMs);
    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      buf += text;
      process.stderr.write(text);
      const url = extractHttps(buf);
      if (url) {
        clearTimeout(timer);
        child.stdout?.off("data", onData);
        child.stderr?.off("data", onData);
        resolve(url);
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Tunnel process exited ${code}\n${buf.slice(-800)}`));
    });
  });
}

async function tryCloudflare() {
  if (!existsSync(bin)) {
    console.log("Downloading Cloudflare tunnel...");
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await install(bin);
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  const tunnel = Tunnel.quick(`http://127.0.0.1:${port}`, { "--protocol": "http2" });
  keepAlive = tunnel.process;
  return new Promise<string>((resolve, reject) => {
    let url = "";
    const timer = setTimeout(() => {
      try {
        tunnel.stop();
      } catch {
        /* ignore */
      }
      reject(new Error("Cloudflare tunnel timed out"));
    }, 20000);
    tunnel.on("url", (value: string) => {
      url = value.replace(/\/$/, "");
    });
    tunnel.on("connected", () => {
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    });
    tunnel.on("error", (err: Error) => console.error(err));
    tunnel.on("stderr", (data: string) => process.stderr.write(data));
    tunnel.on("stdout", (data: string) => process.stdout.write(data));
    tunnel.on("exit", (code: number | null) => {
      clearTimeout(timer);
      reject(new Error(`Cloudflare tunnel exited ${code}`));
    });
  });
}

async function tryPinggy() {
  console.log("Trying Pinggy public tunnel...");
  const child = spawn(
    "ssh",
    [
      "-p",
      "443",
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "UserKnownHostsFile=/dev/null",
      "-o",
      "ServerAliveInterval=30",
      "-o",
      "ExitOnForwardFailure=yes",
      "-T",
      "-R",
      `0:127.0.0.1:${port}`,
      "a.pinggy.io"
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  keepAlive = child;
  return waitForProcessUrl(child, 30000);
}

async function tryLocaltunnel() {
  console.log("Trying localtunnel...");
  const child = spawn("npx", ["--yes", "localtunnel", "--port", port], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  keepAlive = child;
  return waitForProcessUrl(child, 45000);
}

async function main() {
  const attempts = [tryCloudflare, tryPinggy, tryLocaltunnel];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const origin = await attempt();
      saveOrigin(origin);
      console.log("Keep this process running while people test.");
      await new Promise(() => {
        /* hold open */
      });
    } catch (err) {
      lastError = err;
      console.error(err instanceof Error ? err.message : err);
      keepAlive = null;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not open a public URL");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
