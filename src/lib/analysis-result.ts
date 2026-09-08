/**
 * Maps a stored AI analysis onto the shape the existing analysis screen renders.
 */

import type { AiAnalysisResult } from "@/lib/citizen-data";
import type { ChallengeAiAnalysis } from "@/lib/analysis.functions";
import type { Priority } from "@/lib/civicx-data";
import { toEmergencyStatus, toThreatLevel, type EmergencyService } from "@/lib/emergency-data";

export function toAnalysisResult(
  analysis: ChallengeAiAnalysis,
  challengeId: string,
): AiAnalysisResult {
  return {
    category: analysis.category,
    priority: analysis.priority as Priority,
    confidence: Math.round(analysis.confidence * 100),
    impact:
      analysis.estimatedImpact === null
        ? "Not enough data to estimate"
        : `~${analysis.estimatedImpact.toLocaleString()} citizens (AI estimate)`,
    skills: analysis.recommendedSkills,
    summary: analysis.summary,
    stakeholders: analysis.affectedStakeholders,
    directions: analysis.solutionDirections,
    missionCode: `MISSION #${challengeId.slice(0, 4).toUpperCase()}`,
    threat: {
      level: toThreatLevel(analysis.threatLevel),
      category: analysis.threatCategory || null,
      reason: analysis.threatReason || null,
      service: (analysis.recommendedService as EmergencyService) || null,
      status: toEmergencyStatus(analysis.emergencyStatus),
      escalatedAt: null,
      locationName: analysis.reportedLocation,
      latitude: analysis.latitude,
      longitude: analysis.longitude,
    },
  };
}

