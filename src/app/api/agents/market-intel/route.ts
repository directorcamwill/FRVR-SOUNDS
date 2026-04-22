import { NextResponse } from "next/server";
import { runMarketIntel } from "@/lib/agents/market-intel";
import { gateAgentQuota } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

export async function POST() {
  const gate = await gateAgentQuota();
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  try {
    const result = await runMarketIntel(artistId);
    await incrementAgentRunCounter(artistId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Market intel failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
