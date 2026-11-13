import { useState } from 'react';
import { BookOpen, Layers, Users } from 'lucide-react';
import type {
  AcademicClass,
  RiskThresholds,
  Student,
  SubjectItem,
} from '../types/edupredict';
import { computeClassMetrics, getStudentRiskSummary } from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface AdminClassesScreenProps {
  classes: AcademicClass[];
  subjects: SubjectItem[];
  students: Student[];
  thresholds: RiskThresholds;
  onInspectStudent: (studentId: string) => void;
}

export function AdminClassesScreen({
  classes,
  subjects,
  students,
  thresholds,
  onInspectStudent,
}: AdminClassesScreenProps) {
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '');

  const departments = Array.from(new Set(classes.map((c) => c.department))).sort();
  const visibleClasses =
    deptFilter === 'all'
      ? classes
      : classes.filter((c) => c.department === deptFilter);

  const focusedClass =
    visibleClasses.find((c) => c.id === selectedClassId) ??
    visibleClasses[0] ??
    null;

  const focusedSubjects = focusedClass
    ? subjects.filter((s) => s.classId === focusedClass.id)
    : [];
  const focusedStudents = focusedClass
    ? students.filter((s) => s.classId === focusedClass.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Department Filter + Summary */}
      <section className="edu-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            Institution-Wide Classes &amp; Subject Allocation ({visibleClasses.length})
          </h2>
          <p className="text-xs text-[#434655] mt-0.5">
            Monitor all classes created by faculty members, class-wise student counts, assigned subjects, and risk breakdown.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <label htmlFor="admin-class-dept-filter" className="sr-only">
            Filter classes by department
          </label>
          <select
            id="admin-class-dept-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="edu-input w-full px-3 text-sm"
          >
            <option value="all">All Departments ({classes.length} classes)</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* All Classes Overview Table */}
      <section className="edu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                <th className="py-3 px-4 whitespace-nowrap">Class &amp; Batch</th>
                <th className="py-3 px-4 whitespace-nowrap">Department</th>
                <th className="py-3 px-4 whitespace-nowrap">Assigned Faculty</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Students</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Subjects</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Risk (H / M / L)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-sm">
              {visibleClasses.map((cls) => {
                const stats = computeClassMetrics(cls, students, subjects, thresholds);
                const isSelected = focusedClass?.id === cls.id;
                return (
                  <tr
                    key={cls.id}
                    className={isSelected ? 'bg-[#EFF6FF]/60' : 'hover:bg-[#F8FAFC]'}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{cls.className}</div>
                      <div className="text-xs text-[#434655] tabular-nums">
                        Sem {cls.semester} · {cls.academicYear} · Batch {cls.batch}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#0F172A]">
                      {cls.department}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#0F172A] whitespace-nowrap">
                      {cls.assignedFacultyName}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">
                      {stats.studentCount}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {stats.subjectCount}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-xs whitespace-nowrap">
                      <span className="font-semibold text-[#B91C1C]">{stats.highRiskCount}H</span>
                      <span className="text-[#94A3B8] mx-1">/</span>
                      <span className="font-semibold text-[#92400E]">{stats.mediumRiskCount}M</span>
                      <span className="text-[#94A3B8] mx-1">/</span>
                      <span className="font-semibold text-[#166534]">{stats.lowRiskCount}L</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedClassId(cls.id)}
                        className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] cursor-pointer"
                      >
                        View Class
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Focused Class Drilldown: Assigned Subjects + Enrolled Students */}
      {focusedClass && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <section className="xl:col-span-5 edu-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Assigned Subjects ({focusedSubjects.length})
                </h3>
              </div>
              <span className="text-xs font-medium text-[#434655]">
                {focusedClass.className}
              </span>
            </div>

            {focusedSubjects.length === 0 ? (
              <p className="text-xs text-[#64748B]">No subjects assigned yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {focusedSubjects.map((sub) => (
                  <li
                    key={sub.id}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {sub.code} – {sub.name}
                      </p>
                      <p className="text-xs text-[#434655] mt-0.5">
                        {sub.type} · {sub.credits} Credits · {sub.assignedFacultyName}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#2563EB] tabular-nums">
                      Sem {sub.semester}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="xl:col-span-7 edu-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Class Roster &amp; Risk Status ({focusedStudents.length})
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-[#434655]">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {focusedClass.assignedFacultyName}
              </span>
            </div>

            {focusedStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No students enrolled in this class yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4 text-right">Attendance</th>
                      <th className="py-3 px-4 text-right">Internal Avg</th>
                      <th className="py-3 px-4">Risk Status</th>
                      <th className="py-3 px-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-sm">
                    {focusedStudents.map((stu) => {
                      const { effectiveScore, tier } = getStudentRiskSummary(
                        stu,
                        thresholds
                      );
                      return (
                        <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{stu.name}</div>
                            <div className="text-xs text-[#434655] tabular-nums">
                              {stu.studentCode}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            {stu.attendanceRate}%
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            {stu.internalMarksAvg}%
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <RiskBadge tier={tier} score={effectiveScore} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onInspectStudent(stu.id)}
                              className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
