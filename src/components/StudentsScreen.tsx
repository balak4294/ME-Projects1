import { useState, type FormEvent } from 'react';
import { Download, Plus, Search, Sparkles, X } from 'lucide-react';
import type {
  FacultyMember,
  Intervention,
  RiskThresholds,
  RiskTier,
  Student,
  UserRole,
} from '../types/edupredict';
import {
  computeStudentAssignmentCompletionPct,
  filterStudents,
  formatStudentCsv,
  getStudentRiskSummary,
  semesterToYearOfStudy,
  TN_DEPARTMENTS,
  TN_LOCATIONS,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface StudentsScreenProps {
  role: UserRole;
  students: Student[];
  classes: import('../types/edupredict').AcademicClass[];
  facultyList: FacultyMember[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  tierFilter: 'all' | RiskTier;
  onTierFilterChange: (tier: 'all' | RiskTier) => void;
  onInspectStudent: (studentId: string) => void;
  onBatchAssignPathway: (studentIds: string[]) => void;
  onAddStudent?: (payload: {
    name: string;
    registerNumber: string;
    email: string;
    mobile: string;
    location: string;
    classId: string;
    department: string;
    classYear: Student['classYear'];
    semester: number;
    section: string;
    facultyId: string;
    attendanceRate: number;
    internalMarksAvg: number;
    missingAssignments: number;
  }) => void;
}

export function StudentsScreen({
  role,
  students,
  classes,
  facultyList,
  interventions,
  thresholds,
  tierFilter,
  onTierFilterChange,
  onInspectStudent,
  onBatchAssignPathway,
  onAddStudent,
}: StudentsScreenProps) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [advisor, setAdvisor] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newRegisterNo, setNewRegisterNo] = useState('711725104011');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('+91 98431 44510');
  const [newLocation, setNewLocation] = useState<string>(TN_LOCATIONS[0]);
  const [newClassId, setNewClassId] = useState(classes[0]?.id ?? 'cls-cse-2a');
  const [newDept, setNewDept] = useState<string>(TN_DEPARTMENTS[0]);
  const [newSemester, setNewSemester] = useState(classes[0]?.semester ?? 3);
  const [newSection, setNewSection] = useState(classes[0]?.section ?? 'A');
  const [newFacultyId, setNewFacultyId] = useState(facultyList[0]?.id ?? 'fac-01');
  const [newAttendance, setNewAttendance] = useState(82);
  const [newMarks, setNewMarks] = useState(76);
  const [newMissing, setNewMissing] = useState(1);
  const [addError, setAddError] = useState('');

  const departments = Array.from(new Set(students.map((s) => s.department))).sort();
  const advisors = Array.from(new Set(students.map((s) => s.advisor))).sort();

  const filtered = filterStudents(
    students,
    { query, tier: tierFilter, department, advisor },
    thresholds
  );

  const activeStudentIds = new Set(
    interventions
      .filter((item) => item.status === 'in_progress' || item.status === 'pending')
      .map((item) => item.studentId)
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((stu) => selectedIds.includes(stu.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((stu) => stu.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchAssign = () => {
    if (selectedIds.length === 0) return;
    onBatchAssignPathway(selectedIds);
    setSelectedIds([]);
  };

  const handleExportCsv = () => {
    const targetList =
      selectedIds.length > 0
        ? filtered.filter((s) => selectedIds.includes(s.id))
        : filtered;
    const csvContent = formatStudentCsv(targetList, thresholds);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'edupulse-cohort-risk.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setQuery('');
    setDepartment('all');
    setAdvisor('all');
    onTierFilterChange('all');
  };

  const handleAddStudentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!onAddStudent) return;
    if (newName.trim().length < 2 || !newEmail.includes('@') || !newRegisterNo.trim()) {
      setAddError('Please provide student name, register number, and college email.');
      return;
    }
    onAddStudent({
      name: newName.trim(),
      registerNumber: newRegisterNo.trim(),
      email: newEmail.trim(),
      mobile: newMobile.trim() || '+91 98431 44510',
      location: newLocation,
      classId: newClassId,
      department: newDept,
      classYear: semesterToYearOfStudy(newSemester),
      semester: newSemester,
      section: newSection.trim() || 'A',
      facultyId: newFacultyId,
      attendanceRate: newAttendance,
      internalMarksAvg: newMarks,
      missingAssignments: newMissing,
    });
    setNewName('');
    setNewEmail('');
    setAddError('');
    setIsAddModalOpen(false);
  };

  const tierTabs: Array<{ id: 'all' | RiskTier; label: string }> = [
    { id: 'all', label: 'All Students' },
    { id: 'high', label: 'High Risk' },
    { id: 'medium', label: 'Medium Risk' },
    { id: 'low', label: 'Low Risk' },
  ];

  return (
    <div className="space-y-5">
      {/* Filter & Search Toolbar */}
      <section aria-label="Student Cohort Filters" className="edu-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Filter by risk tier"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-[#F1F5F9] p-1"
          >
            {tierTabs.map((tab) => {
              const active = tierFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTierFilterChange(tab.id)}
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

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-[#434655] tabular-nums">
              Showing <strong className="font-semibold text-[#0F172A]">{filtered.length}</strong> of {students.length}
            </span>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-2 text-xs font-medium text-[#0F172A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#434655]" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
            {role === 'admin' && onAddStudent && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Student</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className={`${role === 'admin' ? 'md:col-span-6' : 'md:col-span-8'} relative`}>
            <label htmlFor="student-search" className="sr-only">
              Search students by name, ID, or major
            </label>
            <Search
              className="h-4 w-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="student-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name, register no, or class..."
              className="edu-input w-full pl-9 pr-9 text-sm text-[#0F172A] placeholder:text-[#64748B]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className={role === 'admin' ? 'md:col-span-3' : 'md:col-span-4'}>
            <label htmlFor="department-filter" className="sr-only">
              Filter by department
            </label>
            <select
              id="department-filter"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="edu-input w-full px-3 text-sm text-[#0F172A]"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {role === 'admin' && (
            <div className="md:col-span-3">
              <label htmlFor="advisor-filter" className="sr-only">
                Filter by faculty advisor
              </label>
              <select
                id="advisor-filter"
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                className="edu-input w-full px-3 text-sm text-[#0F172A]"
              >
                <option value="all">All Faculty Advisors</option>
                {advisors.map((adv) => (
                  <option key={adv} value={adv}>
                    {adv}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Batch Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#5516BE] tabular-nums">
              {selectedIds.length} {selectedIds.length === 1 ? 'student' : 'students'} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-lg border border-[#DDD6FE] bg-white hover:bg-[#FAF8FF] px-3 py-1.5 text-xs font-medium text-[#434655] cursor-pointer"
              >
                Deselect
              </button>
              <button
                type="button"
                onClick={handleBatchAssign}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Assign Batch AI Pathway</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Cohort Table */}
      <section className="edu-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <h3 className="text-base font-semibold text-[#0F172A]">
              No matching students in current filter
            </h3>
            <p className="mt-1.5 text-sm text-[#434655] max-w-md mx-auto">
              Adjust your search terms or risk tier filters to view the rest of the monitored cohort.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all visible students"
                      className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] accent-[#2563EB] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-right">IA Avg / CGPA</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">Assignments</th>
                  <th className="py-3 px-4">Simulated Risk</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {filtered.map((student) => {
                  const { effectiveScore, tier } = getStudentRiskSummary(student, thresholds);
                  const isSelected = selectedIds.includes(student.id);
                  const hasIntervention = activeStudentIds.has(student.id);
                  const assignPct = computeStudentAssignmentCompletionPct(student);

                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#F5F3FF]/60' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(student.id)}
                          aria-label={`Select ${student.name}`}
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] accent-[#2563EB] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onInspectStudent(student.id)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                            {student.name}
                          </div>
                          <div className="text-xs text-[#434655] mt-0.5 tabular-nums">
                            {student.studentCode} · {student.className} · {student.location}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-medium text-[#0F172A]">
                          {student.internalMarksAvg}%
                        </span>
                        <span className="ml-1.5 text-xs text-[#434655]">
                          ({student.gpa.toFixed(2)})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-[#0F172A]">
                        {student.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-medium text-[#0F172A]">
                          {student.assignmentsCompleted}/{student.assignmentsTotal}
                        </span>
                        <span className="ml-1.5 text-xs text-[#434655]">
                          ({assignPct}%)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge tier={tier} score={effectiveScore} />
                      </td>
                      <td className="py-3 px-4 text-xs text-[#434655]">
                        <div>{student.advisor}</div>
                        <div className="mt-0.5 text-[11px] text-[#64748B]">
                          {hasIntervention ? 'Active improvement plan' : 'No active plan'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onInspectStudent(student.id)}
                          aria-label={`Inspect ${student.name}`}
                          className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#0F172A] whitespace-nowrap cursor-pointer"
                        >
                          Review Profile
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

      {/* Admin Add Student Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 id="add-student-modal-title" className="text-lg font-bold text-[#0F172A]">
                Add Student Record
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-stu-name" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Student Name
                  </label>
                  <input
                    id="new-stu-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Meena V"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-stu-reg" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Register Number
                  </label>
                  <input
                    id="new-stu-reg"
                    type="text"
                    value={newRegisterNo}
                    onChange={(e) => setNewRegisterNo(e.target.value)}
                    placeholder="e.g., 711725104011"
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-stu-email" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    College Email
                  </label>
                  <input
                    id="new-stu-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="meena.v25@kongutech.edu.in"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-stu-mobile" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Mobile (+91)
                  </label>
                  <input
                    id="new-stu-mobile"
                    type="text"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="+91 98431 44510"
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-stu-class" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Class
                  </label>
                  <select
                    id="new-stu-class"
                    value={newClassId}
                    onChange={(e) => {
                      const cls = classes.find((c) => c.id === e.target.value);
                      setNewClassId(e.target.value);
                      if (cls) {
                        setNewDept(cls.department);
                        setNewSemester(cls.semester);
                        setNewSection(cls.section);
                        setNewFacultyId(cls.assignedFacultyId);
                      }
                    }}
                    className="edu-input w-full px-3 text-sm"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-stu-loc" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Location
                  </label>
                  <select
                    id="new-stu-loc"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="edu-input w-full px-3 text-sm"
                  >
                    {TN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="new-stu-dept" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Department
                  </label>
                  <select
                    id="new-stu-dept"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="edu-input w-full px-3 text-sm"
                  >
                    {TN_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-stu-sem" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Semester
                  </label>
                  <select
                    id="new-stu-sem"
                    value={newSemester}
                    onChange={(e) => setNewSemester(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="new-stu-faculty" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Assigned Faculty Mentor
                </label>
                <select
                  id="new-stu-faculty"
                  value={newFacultyId}
                  onChange={(e) => setNewFacultyId(e.target.value)}
                  className="edu-input w-full px-3 text-sm"
                >
                  {facultyList.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="new-stu-att" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Attendance %
                  </label>
                  <input
                    id="new-stu-att"
                    type="number"
                    min={0}
                    max={100}
                    value={newAttendance}
                    onChange={(e) => setNewAttendance(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="new-stu-marks" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    IA Average %
                  </label>
                  <input
                    id="new-stu-marks"
                    type="number"
                    min={0}
                    max={100}
                    value={newMarks}
                    onChange={(e) => setNewMarks(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="new-stu-missing" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Pending Tasks
                  </label>
                  <input
                    id="new-stu-missing"
                    type="number"
                    min={0}
                    max={15}
                    value={newMissing}
                    onChange={(e) => setNewMissing(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              {addError && <p className="text-xs font-medium text-[#B91C1C]">{addError}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
