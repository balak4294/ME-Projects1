import { useState } from 'react';
import { RotateCcw, Save, Sparkles } from 'lucide-react';
import type { RiskThresholds, Student } from '../types/edupredict';
import { DEFAULT_THRESHOLDS, getStudentRiskSummary } from '../utils/riskEngine';

interface AlertRulesScreenProps {
  thresholds: RiskThresholds;
  students: Student[];
  onApplyThresholds: (next: RiskThresholds) => void;
}

export function AlertRulesScreen({
  thresholds,
  students,
  onApplyThresholds,
}: AlertRulesScreenProps) {
  const [draft, setDraft] = useState<RiskThresholds>(thresholds);
  const [savedNotice, setSavedNotice] = useState(false);

  const previewCounts = students.reduce(
    (acc, stu) => {
      const { tier } = getStudentRiskSummary(stu, draft);
      acc[tier] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const handleSave = () => {
    onApplyThresholds(draft);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setDraft(DEFAULT_THRESHOLDS);
    onApplyThresholds(DEFAULT_THRESHOLDS);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className="lg:col-span-8 edu-card p-6 space-y-6">
        <div className="pb-4 border-b border-[#F1F5F9]">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Early-Warning Threshold Calibration
          </h2>
          <p className="text-xs text-[#434655] mt-1">
            Adjust institutional cutoffs to calibrate how EduPulse AI simulates risk alerts across all dashboards.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="rule-high-cutoff" className="text-sm font-semibold text-[#0F172A]">
                High-Risk Minimum Score
              </label>
              <span className="tabular-nums text-sm font-bold text-[#B91C1C]">
                {draft.highRiskMinScore} / 100
              </span>
            </div>
            <input
              id="rule-high-cutoff"
              type="range"
              min={55}
              max={90}
              value={draft.highRiskMinScore}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  highRiskMinScore: Number(e.target.value),
                  mediumRiskMinScore: Math.min(prev.mediumRiskMinScore, Number(e.target.value) - 10),
                }))
              }
              className="mt-2 w-full accent-[#2563EB] cursor-pointer"
            />
            <p className="mt-1 text-xs text-[#434655]">
              Students scoring at or above this threshold enter the Priority Attention Queue immediately.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="rule-med-cutoff" className="text-sm font-semibold text-[#0F172A]">
                Medium-Risk Minimum Score
              </label>
              <span className="tabular-nums text-sm font-bold text-[#92400E]">
                {draft.mediumRiskMinScore} / 100
              </span>
            </div>
            <input
              id="rule-med-cutoff"
              type="range"
              min={25}
              max={draft.highRiskMinScore - 10}
              value={draft.mediumRiskMinScore}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, mediumRiskMinScore: Number(e.target.value) }))
              }
              className="mt-2 w-full accent-[#2563EB] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-[#F1F5F9]">
            <div>
              <label htmlFor="rule-lms-days" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                LMS Inactivity Trigger (Days)
              </label>
              <input
                id="rule-lms-days"
                type="number"
                min={3}
                max={21}
                value={draft.lmsInactivityAlertDays}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    lmsInactivityAlertDays: Math.max(3, Math.min(21, Number(e.target.value) || 3)),
                  }))
                }
                className="edu-input w-full px-3 text-sm tabular-nums text-[#0F172A]"
              />
            </div>

            <div>
              <label htmlFor="rule-attendance-floor" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Attendance Floor (%)
              </label>
              <input
                id="rule-attendance-floor"
                type="number"
                min={50}
                max={95}
                value={draft.attendanceFloorPct}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    attendanceFloorPct: Math.max(50, Math.min(95, Number(e.target.value) || 50)),
                  }))
                }
                className="edu-input w-full px-3 text-sm tabular-nums text-[#0F172A]"
              />
            </div>

            <div>
              <label htmlFor="rule-missing-tasks" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Missing Work Trigger
              </label>
              <input
                id="rule-missing-tasks"
                type="number"
                min={1}
                max={10}
                value={draft.autoFlagMissingAssignments}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    autoFlagMissingAssignments: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                  }))
                }
                className="edu-input w-full px-3 text-sm tabular-nums text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-semibold text-[#166534]">
                Thresholds applied to cohort
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Apply Thresholds</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Cohort Impact Preview */}
      <aside className="lg:col-span-4 edu-ai-panel p-6 space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-semibold text-[#6B38D4]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>AI Calibration Preview</span>
        </span>
        <h3 className="text-base font-semibold text-[#0F172A]">
          Projected Cohort Distribution
        </h3>
        <p className="text-xs text-[#434655] leading-relaxed">
          Live impact on the {students.length} monitored students before applying rules:
        </p>

        <div className="space-y-3 pt-2 border-t border-[#DDD6FE]">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#B91C1C]">High Risk</span>
            <span className="font-bold text-[#B91C1C] tabular-nums">
              {previewCounts.high} students
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#92400E]">Medium Risk</span>
            <span className="font-bold text-[#92400E] tabular-nums">
              {previewCounts.medium} students
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#166534]">Low Risk</span>
            <span className="font-bold text-[#166534] tabular-nums">
              {previewCounts.low} students
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
