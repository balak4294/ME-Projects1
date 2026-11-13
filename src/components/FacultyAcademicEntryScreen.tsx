import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import type {
  AcademicClass,
  AssignmentEntry,
  RiskThresholds,
  Student,
  StudentSubjectRecord,
} from '../types/edupredict';
import {
  computeSubjectRecordMetrics,
  formatDateDDMMYYYY,
  getStudentRiskSummary,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface FacultyAcademicEntryScreenProps {
  classes: AcademicClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  thresholds: RiskThresholds;
  onSaveSubjectRecord: (studentId: string, record: StudentSubjectRecord) => void;
  onGoToRiskAnalysis: () => void;
}

export function FacultyAcademicEntryScreen({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  selectedStudentId,
  onSelectStudent,
  thresholds,
  onSaveSubjectRecord,
  onGoToRiskAnalysis,
}: FacultyAcademicEntryScreenProps) {
  const activeClass =
    classes.find((c) => c.id === selectedClassId) ?? classes[0] ?? null;
  const classStudents = students.filter((s) =>
    activeClass ? s.classId === activeClass.id : true
  );
  const activeStudent =
    classStudents.find((s) => s.id === selectedStudentId) ??
    classStudents[0] ??
    null;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    activeStudent?.subjectRecords[0]?.subjectId ?? ''
  );

  const currentRecord =
    activeStudent?.subjectRecords.find(
      (r) => r.subjectId === selectedSubjectId
    ) ??
    activeStudent?.subjectRecords[0] ??
    null;

  const [draft, setDraft] = useState<StudentSubjectRecord | null>(currentRecord);
  const [newAssignName, setNewAssignName] = useState('');
  const [newAssignStatus, setNewAssignStatus] =
    useState<AssignmentEntry['status']>('Submitted');
  const [newAssignDate, setNewAssignDate] = useState('13-11-2026');
  const [newAssignMarks, setNewAssignMarks] = useState(75);

  useEffect(() => {
    if (!activeStudent) {
      setDraft(null);
      return;
    }
    const matching =
      activeStudent.subjectRecords.find(
        (r) => r.subjectId === selectedSubjectId
      ) ?? activeStudent.subjectRecords[0];
    if (matching) {
      setSelectedSubjectId(matching.subjectId);
      setDraft(computeSubjectRecordMetrics(matching));
    } else {
      setDraft(null);
    }
  }, [activeStudent?.id, selectedSubjectId]);

  if (!activeClass || !activeStudent) {
    return (
      <section className="edu-card p-10 text-center space-y-2">
        <h2 className="text-base font-semibold text-[#0F172A]">
          No enrolled students found in this class
        </h2>
        <p className="text-xs text-[#434655]">
          Enroll students in Step 2 (Student Management) and assign subjects in Step 3 before entering academic records.
        </p>
      </section>
    );
  }

  const { effectiveScore, tier } = getStudentRiskSummary(activeStudent, thresholds);
  const preview = draft ? computeSubjectRecordMetrics(draft) : null;

  const handleFieldChange = (patch: Partial<StudentSubjectRecord>) => {
    if (!draft) return;
    setDraft(computeSubjectRecordMetrics({ ...draft, ...patch }));
  };

  const handleAssignmentChange = (
    assignId: string,
    patch: Partial<AssignmentEntry>
  ) => {
    if (!draft) return;
    const nextAssignments = draft.assignments.map((a) =>
      a.id === assignId ? { ...a, ...patch } : a
    );
    handleFieldChange({ assignments: nextAssignments });
  };

  const handleAddAssignment = () => {
    if (!draft || newAssignName.trim().length < 2) return;
    const entry: AssignmentEntry = {
      id: `asg-${Date.now()}`,
      name: newAssignName.trim(),
      status: newAssignStatus,
      submissionDate:
        newAssignStatus === 'Pending' ? '-' : formatDateDDMMYYYY(newAssignDate),
      marksObtained: newAssignStatus === 'Pending' ? 0 : newAssignMarks,
      maxMarks: 100,
    };
    handleFieldChange({ assignments: [...draft.assignments, entry] });
    setNewAssignName('');
  };

  const handleRemoveAssignment = (assignId: string) => {
    if (!draft) return;
    handleFieldChange({
      assignments: draft.assignments.filter((a) => a.id !== assignId),
    });
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    onSaveSubjectRecord(activeStudent.id, preview);
  };

  return (
    <div className="space-y-6">
      {/* Step 4 Selection Bar */}
      <section className="edu-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-[260px]">
            <div>
              <label
                htmlFor="ade-class-select"
                className="block text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] mb-1"
              >
                Class
              </label>
              <select
                id="ade-class-select"
                value={activeClass.id}
                onChange={(e) => onSelectClass(e.target.value)}
                className="edu-input w-full px-3 text-sm font-semibold text-[#0F172A]"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ade-student-select"
                className="block text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] mb-1"
              >
                Student ({classStudents.length} enrolled)
              </label>
              <select
                id="ade-student-select"
                value={activeStudent.id}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="edu-input w-full px-3 text-sm font-semibold text-[#0F172A]"
              >
                {classStudents.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} ({stu.studentCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-[#434655]">Overall Student Risk</p>
              <div className="mt-0.5">
                <RiskBadge tier={tier} score={effectiveScore} />
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToRiskAnalysis}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>View AI Risk Analysis</span>
            </button>
          </div>
        </div>

        {/* Subject Tabs */}
        <div
          role="tablist"
          aria-label="Select subject for academic entry"
          className="flex flex-wrap gap-2 pt-3 border-t border-[#F1F5F9]"
        >
          {activeStudent.subjectRecords.map((rec) => {
            const isActive = rec.subjectId === preview?.subjectId;
            return (
              <button
                key={rec.subjectId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedSubjectId(rec.subjectId)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                    : 'bg-white border-[#E2E8F0] text-[#434655] hover:bg-[#F8FAFC]'
                }`}
              >
                {rec.subjectCode} · {rec.subjectName}
              </button>
            );
          })}
        </div>
      </section>

      {!preview && (
        <section className="edu-card p-10 text-center space-y-2">
          <h2 className="text-base font-semibold text-[#0F172A]">
            No active subjects assigned to {activeClass.className}
          </h2>
          <p className="text-xs text-[#434655]">
            Assign or move at least one subject into this class under Step 3 (Subject Management) to enter attendance and IA marks.
          </p>
        </section>
      )}

      {preview && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Attendance */}
            <section className="edu-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Subject Attendance
                </h2>
                <span className="text-sm font-extrabold text-[#2563EB] tabular-nums">
                  {preview.attendancePct}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ade-workdays" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Total Working Days
                  </label>
                  <input
                    id="ade-workdays"
                    type="number"
                    min={1}
                    max={90}
                    value={preview.totalWorkingDays}
                    onChange={(e) =>
                      handleFieldChange({
                        totalWorkingDays: Number(e.target.value) || 1,
                      })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ade-present" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Days Present
                  </label>
                  <input
                    id="ade-present"
                    type="number"
                    min={0}
                    max={preview.totalWorkingDays}
                    value={preview.daysPresent}
                    onChange={(e) =>
                      handleFieldChange({
                        daysPresent: Number(e.target.value) || 0,
                      })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs">
                <div>
                  <p className="text-[#434655]">Days Absent</p>
                  <p className="font-bold text-[#B91C1C] tabular-nums mt-0.5">
                    {preview.daysAbsent} days
                  </p>
                </div>
                <div>
                  <p className="text-[#434655]">Attendance %</p>
                  <p className="font-bold text-[#0F172A] tabular-nums mt-0.5">
                    {preview.attendancePct}%
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Internal Assessment */}
            <section className="edu-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Internal Assessment Marks
                </h2>
                <span className="text-sm font-extrabold text-[#0284C7] tabular-nums">
                  Avg {preview.internalAvg}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ade-ia1" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    IA 1 Marks
                  </label>
                  <input
                    id="ade-ia1"
                    type="number"
                    min={0}
                    max={100}
                    value={preview.ia1}
                    onChange={(e) =>
                      handleFieldChange({ ia1: Number(e.target.value) || 0 })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ade-ia2" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    IA 2 Marks
                  </label>
                  <input
                    id="ade-ia2"
                    type="number"
                    min={0}
                    max={100}
                    value={preview.ia2}
                    onChange={(e) =>
                      handleFieldChange({ ia2: Number(e.target.value) || 0 })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ade-ia3" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    IA 3 Marks
                  </label>
                  <input
                    id="ade-ia3"
                    type="number"
                    min={0}
                    max={100}
                    value={preview.ia3}
                    onChange={(e) =>
                      handleFieldChange({ ia3: Number(e.target.value) || 0 })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ade-asg-marks" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Assignment Marks
                  </label>
                  <input
                    id="ade-asg-marks"
                    type="number"
                    min={0}
                    max={100}
                    value={preview.assignmentMarks}
                    onChange={(e) =>
                      handleFieldChange({
                        assignmentMarks: Number(e.target.value) || 0,
                      })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              {preview.subjectType === 'Practical' && (
                <div>
                  <label htmlFor="ade-prac" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Practical / Model Lab Marks
                  </label>
                  <input
                    id="ade-prac"
                    type="number"
                    min={0}
                    max={100}
                    value={preview.practicalMarks}
                    onChange={(e) =>
                      handleFieldChange({
                        practicalMarks: Number(e.target.value) || 0,
                      })
                    }
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              )}
            </section>

            {/* 3. Academic Engagement */}
            <section className="edu-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Academic Engagement
                </h2>
                <span className="text-sm font-extrabold text-[#6B38D4] tabular-nums">
                  {preview.engagementScore}/100
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A] mb-1">
                  <label htmlFor="ade-participation">Class Participation</label>
                  <span className="tabular-nums text-[#2563EB]">
                    {preview.classParticipation}%
                  </span>
                </div>
                <input
                  id="ade-participation"
                  type="range"
                  min={0}
                  max={100}
                  value={preview.classParticipation}
                  onChange={(e) =>
                    handleFieldChange({
                      classParticipation: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] p-3 text-xs">
                <div>
                  <p className="text-[#434655]">Assignment Completion</p>
                  <p className="font-bold text-[#0F172A] tabular-nums mt-0.5">
                    {preview.assignmentCompletionPct}%
                  </p>
                </div>
                <div>
                  <p className="text-[#434655]">Engagement Score</p>
                  <p className="font-bold text-[#6B38D4] tabular-nums mt-0.5">
                    {preview.engagementScore} / 100
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 4. Assignment Tracking */}
          <section className="edu-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#F1F5F9]">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Assignment Tracking — {preview.subjectCode} ({preview.subjectName})
                </h2>
                <p className="text-xs text-[#434655] mt-0.5">
                  Update submission status, DD-MM-YYYY submission dates, and marks obtained
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Save Academic Record</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                    <th className="py-3 px-4">Assignment Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4 text-right">Marks Obtained</th>
                    <th className="py-3 px-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm">
                  {preview.assignments.map((asg) => (
                    <tr key={asg.id}>
                      <td className="py-2.5 px-4 font-medium text-[#0F172A]">
                        {asg.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          aria-label={`Status for ${asg.name}`}
                          value={asg.status}
                          onChange={(e) =>
                            handleAssignmentChange(asg.id, {
                              status: e.target.value as AssignmentEntry['status'],
                              submissionDate:
                                e.target.value === 'Pending'
                                  ? '-'
                                  : asg.submissionDate === '-'
                                    ? '13-11-2026'
                                    : asg.submissionDate,
                            })
                          }
                          className="edu-input px-2.5 text-xs"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Pending">Pending</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          aria-label={`Submission date for ${asg.name}`}
                          value={asg.submissionDate}
                          onChange={(e) =>
                            handleAssignmentChange(asg.id, {
                              submissionDate: e.target.value,
                            })
                          }
                          placeholder="DD-MM-YYYY"
                          className="edu-input w-28 px-2.5 text-xs tabular-nums"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          aria-label={`Marks for ${asg.name}`}
                          value={asg.marksObtained}
                          onChange={(e) =>
                            handleAssignmentChange(asg.id, {
                              marksObtained: Number(e.target.value) || 0,
                            })
                          }
                          className="edu-input w-20 px-2.5 text-xs text-right tabular-nums"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignment(asg.id)}
                          aria-label={`Delete ${asg.name}`}
                          className="rounded-lg border border-[#FECACA] p-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Assignment Row */}
            <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label htmlFor="new-asg-name" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Add Assignment
                </label>
                <input
                  id="new-asg-name"
                  type="text"
                  value={newAssignName}
                  onChange={(e) => setNewAssignName(e.target.value)}
                  placeholder="e.g., Unit 3 Tutorial Problem Set"
                  className="edu-input w-full px-3 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new-asg-status" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Status
                </label>
                <select
                  id="new-asg-status"
                  value={newAssignStatus}
                  onChange={(e) =>
                    setNewAssignStatus(e.target.value as AssignmentEntry['status'])
                  }
                  className="edu-input w-full px-2.5 text-xs"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="Late">Late</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new-asg-date" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Date (DD-MM-YYYY)
                </label>
                <input
                  id="new-asg-date"
                  type="text"
                  value={newAssignDate}
                  onChange={(e) => setNewAssignDate(e.target.value)}
                  className="edu-input w-full px-2.5 text-xs tabular-nums"
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="new-asg-marks" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Marks
                </label>
                <input
                  id="new-asg-marks"
                  type="number"
                  min={0}
                  max={100}
                  value={newAssignMarks}
                  onChange={(e) => setNewAssignMarks(Number(e.target.value) || 0)}
                  className="edu-input w-full px-2 text-xs tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddAssignment}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-[#2563EB] bg-white hover:bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#2563EB] cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
