export type BriefStatus =
  | "draft"
  | "locked"
  | "delivered"
  | "disputed"
  | "resolved"
  | "fulfilled"
  | "cancelled"
  | "expired";

export type Verdict = "" | "FULFILLED" | "BREACHED" | "PARTIAL";

export interface Brief {
  brief_id: string;
  freelancer_address: string;
  freelancer_name: string;
  client_address: string;
  title: string;
  deliverables_text: string;
  price: string;
  deadline: string;
  sign_deadline: string;
  status: BriefStatus;
  delivery_text: string;
  delivery_link: string;
  dispute_text: string;
  dispute_link: string;
  verdict: Verdict;
  reasoning: string;
  confidence: string;
}

export interface FreelancerStats {
  fulfilled: number;
  breached: number;
  partial: number;
  current_streak: number;
  longest_streak: number;
}

export interface ClientStats {
  disputes_raised: number;
  disputes_upheld: number;
}

export interface Profile {
  address: string;
  as_freelancer: FreelancerStats;
  as_client: ClientStats;
}

import type { createAccount } from "genlayer-js";

export type Account = ReturnType<typeof createAccount>;

export type Screen =
  | "landing"
  | "create_brief"
  | "sign_brief"
  | "brief_detail"
  | "submit_delivery"
  | "submit_dispute"
  | "judging"
  | "my_briefs"
  | "explore"
  | "profile"
  | "import_key";