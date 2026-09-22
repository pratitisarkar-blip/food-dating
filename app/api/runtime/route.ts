import { DEFAULT_EVENT_ID } from "@/lib/types";
import { joinUrl, lanOrigins, stablePrintOrigin, tunnelUrl } from "@/lib/public-url";

export async function GET() {
  const port = Number(process.env.PORT || 3000);
  const lan = lanOrigins(port);
  const publicUrl = tunnelUrl();
  const origin = publicUrl || lan[0] || `http://localhost:${port}`;
  const printOrigin = stablePrintOrigin();
  return Response.json({
    origin,
    lan,
    publicUrl,
    printOrigin,
    joinUrl: joinUrl(DEFAULT_EVENT_ID)
  });
}
