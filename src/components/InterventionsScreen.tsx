import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Edit3, Plus, Sparkles, X } from 'lucide-react';
import type {
  Intervention,
  InterventionChannel,
  InterventionStatus,
  Student,
} from '../types/edupredict';
import { formatDateDDMMYYYY, toIsoDate } from '../utils/riskEngine';

interface InterventionsScreenProps {
  interventions: Intervention[];
  students: Student[];
  preselectedStudentId?: string | null;
  onClearPreselectedStudent?: () => void;
  onAdvanceStatus: (interventionId: string, nextStatus: InterventionStatus) => void;
  onUpdateRemarks: (interventionId: string, remarks: string) => void;
  onCreateIntervention: (payload: {
    studentId: string;
    title: string;
    identifiedProblem: string;
    recommendedAction: string;
    channel: InterventionChannel;
    dueDate: string;
    facultyRemarks: string;
  }) => void;
  onInspectStudent: (studentId: string) => void;
}

const STATUS_BADGE: Record<
  InterventionStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    dot: 'bg-[#F59E0B]',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1D4ED8]',
    dot: 'bg-[#2563EB]',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#166534]',
    dot: 'bg-[#22C55E]',
  },
};

export function InterventionsScreen({
  interventions,
  students,
  preselectedStudentId,
  onClearPreselectedStudent,
  onAdvanceStatus,
  onUpdateRemarks,
  onCreateIntervention,
  onInspectStudent,
}: InterventionsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | InterventionStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [identifiedProblem, setIdentifiedProblem] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [channel, setChannel] = useState<InterventionChannel>('Faculty Mentoring');
  const [dueDateIso, setDueDateIso] = useState('2026-11-28');
  const [facultyRemarks, setFacultyRemarks] = useState('');
  const [formError, setFormError] = useState('');

  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState('');

  useEffect(() => {
    if (preselectedStudentId) {
      const stu = students.find((s) => s.id === preselectedStudentId);
      if (stu) {
        setStudentId(stu.id);
        setIdentifiedProblem(
          stu.riskDrivers[0]?.label ??
            `Attendance at ${stu.attendanceRate}% and IA avg ${stu.internalMarksAvg}%`
        );
        setRecommendedAction(stu.recommendedPathway.title);
        setChannel(stu.recommendedPathway.channel);
        setIsModalOpen(true);
      }
      onClearPreselectedStudent?.();
    }
  }, [preselectedStudentId, students, onClearPreselectedStudent]);

  const filtered = interventions.filter((item) =>
    statusFilter === 'all' ? true : item.status === statusFilter
  );

  const pendingCount = interventions.filter((i) => i.status === 'pending').length;
  const inProgressCount = interventions.filter((i) => i.status === 'in_progress').length;
  const completedCount = interventions.filter((i) => i.status === 'completed').length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !studentId ||
      identifiedProblem.trim().length < 4 ||
      recommendedAction.trim().length < 4
    ) {
      setFormError(
        'Select a student and describe both the identified problem and recommended action.'
      );
      return;
    }
    onCreateIntervention({
      studentId,
      title: recommendedAction.trim(),
      identifiedProblem: identifiedProblem.trim(),
      recommendedAction: recommendedAction.trim(),
      channel,
      dueDate: formatDateDDMMYYYY(dueDateIso),
      facultyRemarks:
        facultyRemarks.trim() || 'Initial improvement plan assigned.',
    });
    setIdentifiedProblem('');
    setRecommendedAction('');
    setFacultyRemarks('');
    setFormError('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="edu-card p-5">
          <p className="text-xs font-semibold text-[#434655]">Pending Plans</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#92400E] tabular-nums">
            {pendingCount}
          </p>
          <p className="mt-1 text-xs text-[#434655]">Awaiting student start / check-in</p>
        </div>
        <div className="edu-card p-5">
          <p className="text-xs font-semibold text-[#434655]">In Progress</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#2563EB] tabular-nums">
            {inProgressCount}
          </p>
          <p className="mt-1 text-xs text-[#434655]">Active coaching &amp; mentoring</p>
        </div>
        <div className="edu-card p-5">
          <p className="text-xs font-semibold text-[#434655]">Completed Plans</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#166534] tabular-nums">
            {completedCount}
          </p>
          <p className="mt-1 text-xs text-[#434655]">Verified academic recovery milestones</p>
        </div>
      </section>

      {/* Improvement Plans Queue */}
      <section className="edu-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#F1F5F9]">
          <div
            role="tablist"
            aria-label="Filter improvement plans by status"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-[#F1F5F9] p-1"
          >
            {(
              [
                { id: 'all', label: `All (${interventions.length})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'in_progress', label: `In Progress (${inProgressCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#0F172A] shadow-sm'
                      : 'text-[#434655] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setStudentId(students[0]?.id ?? '');
              setFormError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Create Improvement Plan</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <h3 className="text-base font-semibold text-[#0F172A]">
              No improvement plans in this status
            </h3>
            <p className="mt-1 text-sm text-[#434655]">
              Create a personalized improvement plan or switch status tabs above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4 whitespace-nowrap">Student &amp; Class</th>
                  <th className="py-3 px-4">Identified Problem &amp; Recommended Action</th>
                  <th className="py-3 px-4">Faculty Remarks</th>
                  <th className="py-3 px-4 whitespace-nowrap">Target Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {filtered.map((item) => {
                  const badge = STATUS_BADGE[item.status];
                  const isEditingRemarks = editingRemarksId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors align-top">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onInspectStudent(item.studentId)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                            {item.studentName}
                          </div>
                          <div className="text-xs text-[#434655] tabular-nums mt-0.5">
                            {item.studentCode}
                          </div>
                          {item.className && (
                            <div className="text-[11px] text-[#64748B] mt-0.5">
                              {item.className}
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-xs font-semibold text-[#B91C1C]">
                          Problem: <span className="font-medium text-[#0F172A]">{item.identifiedProblem}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#2563EB] mt-1">
                          Action: <span className="font-medium text-[#0F172A]">{item.recommendedAction}</span>
                        </div>
                        <div className="text-[11px] text-[#434655] mt-1 flex items-center gap-1.5">
                          {item.source === 'ai_recommended' && (
                            <span className="inline-flex items-center gap-1 text-[#6B38D4] font-medium">
                              <Sparkles className="h-3 w-3" aria-hidden="true" />
                              Simulated AI Suggested
                            </span>
                          )}
                          {item.source === 'ai_recommended' && <span aria-hidden="true">·</span>}
                          <span>Faculty: {item.advisor}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-xs text-[#434655]">
                        {isEditingRemarks ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={remarksDraft}
                              onChange={(e) => setRemarksDraft(e.target.value)}
                              className="w-full rounded-lg border border-[#CBD5E1] bg-white p-2 text-xs text-[#0F172A]"
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateRemarks(item.id, remarksDraft);
                                  setEditingRemarksId(null);
                                }}
                                className="rounded bg-[#2563EB] px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRemarksId(null)}
                                className="rounded border border-[#E2E8F0] px-2 py-1 text-[11px] text-[#434655] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p>{item.facultyRemarks || 'No remarks yet'}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRemarksId(item.id);
                                setRemarksDraft(item.facultyRemarks);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" aria-hidden="true" />
                              <span>Edit Remarks</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#434655] tabular-nums whitespace-nowrap">
                        {formatDateDDMMYYYY(item.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} aria-hidden="true" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(item.id, 'in_progress')}
                            aria-label={`Start plan for ${item.studentName}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                          >
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Start Plan</span>
                          </button>
                        )}
                        {item.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(item.id, 'completed')}
                            aria-label={`Mark completed for ${item.studentName}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] hover:bg-[#BBF7D0] px-3 py-1.5 text-xs font-semibold text-[#166534] cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-xs font-medium text-[#166534]">
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Improvement Plan Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-intervention-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
              <h2 id="new-intervention-title" className="text-lg font-bold text-[#0F172A]">
                Create Personalized Improvement Plan
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="int-student" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Student
                </label>
                <select
                  id="int-student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name} ({stu.studentCode} · {stu.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="int-problem" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Identified Problem
                </label>
                <input
                  id="int-problem"
                  type="text"
                  value={identifiedProblem}
                  onChange={(e) => {
                    setIdentifiedProblem(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., Attendance at 65% in DBMS and 2 pending assignments"
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="int-action" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Recommended Action
                </label>
                <input
                  id="int-action"
                  type="text"
                  value={recommendedAction}
                  onChange={(e) => {
                    setRecommendedAction(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., Improve attendance from 65% to 85% and attend DBMS coaching"
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="int-channel" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Support Channel
                  </label>
                  <select
                    id="int-channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as InterventionChannel)}
                    className="edu-input w-full px-3 text-sm text-[#0F172A]"
                  >
                    <option value="Faculty Mentoring">Faculty Mentoring</option>
                    <option value="Additional Coaching">Additional Coaching</option>
                    <option value="Attendance Counseling">Attendance Counseling</option>
                    <option value="Lab & Practical Support">Lab &amp; Practical Support</option>
                    <option value="Scholarship & Fee Guidance">Scholarship &amp; Fee Guidance</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="int-due" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Target Completion Date
                  </label>
                  <input
                    id="int-due"
                    type="date"
                    value={toIsoDate(dueDateIso)}
                    onChange={(e) => setDueDateIso(e.target.value)}
                    className="edu-input w-full px-3 text-sm text-[#0F172A] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="int-remarks" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Faculty Remarks
                </label>
                <textarea
                  id="int-remarks"
                  rows={2}
                  value={facultyRemarks}
                  onChange={(e) => setFacultyRemarks(e.target.value)}
                  placeholder="Add mentoring schedule, parent intimation note, or coaching hours..."
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white p-2.5 text-sm text-[#0F172A]"
                />
              </div>

              {formError && (
                <p className="text-xs font-medium text-[#B91C1C]">{formError}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Save Improvement Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
