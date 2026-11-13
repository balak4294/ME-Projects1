import { useState } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileBarChart2,
  FileSpreadsheet,
  FolderKanban,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Sliders,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { AdminClassesScreen } from './components/AdminClassesScreen';
import { AlertRulesScreen } from './components/AlertRulesScreen';
import { BrandLogo } from './components/BrandLogo';
import { ConfirmModal } from './components/ConfirmModal';
import { FacultyAcademicEntryScreen } from './components/FacultyAcademicEntryScreen';
import { FacultyClassesScreen } from './components/FacultyClassesScreen';
import { FacultyManagementScreen } from './components/FacultyManagementScreen';
import { FacultyOverviewScreen } from './components/FacultyOverviewScreen';
import {
  FacultyProfileScreen,
  FacultySettingsScreen,
} from './components/FacultyProfileSettingsScreen';
import { FacultyRiskAnalysisScreen } from './components/FacultyRiskAnalysisScreen';
import { FacultyStudentManagementScreen } from './components/FacultyStudentManagementScreen';
import { FacultySubjectManagementScreen } from './components/FacultySubjectManagementScreen';
import { InterventionsScreen } from './components/InterventionsScreen';
import { LoginScreen } from './components/LoginScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentDetailDrawer } from './components/StudentDetailDrawer';
import { StudentsScreen } from './components/StudentsScreen';
import { COHORT_WEEKLY_SERIES } from './data/seedData';
import { useEduPulseState } from './hooks/useEduPulseState';
import type { ScreenId } from './types/edupredict';

const SCREEN_META: Record<ScreenId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Cohort Overview',
    subtitle:
      'Institution-wide attendance, internal assessment metrics, and simulated academic risk insights.',
  },
  admin_classes: {
    title: 'Classes & Subjects',
    subtitle:
      'Monitor all faculty-created classes, assigned subjects, faculty ownership, and risk classifications across departments.',
  },
  students: {
    title: 'Student Directory',
    subtitle:
      'Filterable student academic risk directory with register numbers, class details, and mentor actions.',
  },
  faculty: {
    title: 'Faculty & Departments',
    subtitle:
      'Manage faculty members, assign student caseloads, and monitor department-wise performance.',
  },
  interventions: {
    title: 'Improvement Plans',
    subtitle:
      'Create, assign, and monitor structured academic improvement plans with faculty remarks.',
  },
  reports: {
    title: 'Reports & Analytics',
    subtitle:
      'Semester retention benchmarks, department comparisons, faculty progress, and CSV exports.',
  },
  rules: {
    title: 'Early Warning Rules',
    subtitle:
      'Calibrate simulated risk thresholds, attendance floors, and assignment warning triggers.',
  },
  fac_classes: {
    title: 'My Classes',
    subtitle:
      'Step 1 · Create and manage academic classes by department, semester, section, and batch.',
  },
  fac_students: {
    title: 'Student Management',
    subtitle:
      'Step 2 · Enroll students into classes, import via CSV/Excel, and filter by performance or risk.',
  },
  fac_subjects: {
    title: 'Subject Management',
    subtitle:
      'Step 3 · Create theory or practical subjects and assign or transfer subjects across classes.',
  },
  fac_data_entry: {
    title: 'Academic Data Entry',
    subtitle:
      'Step 4 · Enter subject-wise attendance, IA1/IA2/IA3 marks, assignments, and engagement scores.',
  },
  fac_risk_analysis: {
    title: 'AI Risk Analysis',
    subtitle:
      'Step 5 · Review simulated risk predictions, contributing factors, and subject-wise performance.',
  },
  fac_profile: {
    title: 'Faculty Profile',
    subtitle:
      'Your institutional profile, campus contact details, and assigned academic classes.',
  },
  fac_settings: {
    title: 'Mentoring Settings',
    subtitle:
      'Configure class attendance warning thresholds and weekly mentoring digest preferences.',
  },
  student_pulse: {
    title: 'My Academic Pulse',
    subtitle:
      'Read-only overview of your enrolled class, subject attendance, IA marks, and simulated risk.',
  },
  student_plan: {
    title: 'Improvement Plan',
    subtitle:
      'View faculty-assigned improvement plans and track your personal action checklist.',
  },
  student_history: {
    title: 'Progress & History',
    subtitle:
      'Review weekly risk score history, IA1/IA2/IA3 marks, and assignment submission status.',
  },
};

export default function App() {
  const state = useEduPulseState();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const {
    session,
    students,
    facultyList,
    classes,
    subjects,
    thresholds,
    facultyPrefs,
    activeScreen,
    setActiveScreen,
    studentTierFilter,
    setStudentTierFilter,
    setSelectedClassId,
    selectedEntryStudentId,
    setSelectedEntryStudentId,
    preselectedPlanStudentId,
    setPreselectedPlanStudentId,
    mobileMenuOpen,
    setMobileMenuOpen,
    toastMessage,
    showToast,
    currentFaculty,
    scopedClasses,
    scopedStudents,
    scopedSubjects,
    scopedInterventions,
    inspectedStudent,
    setInspectedStudentId,
    activeFacultyClassId,
    subjectBottlenecks,
    handleLogin,
    handleSignOut,
    assignAiPathwaysForIds,
    handleLaunchBatchHighRisk,
    handleCreateClass,
    handleUpdateClass,
    handleReassignClassFaculty,
    handleAddStudentToClass,
    handleUpdateStudentInfo,
    handleRemoveStudent,
    handleImportStudentsCsv,
    handleAddSubject,
    handleUpdateSubject,
    handleRemoveSubject,
    handleSaveSubjectRecord,
    handleAdvanceInterventionStatus,
    handleUpdateInterventionRemarks,
    handleCreateIntervention,
    handleCreatePlanForStudent,
    handleAddCaseNote,
    handleUpdateAcademicRecord,
    handleAddStudent,
    handleAddFaculty,
    handleToggleFacultyStatus,
    handleAssignStudentToFaculty,
    handleToggleStudentActivity,
    handleResetDemo,
    setThresholds,
    setFacultyPrefs,
    navigateToStudents,
    openAcademicEntryForStudent,
  } = state;

  if (!session) {
    return (
      <LoginScreen
        facultyList={facultyList}
        students={students}
        onLogin={handleLogin}
      />
    );
  }

  // Role-specific sidebar navigation
  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> =
    session.role === 'admin'
      ? [
          { id: 'overview', label: 'Cohort Overview', icon: LayoutDashboard },
          {
            id: 'admin_classes',
            label: 'Classes & Subjects',
            icon: FolderKanban,
            badge: classes.length,
          },
          {
            id: 'students',
            label: 'Student Directory',
            icon: Users,
            badge: scopedStudents.length,
          },
          {
            id: 'faculty',
            label: 'Faculty & Depts',
            icon: Building2,
            badge: facultyList.length,
          },
          {
            id: 'interventions',
            label: 'Improvement Plans',
            icon: ClipboardCheck,
            badge: scopedInterventions.filter((i) => i.status !== 'completed')
              .length,
          },
          { id: 'reports', label: 'Reports', icon: FileBarChart2 },
          { id: 'rules', label: 'Alert Rules', icon: Sliders },
        ]
      : session.role === 'faculty'
        ? [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            {
              id: 'fac_classes',
              label: 'My Classes',
              icon: FolderKanban,
              badge: scopedClasses.length,
            },
            {
              id: 'fac_students',
              label: 'Student Management',
              icon: Users,
              badge: scopedStudents.length,
            },
            {
              id: 'fac_subjects',
              label: 'Subject Management',
              icon: BookOpen,
              badge: scopedSubjects.length,
            },
            {
              id: 'fac_data_entry',
              label: 'Academic Data Entry',
              icon: FileSpreadsheet,
            },
            {
              id: 'fac_risk_analysis',
              label: 'AI Risk Analysis',
              icon: ShieldAlert,
            },
            {
              id: 'interventions',
              label: 'Improvement Plans',
              icon: ClipboardCheck,
              badge: scopedInterventions.filter((i) => i.status !== 'completed')
                .length,
            },
            { id: 'reports', label: 'Reports', icon: FileBarChart2 },
            { id: 'fac_profile', label: 'Profile', icon: UserCircle2 },
            { id: 'fac_settings', label: 'Settings', icon: Settings },
          ]
        : [
            { id: 'student_pulse', label: 'My Academic Pulse', icon: Activity },
            {
              id: 'student_plan',
              label: 'Improvement Plan',
              icon: ListChecks,
              badge:
                scopedStudents[0]?.improvementActivities.filter(
                  (a) => !a.completed
                ).length ?? 0,
            },
            { id: 'student_history', label: 'Progress & History', icon: History },
          ];

  const meta = SCREEN_META[activeScreen] ?? SCREEN_META.overview;
  const pageTitle =
    session.role === 'faculty' && activeScreen === 'overview'
      ? 'Faculty Dashboard'
      : meta.title;

  const loggedInStudent = scopedStudents[0] ?? students[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#E2E8F0]">
        <div className="h-16 px-5 flex items-center border-b border-[#F1F5F9]">
          <BrandLogo size="md" />
        </div>

        <nav
          aria-label="Primary Sidebar"
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#434655] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badge === 'number' && (
                  <span
                    className={`tabular-nums text-xs font-semibold shrink-0 ${
                      isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#F1F5F9] space-y-2.5">
          <div className="px-2">
            <p className="text-xs font-semibold text-[#0F172A] truncate">
              {session.displayName}
            </p>
            <p className="text-[11px] text-[#434655] truncate">
              {session.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-[#434655]" aria-hidden="true" />
            <span>Sign Out</span>
          </button>

          {session.role === 'admin' && (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Reset Demo Dataset
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[82vw] bg-white h-full border-r border-[#E2E8F0] flex flex-col z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#F1F5F9]">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-[#434655] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav
              aria-label="Mobile Navigation"
              className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveScreen(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                        : 'text-[#434655] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && (
                      <span className="tabular-nums text-xs shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#F1F5F9] space-y-2">
              <p className="text-xs font-semibold text-[#0F172A]">
                {session.displayName}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0F172A]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
              {session.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setConfirmResetOpen(true);
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[11px] font-medium text-[#64748B]"
                >
                  Reset Demo Dataset
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg border border-[#E2E8F0] p-2 text-[#0F172A]"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="sm:hidden font-display font-bold text-[#0F172A] whitespace-nowrap">
                EduPulse AI
              </span>
              <span className="hidden sm:inline text-[#64748B] whitespace-nowrap">
                {session.role === 'admin'
                  ? 'Admin Portal'
                  : session.role === 'faculty'
                    ? 'Faculty Portal'
                    : 'Student Portal'}
              </span>
              <span
                className="hidden sm:inline text-[#CBD5E1]"
                aria-hidden="true"
              >
                /
              </span>
              <span className="hidden sm:inline font-semibold text-[#0F172A] truncate">
                {pageTitle}
              </span>
              <span
                className="hidden md:inline text-[#CBD5E1]"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="hidden md:inline text-xs text-[#434655] whitespace-nowrap tabular-nums">
                2026–2027 · Odd Sem · Week 10
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {session.role === 'student' ? (
              <button
                type="button"
                onClick={() => setActiveScreen('student_plan')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sm:hidden">My Plan</span>
                <span className="hidden sm:inline">View Improvement Plan</span>
              </button>
            ) : session.role === 'faculty' ? (
              <button
                type="button"
                onClick={() =>
                  setActiveScreen(
                    activeScreen === 'fac_risk_analysis'
                      ? 'interventions'
                      : 'fac_risk_analysis'
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sm:hidden">
                  {activeScreen === 'fac_risk_analysis' ? 'Plans' : 'Risk View'}
                </span>
                <span className="hidden sm:inline">
                  {activeScreen === 'fac_risk_analysis'
                    ? 'Open Improvement Plans'
                    : 'Run AI Risk Analysis'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (activeScreen === 'overview') {
                    navigateToStudents('high');
                  } else {
                    handleLaunchBatchHighRisk();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sm:hidden">
                  {activeScreen === 'overview' ? 'High-Risk' : 'Batch Assign'}
                </span>
                <span className="hidden sm:inline">
                  {activeScreen === 'overview'
                    ? 'Review High-Risk Queue'
                    : 'Assign AI Improvement Plans'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Page Heading + Main View */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1400px] w-full mx-auto space-y-6">
          <div>
            <h1 className="font-display text-2xl sm:text-[28px] font-bold leading-9 text-[#0F172A]">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-[#434655] max-w-[72ch]">
              {meta.subtitle}
            </p>
          </div>

          {/* ADMIN VIEWS */}
          {session.role === 'admin' && activeScreen === 'overview' && (
            <OverviewScreen
              students={scopedStudents}
              interventions={scopedInterventions}
              thresholds={thresholds}
              weeklySeries={COHORT_WEEKLY_SERIES}
              bottlenecks={subjectBottlenecks}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onAssignAiPathway={(id) =>
                assignAiPathwaysForIds([id], 'ai_recommended')
              }
              onLaunchBatchHighRisk={handleLaunchBatchHighRisk}
              onNavigateToStudents={navigateToStudents}
            />
          )}

          {session.role === 'admin' && activeScreen === 'admin_classes' && (
            <AdminClassesScreen
              classes={classes}
              facultyList={facultyList}
              subjects={subjects}
              students={students}
              thresholds={thresholds}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onReassignClassFaculty={handleReassignClassFaculty}
            />
          )}

          {session.role === 'admin' && activeScreen === 'faculty' && (
            <FacultyManagementScreen
              facultyList={facultyList}
              classes={classes}
              students={students}
              interventions={scopedInterventions}
              thresholds={thresholds}
              onAddFaculty={handleAddFaculty}
              onToggleFacultyStatus={handleToggleFacultyStatus}
              onAssignStudentToFaculty={handleAssignStudentToFaculty}
            />
          )}

          {session.role === 'admin' && activeScreen === 'rules' && (
            <AlertRulesScreen
              thresholds={thresholds}
              students={students}
              onApplyThresholds={(next) => {
                setThresholds(next);
                showToast('Early-warning thresholds updated across institution.');
              }}
            />
          )}

          {/* FACULTY VIEWS (10-item structured workflow) */}
          {session.role === 'faculty' && activeScreen === 'overview' && (
            <FacultyOverviewScreen
              facultyName={session.displayName}
              classes={scopedClasses}
              subjects={scopedSubjects}
              students={scopedStudents}
              interventions={scopedInterventions}
              thresholds={thresholds}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onAssignAiPathway={(id) =>
                assignAiPathwaysForIds([id], 'ai_recommended')
              }
              onNavigate={(screen) => setActiveScreen(screen)}
            />
          )}

          {session.role === 'faculty' &&
            activeScreen === 'fac_classes' &&
            currentFaculty && (
              <FacultyClassesScreen
                faculty={currentFaculty}
                classes={scopedClasses}
                students={scopedStudents}
                subjects={scopedSubjects}
                thresholds={thresholds}
                selectedClassId={activeFacultyClassId}
                onSelectClassAndOpenStudents={(classId) => {
                  setSelectedClassId(classId);
                  setActiveScreen('fac_students');
                }}
                onCreateClass={handleCreateClass}
                onUpdateClass={handleUpdateClass}
              />
            )}

          {session.role === 'faculty' && activeScreen === 'fac_students' && (
            <FacultyStudentManagementScreen
              classes={scopedClasses}
              selectedClassId={activeFacultyClassId}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              students={scopedStudents}
              thresholds={thresholds}
              onAddStudentToClass={handleAddStudentToClass}
              onUpdateStudentInfo={handleUpdateStudentInfo}
              onRemoveStudent={handleRemoveStudent}
              onImportStudentsCsv={handleImportStudentsCsv}
              onOpenAcademicEntry={openAcademicEntryForStudent}
              onGoToSubjects={() => setActiveScreen('fac_subjects')}
            />
          )}

          {session.role === 'faculty' &&
            activeScreen === 'fac_subjects' &&
            currentFaculty && (
              <FacultySubjectManagementScreen
                faculty={currentFaculty}
                facultyList={facultyList}
                classes={scopedClasses}
                selectedClassId={activeFacultyClassId}
                onSelectClass={(classId) => setSelectedClassId(classId)}
                subjects={scopedSubjects}
                students={scopedStudents}
                onAddSubject={handleAddSubject}
                onUpdateSubject={handleUpdateSubject}
                onRemoveSubject={handleRemoveSubject}
                onProceedToAcademicEntry={() => setActiveScreen('fac_data_entry')}
              />
            )}

          {session.role === 'faculty' && activeScreen === 'fac_data_entry' && (
            <FacultyAcademicEntryScreen
              classes={scopedClasses}
              selectedClassId={activeFacultyClassId}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              students={scopedStudents}
              selectedStudentId={selectedEntryStudentId}
              onSelectStudent={(stuId) => setSelectedEntryStudentId(stuId)}
              thresholds={thresholds}
              onSaveSubjectRecord={handleSaveSubjectRecord}
              onGoToRiskAnalysis={() => setActiveScreen('fac_risk_analysis')}
            />
          )}

          {session.role === 'faculty' && activeScreen === 'fac_risk_analysis' && (
            <FacultyRiskAnalysisScreen
              classes={scopedClasses}
              selectedClassId={activeFacultyClassId}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              students={scopedStudents}
              thresholds={thresholds}
              onCreatePlanForStudent={handleCreatePlanForStudent}
              onOpenAcademicEntry={openAcademicEntryForStudent}
            />
          )}

          {session.role === 'faculty' &&
            activeScreen === 'fac_profile' &&
            currentFaculty && (
              <FacultyProfileScreen
                faculty={currentFaculty}
                classes={scopedClasses}
                students={scopedStudents}
              />
            )}

          {session.role === 'faculty' && activeScreen === 'fac_settings' && (
            <FacultySettingsScreen
              prefs={facultyPrefs}
              onSavePrefs={(next) => {
                setFacultyPrefs(next);
                showToast('Saved faculty mentoring & alert preferences.');
              }}
            />
          )}

          {/* SHARED ADMIN & FACULTY SCREENS */}
          {session.role === 'admin' && activeScreen === 'students' && (
            <StudentsScreen
              role={session.role}
              students={scopedStudents}
              classes={classes}
              facultyList={facultyList}
              interventions={scopedInterventions}
              thresholds={thresholds}
              tierFilter={studentTierFilter}
              onTierFilterChange={setStudentTierFilter}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onBatchAssignPathway={(ids) =>
                assignAiPathwaysForIds(ids, 'batch_rule')
              }
              onAddStudent={handleAddStudent}
            />
          )}

          {session.role !== 'student' && activeScreen === 'interventions' && (
            <InterventionsScreen
              interventions={scopedInterventions}
              students={scopedStudents}
              preselectedStudentId={preselectedPlanStudentId}
              onClearPreselectedStudent={() => setPreselectedPlanStudentId(null)}
              onAdvanceStatus={handleAdvanceInterventionStatus}
              onUpdateRemarks={handleUpdateInterventionRemarks}
              onCreateIntervention={handleCreateIntervention}
              onInspectStudent={(id) => setInspectedStudentId(id)}
            />
          )}

          {session.role !== 'student' && activeScreen === 'reports' && (
            <ReportsScreen
              role={session.role}
              classes={scopedClasses}
              students={scopedStudents}
              facultyList={
                session.role === 'admin'
                  ? facultyList
                  : currentFaculty
                    ? [currentFaculty]
                    : facultyList
              }
              interventions={scopedInterventions}
              thresholds={thresholds}
              weeklySeries={COHORT_WEEKLY_SERIES}
            />
          )}

          {/* STUDENT VIEWS */}
          {session.role === 'student' && loggedInStudent && (
            <StudentDashboard
              student={loggedInStudent}
              interventions={scopedInterventions}
              thresholds={thresholds}
              activeTab={activeScreen}
              onToggleActivity={handleToggleStudentActivity}
              onNavigate={(screen) => setActiveScreen(screen)}
            />
          )}
        </main>
      </div>

      {/* Student Detail & Simulated Risk Drawer (Admin & Faculty) */}
      {session.role !== 'student' && (
        <StudentDetailDrawer
          role={session.role}
          student={inspectedStudent}
          facultyList={facultyList}
          interventions={scopedInterventions}
          thresholds={thresholds}
          onClose={() => setInspectedStudentId(null)}
          onAssignAiPathway={(id) =>
            assignAiPathwaysForIds([id], 'ai_recommended')
          }
          onAddCaseNote={handleAddCaseNote}
          onUpdateAcademicRecord={handleUpdateAcademicRecord}
        />
      )}

      {/* Confirm Reset Demo Dataset Modal */}
      <ConfirmModal
        open={confirmResetOpen}
        title="Restore Initial 50-Student Demo Dataset?"
        description="Resetting the demo dataset will discard custom classes, subject reassignments, academic entries, and improvement plans saved in your browser and restore the default Tamil Nadu engineering cohort."
        confirmLabel="Restore Demo Data"
        tone="danger"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          handleResetDemo();
          setConfirmResetOpen(false);
        }}
      />

      {/* Action Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#0F172A] text-white px-4 py-3 text-xs font-medium shadow-lg border border-[#1E293B]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
