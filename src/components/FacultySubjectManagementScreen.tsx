import { useState, type FormEvent } from 'react';
import { BookOpen, Edit3, Plus, Trash2, X } from 'lucide-react';
import type { AcademicClass, FacultyMember, SubjectItem } from '../types/edupredict';

interface FacultySubjectManagementScreenProps {
  faculty: FacultyMember;
  facultyList: FacultyMember[];
  classes: AcademicClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  subjects: SubjectItem[];
  onAddSubject: (payload: Omit<SubjectItem, 'id'>) => void;
  onUpdateSubject: (subjectId: string, payload: Omit<SubjectItem, 'id'>) => void;
  onRemoveSubject: (subjectId: string) => void;
  onProceedToAcademicEntry: () => void;
}

export function FacultySubjectManagementScreen({
  faculty,
  facultyList,
  classes,
  selectedClassId,
  onSelectClass,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onRemoveSubject,
  onProceedToAcademicEntry,
}: FacultySubjectManagementScreenProps) {
  const activeClass =
    classes.find((c) => c.id === selectedClassId) ?? classes[0] ?? null;
  const activeClassId = activeClass?.id ?? '';

  const classSubjects = subjects.filter((s) => s.classId === activeClassId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [targetClassId, setTargetClassId] = useState(activeClassId);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'Theory' | 'Practical'>('Theory');
  const [credits, setCredits] = useState(3);
  const [assignedFacultyId, setAssignedFacultyId] = useState(faculty.id);
  const [semester, setSemester] = useState(activeClass?.semester ?? 3);
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingSubjectId(null);
    setTargetClassId(activeClassId);
    setCode('');
    setName('');
    setType('Theory');
    setCredits(3);
    setAssignedFacultyId(faculty.id);
    setSemester(activeClass?.semester ?? 3);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: SubjectItem) => {
    setEditingSubjectId(sub.id);
    setTargetClassId(sub.classId);
    setCode(sub.code);
    setName(sub.name);
    setType(sub.type);
    setCredits(sub.credits);
    setAssignedFacultyId(sub.assignedFacultyId);
    setSemester(sub.semester);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 3 || name.trim().length < 3 || !targetClassId) {
      setFormError('Enter a valid subject code (e.g., CS3406) and subject name.');
      return;
    }

    const assignedFac =
      facultyList.find((f) => f.id === assignedFacultyId) ?? faculty;

    const payload: Omit<SubjectItem, 'id'> = {
      classId: targetClassId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      credits,
      assignedFacultyId: assignedFac.id,
      assignedFacultyName: assignedFac.name,
      semester,
    };

    if (editingSubjectId) {
      onUpdateSubject(editingSubjectId, payload);
    } else {
      onAddSubject(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Class Selector */}
      <section className="edu-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label
              htmlFor="fac-sub-class-select"
              className="block text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] mb-1"
            >
              Step 3 of 6 · Class Subjects
            </label>
            <select
              id="fac-sub-class-select"
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
                Assigned Subjects: <span className="tabular-nums">{classSubjects.length}</span>
              </p>
              <p className="text-xs text-[#434655] tabular-nums">
                Total Credits:{' '}
                <strong className="text-[#0F172A]">
                  {classSubjects.reduce((sum, s) => sum + s.credits, 0)}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onProceedToAcademicEntry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer whitespace-nowrap"
          >
            <span>Enter Student Marks &amp; Attendance →</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            disabled={!activeClassId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Create &amp; Assign Subject</span>
          </button>
        </div>
      </section>

      {/* Subjects Table */}
      <section className="edu-card overflow-hidden">
        {classSubjects.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <BookOpen className="h-8 w-8 text-[#2563EB] mx-auto" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#0F172A]">
              No subjects assigned to {activeClass?.className ?? 'this class'}
            </h3>
            <p className="text-xs text-[#434655]">
              Create Theory or Practical subjects (e.g., CS3401 – Algorithms) to start entering academic records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4 whitespace-nowrap">Subject Code</th>
                  <th className="py-3 px-4 whitespace-nowrap">Subject Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Credits</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Semester</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assigned Faculty</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {classSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-semibold text-[#2563EB] tabular-nums whitespace-nowrap">
                      {sub.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      {sub.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          sub.type === 'Theory'
                            ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                            : 'bg-[#F5F3FF] text-[#6B38D4]'
                        }`}
                      >
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#0F172A]">
                      {sub.credits}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#434655]">
                      Sem {sub.semester}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#0F172A]">
                      {sub.assignedFacultyName}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(sub)}
                          aria-label={`Edit ${sub.code} ${sub.name}`}
                          className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] p-1.5 text-[#434655] hover:text-[#0F172A] cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSubject(sub.id)}
                          aria-label={`Remove ${sub.code}`}
                          className="rounded-lg border border-[#FECACA] bg-white hover:bg-[#FEF2F2] p-1.5 text-[#B91C1C] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sub-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 id="sub-modal-title" className="text-lg font-bold text-[#0F172A]">
                {editingSubjectId ? 'Edit Subject Assignment' : 'Create & Assign Subject'}
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
              <div>
                <label htmlFor="sub-class" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Assign to Class
                </label>
                <select
                  id="sub-class"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="edu-input w-full px-3 text-sm"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="sub-code" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Subject Code
                  </label>
                  <input
                    id="sub-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., CS3406"
                    className="edu-input w-full px-3 text-sm uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="sub-name" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Subject Name
                  </label>
                  <input
                    id="sub-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Theory of Computation"
                    className="edu-input w-full px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="sub-type" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Subject Type
                  </label>
                  <select
                    id="sub-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Theory' | 'Practical')}
                    className="edu-input w-full px-3 text-sm"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sub-credits" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Credits
                  </label>
                  <input
                    id="sub-credits"
                    type="number"
                    min={1}
                    max={6}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="sub-sem" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Semester
                  </label>
                  <select
                    id="sub-sem"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="sub-fac" className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Assigned Faculty
                </label>
                <select
                  id="sub-fac"
                  value={assignedFacultyId}
                  onChange={(e) => setAssignedFacultyId(e.target.value)}
                  className="edu-input w-full px-3 text-sm"
                >
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
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
                  {editingSubjectId ? 'Save Subject' : 'Assign Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
