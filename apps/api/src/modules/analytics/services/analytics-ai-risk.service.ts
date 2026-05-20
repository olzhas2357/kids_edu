import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiRiskStudent } from '../types/analytics.types';
import type { AiRiskSqlRow } from '../repositories/analytics.repository';

@Injectable()
export class AnalyticsAiRiskService {
  constructor(private readonly config: ConfigService) {}

  analyze(rows: AiRiskSqlRow[]): {
    summary: {
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      reviewedStudents: number;
    };
    students: AiRiskStudent[];
  } {
    const weakThreshold = this.config.get<number>('analytics.weakStudentScoreThreshold', 70);
    const students = rows
      .map((row) => this.scoreStudent(row, weakThreshold))
      .filter((s) => s.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore);

    const summary = {
      criticalCount: students.filter((s) => s.riskLevel === 'critical').length,
      highCount: students.filter((s) => s.riskLevel === 'high').length,
      mediumCount: students.filter((s) => s.riskLevel === 'medium').length,
      reviewedStudents: rows.length,
    };

    return { summary, students: students.slice(0, 25) };
  }

  private scoreStudent(row: AiRiskSqlRow, weakThreshold: number): AiRiskStudent {
    const reasons: string[] = [];
    let riskScore = 0;

    const avgScore = row.average_score;
    const flagged = Number(row.flagged_attempts);
    const tabBlurs = Number(row.tab_blur_total);
    const pastes = Number(row.paste_total);
    const weakAi = Number(row.weak_ai_count);
    const attempts = Number(row.attempt_count);

    if (flagged > 0) {
      riskScore += 30 + flagged * 10;
      reasons.push(`Anti-cheat flagged on ${flagged} attempt(s)`);
    }
    if (pastes > 0) {
      riskScore += 25;
      reasons.push(`Paste detected ${pastes} time(s)`);
    }
    if (tabBlurs > 5) {
      riskScore += 15;
      reasons.push(`Excessive tab switching (${tabBlurs})`);
    }
    if (avgScore !== null && avgScore < weakThreshold) {
      riskScore += 20;
      reasons.push(`Low average score (${avgScore}%)`);
    }
    if (weakAi >= 2) {
      riskScore += 15;
      reasons.push(`AI marked performance as weak ${weakAi} time(s)`);
    }
    if (attempts >= 6) {
      riskScore += 10;
      reasons.push(`High retry volume (${attempts} attempts)`);
    }

    const riskLevel = this.toRiskLevel(riskScore);

    return {
      studentId: row.student_id,
      displayName: row.display_name,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      reasons,
      averageScore: avgScore,
      attemptCount: attempts,
      flaggedAttempts: flagged,
      tabBlurTotal: tabBlurs,
      pasteTotal: pastes,
      weakAiFeedbackCount: weakAi,
    };
  }

  private toRiskLevel(score: number): AiRiskStudent['riskLevel'] {
    if (score >= 60) return 'critical';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }
}
