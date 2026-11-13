import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpenCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import type { AuthSession, FacultyMember, Student, UserRole } from '../types/edupredict';
import { BrandLogo } from './BrandLogo';

interface LoginScreenProps {
  facultyList: FacultyMember[];
  students: Student[];
  onLogin: (session: AuthSession) => void;
}

const ROLE_CARDS: Array<{
  role: UserRole;
  title: string;
  subtitle: string;
  scope: string;
  icon: typeof ShieldCheck;
  accentBg: string;
  accentText: string;
}> = [
  {
    role: 'admin',
    title: 'Admin Login',
    subtitle: 'Institutional Governance',
    scope:
      'View all faculty-created classes, department benchmarks, subject allocations, risk tiers, and college-wide improvement plans.',
    icon: ShieldCheck,
    accentBg: 'bg-[#EFF6FF]',
    accentText: 'text-[#2563EB]',
  },
  {
    role: 'faculty',
    title: 'Faculty Login',
    subtitle: 'Class & Academic Workflow',
    scope:
      'Create classes, enroll students, assign subjects, enter attendance & IA marks, inspect simulated AI risk, and manage improvement plans.',
    icon: BookOpenCheck,
    accentBg: 'bg-[#F5F3FF]',
    accentText: 'text-[#6B38D4]',
  },
  {
    role: 'student',
    title: 'Student Login',
    subtitle: 'Personal Academic Portal',
    scope:
      'View your enrolled class, subject-wise attendance, IA marks, assignment status, simulated risk insights, and improvement plan.',
    icon: GraduationCap,
    accentBg: 'bg-[#E0F2FE]',
    accentText: 'text-[#0369A1]',
  },
];

export function LoginScreen({ facultyList, students, onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    facultyList[0]?.id ?? 'fac-01'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id ?? 'stu-01'
  );
  const [email, setEmail] = useState('principal@kongutech.edu.in');
  const [password, setPassword] = useState('EduPulse2026');
  const [error, setError] = useState('');

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setEmail('principal@kongutech.edu.in');
    } else if (role === 'faculty') {
      const fac = facultyList.find((f) => f.id === selectedFacultyId) ?? facultyList[0];
      if (fac) setEmail(fac.email);
    } else {
      const stu = students.find((s) => s.id === selectedStudentId) ?? students[0];
      if (stu) setEmail(stu.email);
    }
  };

  const handleFacultyChange = (id: string) => {
    setSelectedFacultyId(id);
    setError('');
    const fac = facultyList.find((f) => f.id === id);
    if (fac) setEmail(fac.email);
  };

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    setError('');
    const stu = students.find((s) => s.id === id);
    if (stu) setEmail(stu.email);
  };

  const handleEmailChange = (nextEmail: string) => {
    setEmail(nextEmail);
    if (error) setError('');
    const normalized = nextEmail.trim().toLowerCase();
    if (selectedRole === 'faculty') {
      const matchedFac = facultyList.find(
        (f) => f.email.toLowerCase() === normalized
      );
      if (matchedFac) setSelectedFacultyId(matchedFac.id);
    } else if (selectedRole === 'student') {
      const matchedStu = students.find(
        (s) => s.email.toLowerCase() === normalized
      );
      if (matchedStu) setSelectedStudentId(matchedStu.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid college email address.');
      return;
    }
    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    if (selectedRole === 'admin') {
      onLogin({
        role: 'admin',
        userId: 'adm-01',
        displayName: 'Dr. V. Balasubramanian',
        subtitle: 'Principal · Kongu Institute of Technology',
        email: trimmedEmail,
      });
      return;
    }

    if (selectedRole === 'faculty') {
      const emailMatched = facultyList.find(
        (f) => f.email.toLowerCase() === normalizedEmail
      );
      const selectedFac = facultyList.find((f) => f.id === selectedFacultyId);
      const fac =
        emailMatched ??
        (selectedFac && selectedFac.email.toLowerCase() === normalizedEmail
          ? selectedFac
          : undefined);

      if (!fac) {
        setError(
          'No matching faculty account found for this college email. Choose an account from the dropdown or enter its institutional email.'
        );
        return;
      }

      onLogin({
        role: 'faculty',
        userId: fac.id,
        displayName: fac.name,
        subtitle: `${fac.department} · ${fac.title}`,
        email: fac.email,
      });
      return;
    }

    const emailMatchedStu = students.find(
      (s) => s.email.toLowerCase() === normalizedEmail
    );
    const selectedStu = students.find((s) => s.id === selectedStudentId);
    const stu =
      emailMatchedStu ??
      (selectedStu && selectedStu.email.toLowerCase() === normalizedEmail
        ? selectedStu
        : undefined);

    if (!stu) {
      setError(
        'No matching student profile found for this college email. Select a student from the dropdown or enter their register email.'
      );
      return;
    }

    onLogin({
      role: 'student',
      userId: stu.id,
      displayName: stu.name,
      subtitle: `${stu.studentCode} · ${stu.className}`,
      email: stu.email,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BrandLogo size="lg" showTagline />
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold text-[#0F172A]">
              Kongu Institute of Technology · Coimbatore, Tamil Nadu
            </p>
            <p className="text-[11px] text-[#434655] mt-0.5">
              Academic Year 2026–2027 · Odd Semester · Anna University Affiliated Curriculum
            </p>
          </div>
        </div>

        {/* Main 2-column Login Card */}
        <div className="edu-card p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3 Role Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A]">
                Select Your Portal Role
              </h1>
              <p className="mt-1 text-sm text-[#434655] max-w-[60ch]">
                Choose an independent workspace role for Tamil Nadu engineering institution analytics, faculty class management, or personal student progress.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5" role="radiogroup" aria-label="Portal Role Selection">
              {ROLE_CARDS.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role;
                return (
                  <button
                    key={card.role}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectRole(card.role)}
                    className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#EFF6FF]/60 ring-2 ring-[#2563EB]/20'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${card.accentBg} ${card.accentText}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-base font-bold text-[#0F172A]">
                          {card.title}
                        </span>
                        <span className="text-xs font-semibold text-[#434655]">
                          {card.subtitle}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#434655] leading-relaxed">
                        {card.scope}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Role Sign-In Form */}
          <div className="lg:col-span-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-6">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">
              {selectedRole === 'admin'
                ? 'Administrator Sign In'
                : selectedRole === 'faculty'
                  ? 'Faculty Member Sign In'
                  : 'Student Portal Sign In'}
            </h2>
            <p className="mt-1 text-xs text-[#434655]">
              {selectedRole === 'admin'
                ? 'Sign in with Principal / Dean institutional credentials.'
                : selectedRole === 'faculty'
                  ? 'Select your faculty profile to manage classes, subjects, marks, and risk analysis.'
                  : 'Select your student register profile to view your personal academic pulse.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {selectedRole === 'faculty' && (
                <div>
                  <label
                    htmlFor="login-faculty-select"
                    className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                  >
                    Faculty Account
                  </label>
                  <select
                    id="login-faculty-select"
                    value={selectedFacultyId}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="edu-input w-full px-3 text-sm text-[#0F172A]"
                  >
                    {facultyList.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.department.match(/\(([^)]+)\)/)?.[1] ?? fac.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRole === 'student' && (
                <div>
                  <label
                    htmlFor="login-student-select"
                    className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                  >
                    Student Account
                  </label>
                  <select
                    id="login-student-select"
                    value={selectedStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="edu-input w-full px-3 text-sm text-[#0F172A]"
                  >
                    {students.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.name} · {stu.className} ({stu.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  College Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="edu-input w-full px-3 text-sm text-[#0F172A]"
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-[#B91C1C]">{error}</p>
              )}

              <button
                type="submit"
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer ${
                  selectedRole === 'faculty'
                    ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                }`}
              >
                <span>
                  {selectedRole === 'admin'
                    ? 'Sign In to Admin Dashboard'
                    : selectedRole === 'faculty'
                      ? 'Sign In to Faculty Dashboard'
                      : 'Sign In to Student Dashboard'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <p className="text-[11px] text-[#64748B] leading-relaxed pt-1 border-t border-[#E2E8F0]">
                Frontend demo mode: sessions persist in your browser (<code className="font-mono">localStorage</code>) and use simulated risk heuristics rather than production authentication or trained ML.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
