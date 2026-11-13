import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  BookOpen,
  Edit3,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AcademicClass,
  RiskThresholds,
  RiskTier,
  Student,
  YearOfStudy,
} from '../types/edupredict';
import {
  filterStudents,
  getStudentRiskSummary,
  parseStudentCsvImport,
  semesterToYearOfStudy,
  TN_DEPARTMENTS,
  TN_LOCATIONS,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface FacultyStudentManagementScreenProps {
  classes: AcademicClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  students: Student[];
  thresholds: RiskThresholds;
  onAddStudentToClass: (payload: {
    classId: string;
    name: string;
    registerNumber: string;
    department: string;
    classYear: YearOfStudy;
    semester: number;
    section: string;
    email: string;
    mobile: string;
    location: string;
  }) => void;
  onUpdateStudentInfo: (
    studentId: string,
    payload: {
      name: string;
      registerNumber: string;
      department: string;
      classYear: YearOfStudy;
      semester: number;
      section: string;
      email: string;
      mobile: string;
      location: string;
    }
  ) => void;
  onRemoveStudent: (studentId: string) => void;
  onImportStudentsCsv: (
    classId: string,
    rows: ReturnType<typeof parseStudentCsvImport>
  ) => void;
  onOpenAcademicEntry: (studentId: string) => void;
  onGoToSubjects: () => void;
}

const SAMPLE_TN_CSV = `Name,RegisterNumber,Email,Mobile,Location,Attendance,Marks
Meenakshi Sundaram V,711725104005,meenakshi.v25@kongutech.edu.in,+91 98431 21061,Coimbatore,86,79
Surya Prakash K,711725104006,surya.k25@kongutech.edu.in,+91 98431 21062,Tiruppur,68,61`;

export function FacultyStudentManagementScreen({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  thresholds,
  onAddStudentToClass,
  onUpdateStudentInfo,
  onRemoveStudent,
  onImportStudentsCsv,
  onOpenAcademicEntry,
  onGoToSubjects,
}: FacultyStudentManagementScreenProps) {
  const activeClass =
    classes.find((c) => c.id === selectedClassId) ?? classes[0] ?? null;
  const activeClassId = activeClass?.id ?? '';

  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | RiskTier>('all');
  const [perfFilter, setPerfFilter] = useState<
    'all' | 'needs_support' | 'satisfactory' | 'high_performing'
  >('all');

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [department, setDepartment] = useState(
    activeClass?.department ?? TN_DEPARTMENTS[0]
  );
  const [classYear, setClassYear] = useState<YearOfStudy>(
    activeClass ? semesterToYearOfStudy(activeClass.semester) : 'II Year'
  );
  const [semester, setSemester] = useState(activeClass?.semester ?? 3);
  const [section, setSection] = useState(activeClass?.section ?? 'A');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('+91 98431 21055');
  const [location, setLocation] = useState<string>(TN_LOCATIONS[0]);
  const [formError, setFormError] = useState('');

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState(SAMPLE_TN_CSV);

  const classStudents = students.filter((s) =>
    activeClassId ? s.classId === activeClassId : true
  );

  const filtered = filterStudents(
    classStudents,
    {
      query,
      tier: tierFilter,
      department: 'all',
      advisor: 'all',
      classId: activeClassId || 'all',
      performanceBand: perfFilter,
    },
    thresholds
  );

  const openAddModal = () => {
    setEditingStudentId(null);
    setName('');
    setRegisterNumber(`7117251040${String(classStudents.length + 10).padStart(2, '0')}`);
    setDepartment(activeClass?.department ?? TN_DEPARTMENTS[0]);
    setSemester(activeClass?.semester ?? 3);
    setClassYear(
      activeClass ? semesterToYearOfStudy(activeClass.semester) : 'II Year'
    );
    setSection(activeClass?.section ?? 'A');
    setEmail('');
    setMobile('+91 98431 21055');
    setLocation('Coimbatore');
    setFormError('');
    setIsStudentModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudentId(stu.id);
    setName(stu.name);
    setRegisterNumber(stu.studentCode);
    setDepartment(stu.department);
    setClassYear(stu.classYear);
    setSemester(stu.semester);
    setSection(stu.section);
    setEmail(stu.email);
    setMobile(stu.mobile);
    setLocation(stu.location || 'Coimbatore');
    setFormError('');
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || registerNumber.trim().length < 4 || !email.includes('@')) {
      setFormError('Enter valid student name, register number, and email address.');
      return;
    }

    if (editingStudentId) {
      onUpdateStudentInfo(editingStudentId, {
        name: name.trim(),
        registerNumber: registerNumber.trim(),
        department,
        classYear,
        semester,
        section: section.trim() || 'A',
        email: email.trim(),
        mobile: mobile.trim(),
        location,
      });
    } else if (activeClassId) {
      onAddStudentToClass({
        classId: activeClassId,
        name: name.trim(),
        registerNumber: registerNumber.trim(),
        department,
        classYear,
        semester,
        section: section.trim() || 'A',
        email: email.trim(),
        mobile: mobile.trim(),
        location,
      });
    }
    setIsStudentModalOpen(false);
  };

  const handleCsvFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const parsedPreview = parseStudentCsvImport(csvText);

  const handleConfirmImport = () => {
    if (!activeClassId || parsedPreview.length === 0) return;
    onImportStudentsCsv(activeClassId, parsedPreview);
    setIsImportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Selected Class Context & Actions */}
      <section className="edu-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label
              htmlFor="fac-stu-class-select"
              className="block text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] mb-1"
            >
              Step 2 of 6 · Active Class
            </label>
            <select
              id="fac-stu-class-select"
              value={activeClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="edu-input px-3 text-sm font-semibold text-[#0F172A]"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} (Sem {cls.semester})
                </option>
              ))}
            </select>
          </div>

          {activeClass && (
            <div className="border-l border-[#E2E8F0] pl-4">
              <p className="text-xs font-semibold text-[#0F172A]">
                {activeClass.className}
              </p>
              <p className="text-xs text-[#434655] tabular-nums">
                Total Students: <strong className="text-[#0F172A]">{classStudents.length}</strong> ·{' '}
                {activeClass.department}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onGoToSubjects}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
            <span>Manage Subjects</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            <span>Import CSV / Excel</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            disabled={!activeClassId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Student</span>
          </button>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="edu-card p-5 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <label htmlFor="cls-stu-search" className="sr-only">
            Search students by name or register number
          </label>
          <Search
            className="h-4 w-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="cls-stu-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or register number (e.g., 711725104001)..."
            className="edu-input w-full pl-9 pr-3 text-sm"
          />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="cls-stu-perf" className="sr-only">
            Filter by academic performance
          </label>
          <select
            id="cls-stu-perf"
            value={perfFilter}
            onChange={(e) =>
              setPerfFilter(e.target.value as typeof perfFilter)
            }
            className="edu-input w-full px-3 text-sm"
          >
            <option value="all">All Performance Levels</option>
            <option value="needs_support">Needs Support (&lt; 65% Marks)</option>
            <option value="satisfactory">Satisfactory (65% – 79%)</option>
            <option value="high_performing">High Performing (80%+)</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label htmlFor="cls-stu-risk" className="sr-only">
            Filter by risk level
          </label>
          <select
            id="cls-stu-risk"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as 'all' | RiskTier)}
            className="edu-input w-full px-3 text-sm"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </section>

      {/* Enrolled Students Table */}
      <section className="edu-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <h3 className="text-base font-semibold text-[#0F172A]">
              No matching students in {activeClass?.className ?? 'this class'}
            </h3>
            <p className="text-xs text-[#434655]">
              Add students individually, import via CSV/Excel, or clear your search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4 whitespace-nowrap">Student &amp; Register No</th>
                  <th className="py-3 px-4 whitespace-nowrap">Contact</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Attendance</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Internal Avg</th>
                  <th className="py-3 px-4 whitespace-nowrap">Risk Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {filtered.map((stu) => {
                  const { effectiveScore, tier } = getStudentRiskSummary(stu, thresholds);
                  return (
                    <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">{stu.name}</div>
                        <div className="text-xs text-[#434655] tabular-nums mt-0.5">
                          {stu.studentCode} · {stu.classYear} · Sem {stu.semester} ({stu.section})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#434655]">
                        <div className="text-[#0F172A]">{stu.email}</div>
                        <div className="mt-0.5 tabular-nums">
                          {stu.mobile} · {stu.location}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-[#0F172A]">
                        {stu.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-semibold text-[#0F172A]">
                          {stu.internalMarksAvg}%
                        </span>
                        <span className="ml-1.5 text-xs text-[#434655]">
                          ({stu.gpa.toFixed(1)})
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <RiskBadge tier={tier} score={effectiveScore} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenAcademicEntry(stu.id)}
                            className="rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                          >
                            Academic Entry
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(stu)}
                            aria-label={`Edit ${stu.name}`}
                            className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] p-1.5 text-[#434655] hover:text-[#0F172A] cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(stu.id)}
                            aria-label={`Remove ${stu.name} from class`}
                            className="rounded-lg border border-[#FECACA] bg-white hover:bg-[#FEF2F2] p-1.5 text-[#B91C1C] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Student Modal */}
      {isStudentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fac-stu-modal-title"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 id="fac-stu-modal-title" className="text-lg font-bold text-[#0F172A]">
                {editingStudentId ? 'Edit Student Details' : 'Enroll New Student in Class'}
              </h2>
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fs-name" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Student Name
                  </label>
                  <input
                    id="fs-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Arjun Kumar M"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="fs-reg" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Register Number
                  </label>
                  <input
                    id="fs-reg"
                    type="text"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="711725104010"
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fs-dept" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Department
                </label>
                <select
                  id="fs-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="edu-input w-full px-3 text-sm"
                >
                  {TN_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="fs-year" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Year of Study
                  </label>
                  <select
                    id="fs-year"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value as YearOfStudy)}
                    className="edu-input w-full px-3 text-sm"
                  >
                    <option value="I Year">I Year</option>
                    <option value="II Year">II Year</option>
                    <option value="III Year">III Year</option>
                    <option value="IV Year">IV Year</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fs-sem" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Semester
                  </label>
                  <select
                    id="fs-sem"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fs-sec" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Section
                  </label>
                  <input
                    id="fs-sec"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label htmlFor="fs-email" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Email Address
                  </label>
                  <input
                    id="fs-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@kongutech.edu.in"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="fs-mobile" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Mobile Number
                  </label>
                  <input
                    id="fs-mobile"
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98431 21055"
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="fs-city" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    City / District
                  </label>
                  <select
                    id="fs-city"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
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

              {formError && <p className="text-xs font-medium text-[#B91C1C]">{formError}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  {editingStudentId ? 'Save Student Info' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV / Excel Import Modal */}
      {isImportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-import-title"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
                <h2 id="csv-import-title" className="text-lg font-bold text-[#0F172A]">
                  Import Students via CSV / Excel Export
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                aria-label="Close import modal"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="csv-file-input" className="text-xs font-semibold text-[#0F172A]">
                  Upload `.csv` file exported from Excel or edit rows below:
                </label>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileUpload}
                  className="text-xs text-[#434655] file:mr-3 file:rounded-lg file:border file:border-[#E2E8F0] file:bg-[#F8FAFC] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0F172A] cursor-pointer"
                />
              </div>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-3 font-mono text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />

              <p className="text-xs text-[#434655] tabular-nums">
                Detected <strong className="text-[#0F172A]">{parsedPreview.length}</strong> valid student records for import into{' '}
                <strong className="text-[#0F172A]">{activeClass?.className}</strong>.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedPreview.length === 0}
                className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                Import {parsedPreview.length} Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
