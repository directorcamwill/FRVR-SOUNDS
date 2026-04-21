// Unified "Next Move" shape — feeds the Command Center v2 NextMoves stack,
// which merges orchestrator priority_actions + daily_tasks + alerts into a
// single ranked list (UPGRADE_SPEC [03]).

export type MoveUrgency = "high" | "medium" | "low";
export type MoveSource = "orchestrator" | "task" | "review_queue";
export type MoveCategory =
  | "intelligence"
  | "creation"
  | "finishing"
  | "delivery"
  | "ecosystem";

export interface Move {
  id: string;
  title: string;
  description: string;
  urgency: MoveUrgency;
  confidence: number | null;
  category: MoveCategory;
  action_url: string;
  source: MoveSource;
}
