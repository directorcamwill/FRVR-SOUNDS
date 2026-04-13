import { callLLM } from "./utils/llm";
import { createAdminClient } from "@/lib/supabase/admin";

// ==========================================
// STATE-SPECIFIC LLC DATA
// ==========================================
const STATE_LLC_DATA: Record<
  string,
  { filing_fee: number; annual_fee: number; notes: string; online_filing: boolean }
> = {
  Alabama: { filing_fee: 200, annual_fee: 0, notes: "No annual report fee for first year", online_filing: true },
  Alaska: { filing_fee: 250, annual_fee: 100, notes: "Biennial report required", online_filing: true },
  Arizona: { filing_fee: 50, annual_fee: 0, notes: "No annual report required", online_filing: true },
  Arkansas: { filing_fee: 45, annual_fee: 150, notes: "Annual franchise tax", online_filing: true },
  California: { filing_fee: 70, annual_fee: 800, notes: "Annual franchise tax of $800 minimum — consider this before filing", online_filing: true },
  Colorado: { filing_fee: 50, annual_fee: 10, notes: "Very affordable state for LLCs", online_filing: true },
  Connecticut: { filing_fee: 120, annual_fee: 80, notes: "Annual report required", online_filing: true },
  Delaware: { filing_fee: 90, annual_fee: 300, notes: "Popular for business-friendly laws but not needed for solo artists", online_filing: true },
  Florida: { filing_fee: 125, annual_fee: 138, notes: "Annual report required", online_filing: true },
  Georgia: { filing_fee: 100, annual_fee: 50, notes: "Annual registration required", online_filing: true },
  Hawaii: { filing_fee: 50, annual_fee: 15, notes: "Very affordable", online_filing: true },
  Idaho: { filing_fee: 100, annual_fee: 0, notes: "No annual report fee", online_filing: true },
  Illinois: { filing_fee: 150, annual_fee: 75, notes: "Annual report required", online_filing: true },
  Indiana: { filing_fee: 95, annual_fee: 31, notes: "Biennial report", online_filing: true },
  Iowa: { filing_fee: 50, annual_fee: 60, notes: "Biennial report", online_filing: true },
  Kansas: { filing_fee: 160, annual_fee: 55, notes: "Annual report required", online_filing: true },
  Kentucky: { filing_fee: 40, annual_fee: 15, notes: "Very affordable state", online_filing: true },
  Louisiana: { filing_fee: 100, annual_fee: 35, notes: "Annual report required", online_filing: true },
  Maine: { filing_fee: 175, annual_fee: 85, notes: "Annual report required", online_filing: true },
  Maryland: { filing_fee: 100, annual_fee: 300, notes: "Annual report + personal property tax", online_filing: true },
  Massachusetts: { filing_fee: 500, annual_fee: 500, notes: "Expensive state — consider if worth it at your income level", online_filing: true },
  Michigan: { filing_fee: 50, annual_fee: 25, notes: "Very affordable", online_filing: true },
  Minnesota: { filing_fee: 155, annual_fee: 0, notes: "No annual report fee", online_filing: true },
  Mississippi: { filing_fee: 50, annual_fee: 0, notes: "No annual report fee", online_filing: true },
  Missouri: { filing_fee: 50, annual_fee: 0, notes: "No annual report required", online_filing: true },
  Montana: { filing_fee: 70, annual_fee: 20, notes: "Annual report required", online_filing: true },
  Nebraska: { filing_fee: 105, annual_fee: 13, notes: "Biennial report", online_filing: true },
  Nevada: { filing_fee: 75, annual_fee: 350, notes: "No state income tax but high annual fees", online_filing: true },
  "New Hampshire": { filing_fee: 100, annual_fee: 100, notes: "Annual report required", online_filing: true },
  "New Jersey": { filing_fee: 125, annual_fee: 75, notes: "Annual report required", online_filing: true },
  "New Mexico": { filing_fee: 50, annual_fee: 0, notes: "No annual report — great for small businesses", online_filing: true },
  "New York": { filing_fee: 200, annual_fee: 9, notes: "Must publish in newspapers ($500-$1500 in NYC area)", online_filing: true },
  "North Carolina": { filing_fee: 125, annual_fee: 200, notes: "Annual report required", online_filing: true },
  "North Dakota": { filing_fee: 135, annual_fee: 50, notes: "Annual report required", online_filing: true },
  Ohio: { filing_fee: 99, annual_fee: 0, notes: "No annual report — easy state", online_filing: true },
  Oklahoma: { filing_fee: 100, annual_fee: 25, notes: "Annual report required", online_filing: true },
  Oregon: { filing_fee: 100, annual_fee: 100, notes: "Annual report required", online_filing: true },
  Pennsylvania: { filing_fee: 125, annual_fee: 7, notes: "Decennial report (every 10 years)", online_filing: true },
  "Rhode Island": { filing_fee: 150, annual_fee: 50, notes: "Annual report required", online_filing: true },
  "South Carolina": { filing_fee: 110, annual_fee: 0, notes: "No annual report fee", online_filing: true },
  "South Dakota": { filing_fee: 150, annual_fee: 50, notes: "Annual report required", online_filing: true },
  Tennessee: { filing_fee: 300, annual_fee: 300, notes: "Annual report required — on the expensive side", online_filing: true },
  Texas: { filing_fee: 300, annual_fee: 0, notes: "No annual report but franchise tax applies if revenue > $2.47M", online_filing: true },
  Utah: { filing_fee: 54, annual_fee: 18, notes: "Very affordable", online_filing: true },
  Vermont: { filing_fee: 125, annual_fee: 35, notes: "Annual report required", online_filing: true },
  Virginia: { filing_fee: 100, annual_fee: 50, notes: "Annual registration required", online_filing: true },
  Washington: { filing_fee: 200, annual_fee: 60, notes: "Annual report required, no state income tax", online_filing: true },
  "West Virginia": { filing_fee: 100, annual_fee: 25, notes: "Annual report required", online_filing: true },
  Wisconsin: { filing_fee: 130, annual_fee: 25, notes: "Annual report required", online_filing: true },
  Wyoming: { filing_fee: 100, annual_fee: 60, notes: "Popular for privacy, no state income tax", online_filing: true },
  "Washington DC": { filing_fee: 99, annual_fee: 300, notes: "Biennial report required", online_filing: true },
};

const RECOMMENDED_SERVICES = [
  { name: "State Website (DIY)", cost: "Free (just filing fee)", difficulty: "medium", best_for: "People comfortable with forms" },
  { name: "ZenBusiness", cost: "$0 + state fee", difficulty: "easy", best_for: "Beginners who want hand-holding" },
  { name: "Northwest Registered Agent", cost: "$39 + state fee", difficulty: "easy", best_for: "Privacy-conscious artists" },
  { name: "LegalZoom", cost: "$79 + state fee", difficulty: "easy", best_for: "People who want a known brand" },
  { name: "Incfile", cost: "$0 + state fee", difficulty: "easy", best_for: "Budget-conscious beginners" },
];

// ==========================================
// EXPORTS: State list + services for UI
// ==========================================
export const ALL_STATES = Object.keys(STATE_LLC_DATA);
export const LLC_SERVICES = RECOMMENDED_SERVICES;

// ==========================================
// CORE DECISION ENGINE (NO LLM)
// ==========================================

export interface LLCInput {
  career_stage: string;
  annual_music_income: number;
  monthly_music_income: number;
  revenue_streams: string[];
  release_frequency: string;
  sync_activity: string;
  has_existing_business: boolean;
  llc_status: string;
  state: string | null;
}

export interface LLCTask {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "not_needed";
  estimated_time: string;
  cost: string;
  order: number;
}

export interface LLCReadinessResult {
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  factors: { factor: string; points: number; met: boolean }[];
}

export function calculateLLCReadiness(input: LLCInput): LLCReadinessResult {
  const factors: { factor: string; points: number; met: boolean }[] = [];
  let score = 0;

  const incomeHigh = input.annual_music_income > 1000;
  factors.push({ factor: "Annual music income > $1,000", points: 25, met: incomeHigh });
  if (incomeHigh) score += 25;

  const multiStream = input.revenue_streams.length >= 2;
  factors.push({ factor: "Multiple revenue streams", points: 15, met: multiStream });
  if (multiStream) score += 15;

  const syncActive = input.sync_activity !== "none";
  factors.push({ factor: "Active in sync licensing", points: 15, met: syncActive });
  if (syncActive) score += 15;

  const releasing = input.release_frequency === "consistent";
  factors.push({ factor: "Consistent release schedule", points: 15, met: releasing });
  if (releasing) score += 15;

  const professional = input.career_stage === "professional";
  factors.push({ factor: "Professional career stage", points: 20, met: professional });
  if (professional) score += 20;

  const existingBiz = input.has_existing_business;
  factors.push({ factor: "Existing business activity", points: 10, met: existingBiz });
  if (existingBiz) score += 10;

  const level = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  return { score, level, factors };
}

export function getLLCDecision(level: "HIGH" | "MEDIUM" | "LOW"): {
  recommendation: "START_LLC_NOW";
  urgency: "high" | "medium";
} {
  // Always recommend starting — every artist should have an LLC
  if (level === "HIGH") return { recommendation: "START_LLC_NOW", urgency: "high" };
  return { recommendation: "START_LLC_NOW", urgency: "medium" };
}

export function getStateInfo(state: string | null) {
  if (!state) return null;
  return STATE_LLC_DATA[state] || null;
}

export function generateLLCTasks(
  input: LLCInput & { llc_name?: string; ein_obtained: boolean; business_bank_account: boolean }
): LLCTask[] {
  const tasks: LLCTask[] = [];
  let order = 1;

  if (input.llc_status !== "completed" && input.llc_status !== "not_needed") {
    tasks.push({
      id: "choose_state",
      title: "Choose your state of registration",
      description: input.state
        ? `You selected ${input.state}. Most artists file in the state where they live.`
        : "File in the state where you live. That's almost always the right choice for solo artists.",
      status: input.state ? "completed" : "pending",
      estimated_time: "5 minutes",
      cost: "Free",
      order: order++,
    });

    tasks.push({
      id: "choose_name",
      title: "Choose your LLC name",
      description: "Use your artist name or brand name + 'LLC'. Example: 'FRVR Music LLC'",
      status: input.llc_name ? "completed" : "pending",
      estimated_time: "10 minutes",
      cost: "Free",
      order: order++,
    });

    tasks.push({
      id: "check_name",
      title: "Check name availability",
      description: input.state
        ? `Search your state's business registry to make sure no one else has this name. Google '${input.state} business name search'.`
        : "Search your state's Secretary of State website for name availability.",
      status: "pending",
      estimated_time: "10 minutes",
      cost: "Free",
      order: order++,
    });

    const stateInfo = getStateInfo(input.state);
    tasks.push({
      id: "file_llc",
      title: `File your LLC${input.state ? " in " + input.state : ""}`,
      description: stateInfo
        ? `Filing fee: $${stateInfo.filing_fee}. ${stateInfo.notes}. ${stateInfo.online_filing ? "You can file online." : "Paper filing required."}`
        : "File through your state's Secretary of State website or use a service like ZenBusiness.",
      status: input.llc_status === "completed" ? "completed" : "pending",
      estimated_time: "20-30 minutes",
      cost: stateInfo ? `$${stateInfo.filing_fee}` : "$50-$500",
      order: order++,
    });
  }

  tasks.push({
    id: "get_ein",
    title: "Get your EIN (Tax ID)",
    description: "Free from IRS.gov. Takes 5 minutes online. You need this for your bank account and to receive payments.",
    status: input.ein_obtained ? "completed" : "pending",
    estimated_time: "5 minutes",
    cost: "Free",
    order: order++,
  });

  tasks.push({
    id: "bank_account",
    title: "Open a business bank account",
    description: "Keep music money separate from personal. Most banks offer free business checking. Bring your LLC docs and EIN.",
    status: input.business_bank_account ? "completed" : "pending",
    estimated_time: "30 minutes (at bank)",
    cost: "Free",
    order: order++,
  });

  tasks.push({
    id: "payment_routing",
    title: "Set up payment routing",
    description: "Connect your business bank account to your distributor, PRO, sync libraries, and any other income sources.",
    status: "pending",
    estimated_time: "30 minutes",
    cost: "Free",
    order: order++,
  });

  return tasks;
}

export function generateWarnings(
  input: LLCInput,
  stateInfo: ReturnType<typeof getStateInfo>
): string[] {
  const warnings: string[] = [];

  if (stateInfo && stateInfo.annual_fee >= 500) {
    warnings.push(
      `${input.state} has a $${stateInfo.annual_fee}/year fee. Make sure your music income justifies this cost.`
    );
  }

  if (input.state === "California" && input.annual_music_income < 5000) {
    warnings.push(
      "California charges $800/year minimum franchise tax. Factor this into your budget — it's a real business expense but worth it for the protection and professionalism."
    );
  }

  if (input.state === "New York") {
    warnings.push(
      "New York requires publishing your LLC formation in newspapers, which can cost $500-$1,500 in the NYC area."
    );
  }

  warnings.push("Never mix personal and business money once your LLC is set up.");
  warnings.push("You'll need this setup to receive sync licensing payments professionally.");

  if (input.annual_music_income === 0) {
    warnings.push(
      "You're not generating music income yet — but that's exactly why to set up now. When income starts coming in, you'll be ready to receive it professionally."
    );
  }

  return warnings;
}

// ==========================================
// FULL LLC AGENT RUN
// ==========================================
export async function runLLCAgent(artistId: string, useAI: boolean = true) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  const [{ data: artist }, { data: setup }] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).single(),
    supabase.from("business_setup").select("*").eq("artist_id", artistId).single(),
  ]);

  if (!setup) throw new Error("No business setup record found");

  // Build input from setup data
  const input: LLCInput & {
    llc_name?: string;
    ein_obtained: boolean;
    business_bank_account: boolean;
  } = {
    career_stage: setup.career_stage || "beginner",
    annual_music_income: setup.annual_music_income || 0,
    monthly_music_income: setup.monthly_music_income || 0,
    revenue_streams: setup.revenue_streams || [],
    release_frequency: setup.release_frequency || "none",
    sync_activity: setup.sync_activity || "none",
    has_existing_business: setup.llc_status === "completed",
    llc_status: setup.llc_status || "not_started",
    state: setup.llc_state || null,
    llc_name: setup.llc_name || undefined,
    ein_obtained: setup.ein_obtained || false,
    business_bank_account: setup.business_bank_account || false,
  };

  // Run pure logic engine
  const readiness = calculateLLCReadiness(input);
  const decision = getLLCDecision(readiness.level);
  const stateInfo = getStateInfo(input.state);
  const tasks = generateLLCTasks(input);
  const warnings = generateWarnings(input, stateInfo);
  const services = RECOMMENDED_SERVICES;

  // Find next pending task
  const nextTask = tasks.find((t) => t.status === "pending");

  // Generate AI explanation if requested
  let explanation = "";
  let tokensUsed = 0;

  if (useAI) {
    const systemPrompt = `You are a friendly, motivating business advisor for music artists. Explain LLC setup in plain, simple language. No jargon. Talk like a supportive friend who's excited to help them level up.

IMPORTANT: ALWAYS encourage the artist to start their LLC. Never suggest waiting or delaying. Every artist benefits from having an LLC — it's the foundation of a professional music business.

Based on the data, explain:
1. WHY they should get their LLC set up now — be specific to their situation (2-3 sentences)
2. What their specific next step is and how easy it is (1-2 sentences)

Be encouraging and make it feel achievable, not overwhelming.

Return JSON:
{
  "explanation": "your motivating explanation here",
  "next_step_detail": "specific detail about the next action"
}`;

    const userMessage = `Artist: ${artist?.artist_name}
State: ${input.state || "Not chosen"}
Career Stage: ${input.career_stage}
Annual Music Income: $${input.annual_music_income}
Revenue Streams: ${input.revenue_streams.join(", ") || "None"}
Sync Activity: ${input.sync_activity}
LLC Status: ${input.llc_status}
Readiness Score: ${readiness.score}/100 (${readiness.level})
Decision: ${decision.recommendation}`;

    try {
      const response = await callLLM({
        systemPrompt,
        userMessage,
        jsonMode: true,
        maxTokens: 500,
        temperature: 0.3,
      });
      const parsed = JSON.parse(response.content);
      explanation = parsed.explanation || "";
      tokensUsed = response.tokensUsed;
    } catch {
      // Fallback to static explanation — always encourage starting
      if (readiness.level === "HIGH") {
        explanation =
          "You're in a great position to set up your LLC right now. This protects your personal assets, lets you receive sync payments professionally, and shows the industry you're serious. Let's get it done.";
      } else if (readiness.level === "MEDIUM") {
        explanation =
          "Now is the perfect time to get your LLC set up. Having your business structure in place means you're ready to accept payments the moment opportunities come in. Don't wait — get ahead of the game.";
      } else {
        explanation =
          "Setting up your LLC early is one of the smartest moves you can make. It costs less than you think, takes less than an hour, and means you're ready to get paid from day one. Let's get you started.";
      }
    }
  } else {
    // Static explanation — always push to start
    if (readiness.level === "HIGH") {
      explanation =
        "You're ready. Setting up your LLC protects your personal assets and lets you receive payments professionally. This is the foundation everything else is built on.";
    } else if (readiness.level === "MEDIUM") {
      explanation =
        "Getting your LLC set up now puts you ahead of most artists. When sync placements and opportunities come, you'll be ready to get paid immediately. Let's knock this out.";
    } else {
      explanation =
        "Every serious artist needs an LLC. It's cheaper and faster than you think. Getting this done now means you're business-ready from the start — no scrambling later when money is on the table.";
    }
  }

  // Update database
  await supabase
    .from("business_setup")
    .update({
      llc_readiness_score: readiness.score,
      llc_readiness_level: readiness.level,
      llc_decision: decision.recommendation,
      llc_explanation: explanation,
      llc_tasks: tasks,
      llc_warnings: warnings,
      llc_next_action: nextTask || null,
      llc_filing_cost: stateInfo?.filing_fee || null,
      llc_annual_cost: stateInfo?.annual_fee || null,
      llc_recommended_service: services[1].name, // ZenBusiness as default
    })
    .eq("id", setup.id);

  // Log
  await supabase.from("agent_logs").insert({
    artist_id: artistId,
    agent_type: "llc_agent",
    action: "readiness_scan",
    summary: `LLC Readiness: ${readiness.score}/100 (${readiness.level}) — ${decision.recommendation}`,
    details: {
      score: readiness.score,
      level: readiness.level,
      decision: decision.recommendation,
      state: input.state,
    },
    tokens_used: tokensUsed,
    duration_ms: Date.now() - startTime,
  });

  return {
    readiness,
    decision,
    explanation,
    stateInfo,
    tasks,
    warnings,
    services,
    nextAction: nextTask,
    tokensUsed,
  };
}
