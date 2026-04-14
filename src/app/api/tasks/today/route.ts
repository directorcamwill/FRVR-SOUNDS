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

  const today = new Date().toISOString().split("T")[0];

  // Get today's tasks
  const { data: todayTasks, error: todayError } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("artist_id", artist.id)
    .eq("due_date", today)
    .order("priority", { ascending: true });

  if (todayError)
    return NextResponse.json({ error: todayError.message }, { status: 500 });

  // Get overdue tasks
  const { data: overdueTasks, error: overdueError } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("artist_id", artist.id)
    .lt("due_date", today)
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true });

  if (overdueError)
    return NextResponse.json(
      { error: overdueError.message },
      { status: 500 }
    );

  return NextResponse.json({
    today: todayTasks || [],
    overdue: overdueTasks || [],
    total_today: todayTasks?.length || 0,
    total_overdue: overdueTasks?.length || 0,
    done_today:
      todayTasks?.filter((t) => t.status === "done").length || 0,
  });
}
