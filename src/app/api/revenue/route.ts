import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!artist)
    return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  // Get all revenue streams
  const { data: streams } = await supabase
    .from("revenue_streams")
    .select("id, type")
    .eq("artist_id", artist.id);

  const streamIds = streams?.map((s) => s.id) || [];

  // Get all entries
  const { data: entries } = await supabase
    .from("revenue_entries")
    .select("*")
    .in("stream_id", streamIds.length > 0 ? streamIds : ["00000000-0000-0000-0000-000000000000"])
    .order("received_date", { ascending: false });

  const allEntries = entries || [];

  // Total income
  const totalIncome = allEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  // This month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const thisMonth = allEntries
    .filter((e) => e.received_date >= thisMonthStart)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
  const lastMonth = allEntries
    .filter((e) => e.received_date >= lastMonthStart && e.received_date <= lastMonthEnd)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // By type
  const streamTypeMap = new Map(streams?.map((s) => [s.id, s.type]) || []);
  const byTypeMap = new Map<string, number>();
  for (const entry of allEntries) {
    const type = streamTypeMap.get(entry.stream_id) || "other";
    byTypeMap.set(type, (byTypeMap.get(type) || 0) + Number(entry.amount));
  }
  const byType = Array.from(byTypeMap.entries()).map(([type, total]) => ({ type, total }));

  // Monthly (last 6 months)
  const monthly: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString().split("T")[0];
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
    const total = allEntries
      .filter((e) => e.received_date >= monthStart && e.received_date <= monthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    monthly.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      total,
    });
  }

  return NextResponse.json({
    total_income: totalIncome,
    this_month: thisMonth,
    last_month: lastMonth,
    by_type: byType,
    monthly,
  });
}
