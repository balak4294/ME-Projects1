import { useState, type FormEvent } from 'react';
import { BookOpen, Edit3, FolderPlus, Layers, Users, X } from 'lucide-react';
import type {
  AcademicClass,
  FacultyMember,
  RiskThresholds,
  Student,
  SubjectItem,
} from '../types/edupredict';
import { computeClassMetrics, TN_DEPARTMENTS } from '../utils/riskEngine';

interface FacultyClassesScreenProps {
  faculty: FacultyMember;
  facultyList: FacultyMember[];
  classes: AcademicClass[];
  students: Student[];
  subjects: SubjectItem[];
  thresholds: RiskThresholds;
  selectedClassId: string;
  onSelectClassAndOpenStudents: (classId: string) => void;
  onCreateClass: (payload: Omit<AcademicClass, 'id'>) => void;
  onUpdateClass: (classId: string, payload: Omit<AcademicClass, 'id'>) => void;
}

export function FacultyClassesScreen({
  faculty,
  facultyList,
  classes,
  students,
  subjects,
  thresholds,
  selectedClassId,
  onSelectClassAndOpenStudents,
  onCreateClass,
  onUpdateClass,
}: FacultyClassesScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const [className, setClassName] = useState('');
  const [department, setDepartment] = useState(faculty.department || TN_DEPARTMENTS[0]);
  const [academicYear, setAcademicYear] = useState('2026–2027');
  const [semester, setSemester] = useState(3);
  const [section, setSection] = useState('A');
  const [batch, setBatch] = useState('2025–2029');
  const [description, setDescription] = useState('');
  const [assignedFacultyId, setAssignedFacultyId] = useState(faculty.id);
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingClassId(null);
    setClassName('');
    setDepartment(faculty.department || TN_DEPARTMENTS[0]);
    setAcademicYear('2026–2027');
    setSemester(3);
    setSection('A');
    setBatch('2025–2029');
    setDescription('');
    setAssignedFacultyId(faculty.id);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: AcademicClass) => {
    setEditingClassId(cls.id);
    setClassName(cls.className);
    setDepartment(cls.department);
    setAcademicYear(cls.academicYear);
    setSemester(cls.semester);
    setSection(cls.section);
    setBatch(cls.batch);
    setDescription(cls.description);
    setAssignedFacultyId(cls.assignedFacultyId);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (className.trim().length < 3) {
      setFormError('Enter a valid class name (e.g., CSE – II Year – Section A).');
      return;
    }
    const targetFaculty =
      facultyList.find((f) => f.id === assignedFacultyId) ?? faculty;

    const payload: Omit<AcademicClass, 'id'> = {
      className: className.trim(),
      department,
      academicYear: academicYear.trim() || '2026–2027',
      semester,
      section: section.trim() || 'A',
      batch: batch.trim() || '2025–2029',
      description:
        description.trim() ||
        `${department} Semester ${semester} Section ${section.trim() || 'A'}`,
      assignedFacultyId: targetFaculty.id,
      assignedFacultyName: targetFaculty.name,
    };

    if (editingClassId) {
      onUpdateClass(editingClassId, payload);
    } else {
      onCreateClass(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header Strip */}
      <section className="edu-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
            Step 1 of 6 · Academic Class Structure
          </p>
          <h2 className="text-base font-semibold text-[#0F172A]">
            My Assigned Classes &amp; Sections ({classes.length})
          </h2>
          <p className="text-xs text-[#434655]">
            Create classes, organize semesters and batches, then open a class to enroll students and assign subjects.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
          <span>Create New Class</span>
        </button>
      </section>

      {/* Class Cards Grid */}
      {classes.length === 0 ? (
        <section className="edu-card p-12 text-center space-y-3">
          <Layers className="h-8 w-8 text-[#2563EB] mx-auto" aria-hidden="true" />
          <h3 className="text-base font-semibold text-[#0F172A]">
            No classes created yet
          </h3>
          <p className="text-xs text-[#434655] max-w-md mx-auto">
            Create your first class (for example, CSE – II Year – Section A) to begin enrolling students and managing subjects.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            <span>Create Class</span>
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const stats = computeClassMetrics(cls, students, subjects, thresholds);
            const isSelected = cls.id === selectedClassId;
            return (
              <article
                key={cls.id}
                className={`edu-card p-6 flex flex-col justify-between gap-5 transition-colors ${
                  isSelected ? 'ring-2 ring-[#2563EB]/25 border-[#2563EB]' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] tabular-nums">
                        Sem {cls.semester} · Sec {cls.section} · {cls.academicYear}
                      </span>
                      <h3 className="mt-2.5 font-display text-lg font-bold text-[#0F172A]">
                        {cls.className}
                      </h3>
                      <p className="text-xs font-medium text-[#434655] mt-0.5">
                        {cls.department}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#434655] leading-relaxed">
                    {cls.description}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#F1F5F9]">
                    <div>
                      <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#2563EB]" aria-hidden="true" />
                        <span>Students</span>
                      </p>
                      <p className="mt-0.5 text-base font-bold text-[#0F172A] tabular-nums">
                        {stats.studentCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-[#8B5CF6]" aria-hidden="true" />
                        <span>Subjects</span>
                      </p>
                      <p className="mt-0.5 text-base font-bold text-[#0F172A] tabular-nums">
                        {stats.subjectCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#64748B]">High Risk</p>
                      <p className="mt-0.5 text-base font-bold text-[#B91C1C] tabular-nums">
                        {stats.highRiskCount}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#434655] pt-1">
                    Batch: <strong className="text-[#0F172A]">{cls.batch}</strong> · Advisor:{' '}
                    <strong className="text-[#0F172A]">{cls.assignedFacultyName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => onSelectClassAndOpenStudents(cls.id)}
                    className="flex-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  >
                    View Class
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(cls)}
                    aria-label={`Edit ${cls.className}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#434655]" aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Create / Edit Class Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-modal-title"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 id="class-modal-title" className="text-lg font-bold text-[#0F172A]">
                {editingClassId ? 'Edit Academic Class' : 'Create New Academic Class'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cls-name" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Class Name
                  </label>
                  <input
                    id="cls-name"
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g., CSE – II Year – Section B"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cls-dept" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Department
                  </label>
                  <select
                    id="cls-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="edu-input w-full px-3 text-sm"
                  >
                    {TN_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="cls-ay" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Academic Year
                  </label>
                  <input
                    id="cls-ay"
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026–2027"
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="cls-sem" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Semester
                  </label>
                  <select
                    id="cls-sem"
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
                  <label htmlFor="cls-sec" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Section
                  </label>
                  <input
                    id="cls-sec"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cls-batch" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Batch
                  </label>
                  <input
                    id="cls-batch"
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="2025–2029"
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cls-fac" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Assigned Faculty
                </label>
                <select
                  id="cls-fac"
                  value={assignedFacultyId}
                  onChange={(e) => setAssignedFacultyId(e.target.value)}
                  className="edu-input w-full px-3 text-sm"
                >
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cls-desc" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Class Description
                </label>
                <textarea
                  id="cls-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Curriculum focus, lab batch structure, and mentoring schedule..."
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {formError && <p className="text-xs font-medium text-[#B91C1C]">{formError}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  {editingClassId ? 'Save Class Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
