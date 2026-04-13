import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runBusinessManager(artistId: string) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Get artist and setup data
  const [{ data: artist }, { data: setup }] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).single(),
    supabase
      .from("business_setup")
      .select("*")
      .eq("artist_id", artistId)
      .single(),
  ]);

  // Create setup record if it doesn't exist
  let currentSetup = setup;
  if (!currentSetup) {
    const { data: newSetup } = await supabase
      .from("business_setup")
      .insert({ artist_id: artistId })
      .select()
      .single();
    currentSetup = newSetup;
  }

  if (!currentSetup) {
    throw new Error("Failed to create business setup record");
  }

  // Auto-detect completed items from artist profile
  const updates: Record<string, unknown> = {};
  if (artist?.artist_name && !currentSetup.artist_name_chosen)
    updates.artist_name_chosen = true;
  if (artist?.genres?.length > 0 && !currentSetup.genre_defined)
    updates.genre_defined = true;
  if (artist?.goals?.length > 0 && !currentSetup.goals_defined)
    updates.goals_defined = true;
  if (
    artist?.pro_affiliation &&
    artist.pro_affiliation !== "None" &&
    !currentSetup.pro_registered
  ) {
    updates.pro_registered = true;
    updates.pro_name = artist.pro_affiliation;
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from("business_setup")
      .update(updates)
      .eq("id", currentSetup.id);
    currentSetup = { ...currentSetup, ...updates };
  }

  // Calculate phase progress
  const phase1Tasks = [
    "artist_name_chosen",
    "genre_defined",
    "goals_defined",
    "email_professional",
    "social_handles_secured",
  ];
  const phase2Tasks = [
    "llc_status",
    "ein_obtained",
    "business_bank_account",
    "pro_registered",
    "publisher_setup",
    "admin_deal",
  ];
  const phase3Tasks = [
    "daw_chosen",
    "home_studio_setup",
    "file_organization_system",
    "naming_convention_set",
    "metadata_template_created",
    "backup_system",
  ];
  const phase4Tasks = ["distribution_setup", "website_live", "epk_created"];

  const calcProgress = (tasks: string[]) => {
    const completed = tasks.filter((t) => {
      const val = currentSetup[t as keyof typeof currentSetup];
      if (typeof val === "boolean") return val;
      if (t === "llc_status")
        return val === "completed" || val === "not_needed";
      if (t === "daw_chosen") return !!val;
      return false;
    }).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const phase1_progress = calcProgress(phase1Tasks);
  const phase2_progress = calcProgress(phase2Tasks);
  const phase3_progress = calcProgress(phase3Tasks);
  const phase4_progress = calcProgress(phase4Tasks);
  const overall_progress = Math.round(
    (phase1_progress + phase2_progress + phase3_progress + phase4_progress) / 4
  );

  // Determine current phase
  let currentPhase = 1;
  if (phase1_progress >= 80) currentPhase = 2;
  if (phase2_progress >= 60) currentPhase = 3;
  if (phase3_progress >= 60) currentPhase = 4;

  // Get AI recommendations
  const systemPrompt = `You are an AI business manager for independent music artists. You help them set up their music business step by step, in simple language with no jargon.

Based on the artist's current setup progress, recommend the 3-5 most important next steps. Focus on what unlocks income first.

Explain each recommendation like you're talking to a friend who knows nothing about the music business. Keep it simple and actionable.

Return JSON:
{
  "recommendations": [
    {
      "title": "short action title",
      "description": "2-3 sentences explaining what to do and WHY in simple terms",
      "priority": "high" | "medium" | "low",
      "phase": 1-4,
      "estimated_time": "e.g. 30 minutes, 1 hour, 1 day",
      "cost": "free" | "$" | "$$" | "$$$"
    }
  ],
  "current_focus": "1 sentence about what they should focus on right now",
  "encouragement": "1 sentence of encouragement based on their progress"
}`;

  const userMessage = `Artist: ${artist?.artist_name || "Unknown"}
Genres: ${artist?.genres?.join(", ") || "Not set"}

CURRENT PROGRESS:
Phase 1 (Foundation): ${phase1_progress}%
- Artist name: ${currentSetup.artist_name_chosen ? "Done" : "Not done"}
- Genre defined: ${currentSetup.genre_defined ? "Done" : "Not done"}
- Goals defined: ${currentSetup.goals_defined ? "Done" : "Not done"}
- Professional email: ${currentSetup.email_professional ? "Done" : "Not done"}
- Social handles: ${currentSetup.social_handles_secured ? "Done" : "Not done"}

Phase 2 (Legal + Money): ${phase2_progress}%
- LLC: ${currentSetup.llc_status}${currentSetup.llc_state ? " (" + currentSetup.llc_state + ")" : ""}
- EIN: ${currentSetup.ein_obtained ? "Done" : "Not done"}
- Business bank account: ${currentSetup.business_bank_account ? "Done" : "Not done"}
- PRO registered: ${currentSetup.pro_registered ? "Done (" + currentSetup.pro_name + ")" : "Not done"}
- Publisher: ${currentSetup.publisher_setup ? "Done" : "Not done"}
- Admin deal: ${currentSetup.admin_deal ? "Done" : "Not done"}

Phase 3 (Music Infrastructure): ${phase3_progress}%
- DAW: ${currentSetup.daw_chosen || "Not chosen"}
- Home studio: ${currentSetup.home_studio_setup ? "Set up" : "Not set up"}
- File organization: ${currentSetup.file_organization_system ? "Done" : "Not done"}
- Naming convention: ${currentSetup.naming_convention_set ? "Done" : "Not done"}
- Metadata template: ${currentSetup.metadata_template_created ? "Done" : "Not done"}
- Backup system: ${currentSetup.backup_system ? "Done" : "Not done"}

Phase 4 (Growth Ready): ${phase4_progress}%
- Sync-ready tracks: ${currentSetup.sync_ready_tracks}
- Distribution: ${currentSetup.distribution_setup ? "Done (" + currentSetup.distributor_name + ")" : "Not done"}
- Website: ${currentSetup.website_live ? "Live" : "Not done"}
- EPK: ${currentSetup.epk_created ? "Created" : "Not done"}

What should this artist focus on next? Be specific and practical.`;

  const response = await callLLM({
    systemPrompt,
    userMessage,
    jsonMode: true,
    maxTokens: 1500,
    temperature: 0.4,
  });

  const parsed = JSON.parse(response.content);

  // Update progress and recommendations
  await supabase
    .from("business_setup")
    .update({
      phase: currentPhase,
      phase1_progress,
      phase2_progress,
      phase3_progress,
      phase4_progress,
      overall_progress,
      ai_recommendations: parsed.recommendations || [],
      last_agent_run: new Date().toISOString(),
    })
    .eq("id", currentSetup.id);

  // Log
  await supabase.from("agent_logs").insert({
    artist_id: artistId,
    agent_type: "business_manager",
    action: "setup_scan",
    summary: parsed.current_focus || "Scanned business setup",
    tokens_used: response.tokensUsed,
    duration_ms: Date.now() - startTime,
  });

  return {
    setup: {
      ...currentSetup,
      ...updates,
      phase: currentPhase,
      phase1_progress,
      phase2_progress,
      phase3_progress,
      phase4_progress,
      overall_progress,
    },
    recommendations: parsed.recommendations || [],
    current_focus: parsed.current_focus,
    encouragement: parsed.encouragement,
    tokensUsed: response.tokensUsed,
  };
}
