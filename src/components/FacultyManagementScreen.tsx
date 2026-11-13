import { useEffect, useState, type FormEvent } from 'react';
import { Plus, UserCheck, X } from 'lucide-react';
import type {
  AcademicClass,
  FacultyMember,
  Intervention,
  RiskThresholds,
  Student,
} from '../types/edupredict';
import {
  computeDepartmentStats,
  computeFacultyPerformance,
  TN_DEPARTMENTS,
  TN_LOCATIONS,
} from '../utils/riskEngine';

interface FacultyManagementScreenProps {
  facultyList: FacultyMember[];
  classes: AcademicClass[];
  students: Student[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  onAddFaculty: (payload: {
    name: string;
    email: string;
    mobile: string;
    location: string;
    department: string;
    title: string;
  }) => void;
  onToggleFacultyStatus: (facultyId: string) => void;
  onAssignStudentToFaculty: (studentId: string, facultyId: string) => void;
}

export function FacultyManagementScreen({
  facultyList,
  classes,
  students,
  interventions,
  thresholds,
  onAddFaculty,
  onToggleFacultyStatus,
  onAssignStudentToFaculty,
}: FacultyManagementScreenProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('+91 98422 41199');
  const [location, setLocation] = useState<string>(TN_LOCATIONS[0]);
  const [department, setDepartment] = useState<string>(TN_DEPARTMENTS[0]);
  const [title, setTitle] = useState('Assistant Professor');
  const [formError, setFormError] = useState('');

  const [assignStudentId, setAssignStudentId] = useState(students[0]?.id ?? '');
  const [assignFacultyId, setAssignFacultyId] = useState(facultyList[0]?.id ?? '');

  useEffect(() => {
    if (students.length > 0 && !students.some((s) => s.id === assignStudentId)) {
      setAssignStudentId(students[0].id);
    }
  }, [students, assignStudentId]);

  useEffect(() => {
    if (facultyList.length > 0 && !facultyList.some((f) => f.id === assignFacultyId)) {
      setAssignFacultyId(facultyList[0].id);
    }
  }, [facultyList, assignFacultyId]);

  const facultyPerf = computeFacultyPerformance(
    facultyList,
    students,
    interventions,
    classes,
    thresholds
  );
  const departmentStats = computeDepartmentStats(students, classes, thresholds);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3 || !email.includes('@')) {
      setFormError('Enter a valid faculty name and institutional email.');
      return;
    }
    onAddFaculty({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim() || '+91 98422 41199',
      location,
      department,
      title: title.trim() || 'Assistant Professor',
    });
    setName('');
    setEmail('');
    setFormError('');
    setIsAddOpen(false);
  };

  const handleAssignSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!assignStudentId || !assignFacultyId) return;
    onAssignStudentToFaculty(assignStudentId, assignFacultyId);
  };

  return (
    <div className="space-y-6">
      {/* Faculty Roster & Performance */}
      <section className="edu-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Faculty &amp; Advisor Roster
            </h2>
            <p className="text-xs text-[#434655] mt-0.5">
              Faculty-wise assigned caseloads, high-risk distribution, and intervention throughput
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Faculty Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                <th className="py-3 px-4 whitespace-nowrap">Faculty Member</th>
                <th className="py-3 px-4 whitespace-nowrap">Department</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Classes</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Assigned</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">High Risk</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Avg CGPA</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Avg Attendance</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Plans</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-sm">
              {facultyPerf.map((row) => (
                <tr key={row.faculty.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0F172A]">{row.faculty.name}</div>
                    <div className="text-xs text-[#434655] mt-0.5 tabular-nums">
                      {row.faculty.title} · {row.faculty.mobile} · {row.faculty.location}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-[#0F172A]">
                    {row.faculty.department}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#0F172A]">
                    {row.classCount}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#0F172A]">
                    {row.assignedCount}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#B91C1C]">
                    {row.highRiskCount}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#0F172A]">
                    {row.assignedCount > 0 ? row.avgGpa.toFixed(2) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#0F172A]">
                    {row.assignedCount > 0 ? `${row.avgAttendance}%` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-xs text-[#434655]">
                    {row.activeInterventions} active · {row.completedInterventions} done
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleFacultyStatus(row.faculty.id)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        row.faculty.status === 'active'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {row.faculty.status === 'active' ? 'Active' : 'On Leave'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assign Student to Faculty + Department Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Student-to-Faculty Assignment Tool */}
        <section className="xl:col-span-5 edu-card p-6 space-y-4">
          <div className="pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Assign Student to Faculty Advisor
            </h2>
            <p className="text-xs text-[#434655] mt-0.5">
              Rebalance caseloads or route at-risk students to specialized faculty mentors.
            </p>
          </div>

          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label htmlFor="assign-stu-select" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Student
              </label>
              <select
                id="assign-stu-select"
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
                className="edu-input w-full px-3 text-sm text-[#0F172A]"
              >
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} ({stu.major} · Current: {stu.advisor})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assign-fac-select" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Target Faculty Member
              </label>
              <select
                id="assign-fac-select"
                value={assignFacultyId}
                onChange={(e) => setAssignFacultyId(e.target.value)}
                className="edu-input w-full px-3 text-sm text-[#0F172A]"
              >
                {facultyList.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} · {fac.department}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>Update Faculty Assignment</span>
            </button>
          </form>
        </section>

        {/* Department-Wise Academic Performance */}
        <section className="xl:col-span-7 edu-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9]">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Department-Wise Academic Performance
            </h2>
            <p className="text-xs text-[#434655] mt-0.5">
              Aggregated GPA, internal assessment marks, attendance, and risk concentration
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 pl-5 pr-3 whitespace-nowrap">Department</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Classes</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Students</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Avg CGPA</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Marks</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Attendance</th>
                  <th className="py-3 pl-3 pr-5 text-right whitespace-nowrap">Risk (H / M / L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {departmentStats.map((dept) => (
                  <tr key={dept.department} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 pl-5 pr-3 font-semibold text-[#0F172A] whitespace-nowrap">
                      {dept.department}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#0F172A]">
                      {dept.classCount}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#0F172A]">
                      {dept.studentCount}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium text-[#0F172A]">
                      {dept.avgGpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#0F172A]">
                      {dept.avgInternalMarks}%
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#0F172A]">
                      {dept.avgAttendance}%
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right tabular-nums text-xs whitespace-nowrap">
                      <span className="font-semibold text-[#B91C1C]">{dept.highRiskCount}H</span>
                      <span className="text-[#94A3B8] mx-1">/</span>
                      <span className="font-semibold text-[#92400E]">{dept.mediumRiskCount}M</span>
                      <span className="text-[#94A3B8] mx-1">/</span>
                      <span className="font-semibold text-[#166534]">{dept.lowRiskCount}L</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Add Faculty Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-faculty-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 id="add-faculty-title" className="text-lg font-bold text-[#0F172A]">
                Add Faculty Member
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close modal"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="fac-name" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Full Name
                </label>
                <input
                  id="fac-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Dr. N. Muruganandam"
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fac-email" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    College Email
                  </label>
                  <input
                    id="fac-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="n.muruganandam@kongutech.edu.in"
                    className="edu-input w-full px-3 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="fac-mobile" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Mobile (+91)
                  </label>
                  <input
                    id="fac-mobile"
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98422 41199"
                    className="edu-input w-full px-3 text-sm text-[#0F172A] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fac-dept" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Department
                </label>
                <select
                  id="fac-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                >
                  {TN_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fac-role-title" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Designation
                  </label>
                  <input
                    id="fac-role-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="edu-input w-full px-3 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="fac-loc" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Campus Location
                  </label>
                  <select
                    id="fac-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="edu-input w-full px-3 text-sm text-[#0F172A]"
                  >
                    {TN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && <p className="text-xs font-medium text-[#B91C1C]">{formError}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
