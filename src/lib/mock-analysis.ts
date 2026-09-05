/**
 * TEMPORARY mock analysis layer.
 *
 * Gemini is NOT connected yet. This module is the ONLY place that produces
 * analysis values — when the real model lands, replace `analyseChallenge` with
 * an API call that returns the same shape. Nothing else needs to change.
 */

import type { AiAnalysisResult } from "@/lib/citizen-data";
import { demoAnalysis } from "@/lib/citizen-data";
import type { Priority } from "@/lib/civicx-data";

export interface ChallengeAnalysis {
  category: string;
  priority: Priority;
  aiConfidence: number;
  estimatedImpact: number;
  aiSummary: string;
  recommendedSkills: string[];
}

const skillsByCategory: Record<string, string[]> = {
  Water: ["Water Management", "IoT", "Civil Engineering", "Data Analytics"],
  Waste: ["Waste Management", "IoT", "Data Analytics", "Urban Planning"],
  Education: ["Education Policy", "Community Outreach", "Data Analytics"],
  Healthcare: ["Public Health", "Data Analytics", "Community Outreach"],
  Infrastructure: ["Civil Engineering", "Urban Planning", "Structural Analysis"],
  "Public Safety": ["Urban Safety", "Computer Vision", "Data Analytics"],
  Environment: ["Environmental Science", "Remote Sensing", "Data Analytics"],
  Other: ["Data Analytics", "Urban Planning", "Community Outreach"],
};

const categoryLabel: Record<string, string> = {
  Waste: "Waste Management",
  Water: "Water & Sanitation",
  Infrastructure: "Urban Infrastructure",
};

/** Placeholder analysis derived locally from the report itself. */
export function analyseChallenge(input: {
  title: string;
  description: string;
  category: string | null;
  locationName: string | null;
}): ChallengeAnalysis {
  const category = input.category ?? "Other";
  const label = categoryLabel[category] ?? category;
  const skills = skillsByCategory[category] ?? skillsByCategory["Other"]!;

  return {
    category: label,
    priority: demoAnalysis.priority,
    aiConfidence: demoAnalysis.confidence,
    estimatedImpact: 12_400,
    aiSummary: `Reported near ${
      input.locationName ?? "the selected location"
    }. The issue appears to affect nearby residential and educational areas.`,
    recommendedSkills: skills,
  };
}

/** Map the analysis onto the shape the existing AI screen renders. */
export function toAnalysisResult(
  analysis: ChallengeAnalysis,
  challengeId: string,
): AiAnalysisResult {
  return {
    category: analysis.category,
    priority: analysis.priority,
    confidence: analysis.aiConfidence,
    impact: `${analysis.estimatedImpact.toLocaleString()} citizens`,
    skills: analysis.recommendedSkills,
    summary: analysis.aiSummary,
    missionCode: `MISSION #${challengeId.slice(0, 4).toUpperCase()}`,
  };
}
