import { useState, type FormEvent } from 'react';
import { Bell, Mail, MapPin, Phone, Save, ShieldCheck, User } from 'lucide-react';
import type {
  AcademicClass,
  FacultyMember,
  FacultyNotificationPrefs,
  Student,
} from '../types/edupredict';

interface FacultyProfileScreenProps {
  faculty: FacultyMember;
  classes: AcademicClass[];
  students: Student[];
}

export function FacultyProfileScreen({
  faculty,
  classes,
  students,
}: FacultyProfileScreenProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-7 edu-card p-6 space-y-5">
        <div className="flex items-start gap-4 pb-4 border-b border-[#F1F5F9]">
          <div className="h-14 w-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <User className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F172A]">
              {faculty.name}
            </h2>
            <p className="text-sm text-[#434655]">{faculty.title}</p>
            <p className="text-xs font-semibold text-[#2563EB] mt-1">
              {faculty.department}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
            <dt className="text-xs text-[#434655] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Institutional Email</span>
            </dt>
            <dd className="mt-1 font-semibold text-[#0F172A] break-all">
              {faculty.email}
            </dd>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
            <dt className="text-xs text-[#434655] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Mobile Number</span>
            </dt>
            <dd className="mt-1 font-semibold text-[#0F172A] tabular-nums">
              {faculty.mobile}
            </dd>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
            <dt className="text-xs text-[#434655] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Institution &amp; Campus</span>
            </dt>
            <dd className="mt-1 font-semibold text-[#0F172A]">
              {faculty.institution}, {faculty.location}
            </dd>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
            <dt className="text-xs text-[#434655] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#166534]" aria-hidden="true" />
              <span>Academic Caseload</span>
            </dt>
            <dd className="mt-1 font-semibold text-[#0F172A] tabular-nums">
              {classes.length} Classes · {students.length} Assigned Students
            </dd>
          </div>
        </dl>
      </section>

      <aside className="lg:col-span-5 edu-card p-6 space-y-3">
        <h3 className="text-base font-semibold text-[#0F172A]">
          Assigned Classes Overview
        </h3>
        <ul className="space-y-2.5">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"
            >
              <p className="text-sm font-semibold text-[#0F172A]">{cls.className}</p>
              <p className="text-xs text-[#434655] mt-0.5 tabular-nums">
                Academic Year {cls.academicYear} · Semester {cls.semester} · Batch {cls.batch}
              </p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

interface FacultySettingsScreenProps {
  prefs: FacultyNotificationPrefs;
  onSavePrefs: (next: FacultyNotificationPrefs) => void;
}

export function FacultySettingsScreen({
  prefs,
  onSavePrefs,
}: FacultySettingsScreenProps) {
  const [draft, setDraft] = useState<FacultyNotificationPrefs>(prefs);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSavePrefs(draft);
  };

  return (
    <section className="edu-card p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#F1F5F9]">
        <Bell className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            Faculty Mentoring &amp; Alert Preferences
          </h2>
          <p className="text-xs text-[#434655]">
            Configure early-warning thresholds and summary notifications for your assigned classes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fs-att-warn" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Attendance Warning Floor (%)
            </label>
            <input
              id="fs-att-warn"
              type="number"
              min={60}
              max={90}
              value={draft.attendanceWarningThreshold}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attendanceWarningThreshold: Number(e.target.value) || 75,
                })
              }
              className="edu-input w-full px-3 text-sm tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="fs-ia-warn" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Internal Marks Warning (%)
            </label>
            <input
              id="fs-ia-warn"
              type="number"
              min={40}
              max={80}
              value={draft.internalMarksWarningThreshold}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  internalMarksWarningThreshold: Number(e.target.value) || 60,
                })
              }
              className="edu-input w-full px-3 text-sm tabular-nums"
            />
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              High-Risk Class Alerts
            </p>
            <p className="text-xs text-[#434655]">
              Highlight students crossing simulated high-risk score thresholds after IA entry.
            </p>
          </div>
          <input
            type="checkbox"
            checked={draft.emailAlertsForHighRisk}
            onChange={(e) =>
              setDraft({ ...draft, emailAlertsForHighRisk: e.target.checked })
            }
            className="h-4 w-4 accent-[#2563EB]"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              Weekly Class Mentoring Digest
            </p>
            <p className="text-xs text-[#434655]">
              Receive Friday summary of pending improvement plans and attendance recovery.
            </p>
          </div>
          <input
            type="checkbox"
            checked={draft.weeklyClassSummaryDigest}
            onChange={(e) =>
              setDraft({ ...draft, weeklyClassSummaryDigest: e.target.checked })
            }
            className="h-4 w-4 accent-[#2563EB]"
          />
        </label>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </section>
  );
}
