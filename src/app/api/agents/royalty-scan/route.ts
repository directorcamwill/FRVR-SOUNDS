import { NextResponse } from "next/server";
import { runRoyaltyScan } from "@/lib/agents/royalty-scanner";
import { gateAgentQuota } from "@/lib/feature-guard";
import { incrementAgentRunCounter } from "@/lib/features";

export async function POST() {
  const gate = await gateAgentQuota();
  if (!gate.ok) return gate.response;
  const artistId = gate.access.artist_id;
  if (!artistId)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  try {
    const result = await runRoyaltyScan(artistId);
    await incrementAgentRunCounter(artistId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
