import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Bell, 
  Plus, 
  ArrowUpRight, 
  TrendingUp, 
  IndianRupee, 
  Calendar,
  Mail,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  User,
  CreditCard,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MasterPayrollGrid } from './components/MasterPayrollGrid';
import { SalarySlip } from './components/SalarySlip';
import { Settings } from './components/Settings';
import { Employee, AppSettings } from './types';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

const SETTINGS_KEY = 'payroll_settings';
const USERS_KEY = 'payroll_users';

const DEFAULT_SETTINGS: AppSettings = {
  companyName: '',
  companyAddress: '',
  paymentDay: 1,
  adminProfile: {
    name: '',
    email: '',
    role: 'Administrator'
  },
  emailConfig: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: ''
  },
  complianceConfig: {
    pfDueDay: 15,
    esiDueDay: 15,
    ptaxDueDay: 21
  },
  complianceTasks: {}
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'data' | 'slip' | 'settings' | 'approvals'>('home');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>('');
  const [searchCode, setSearchCode] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, time: string, type: 'info' | 'success' | 'warning'}[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showBlankSlip, setShowBlankSlip] = useState(false);
  const [emailingEmployee, setEmailingEmployee] = useState<Employee | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const hiddenSlipRef = React.useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rememberedUsers, setRememberedUsers] = useState<any[]>([]);
  const [selectedRememberedUser, setSelectedRememberedUser] = useState<any>(null);
  const [rememberedPassword, setRememberedPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const currentStorageKey = `payroll_employees_${selectedMonth.replace(/\s+/g, '_')}`;

  const getStoredUsers = () => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  };

  const getUserSettingsKey = (username: string) => `user_${username}_settings`;
  const getUserEmployeesKey = (username: string) => `user_${username}_all_payroll_data`;
  const REMEMBERED_USERS_KEY = 'payroll_remembered_users';
  const CURRENT_USER_KEY = 'payroll_current_user';

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loginId = formData.get('username') as string;
    const password = formData.get('password') as string;

    const users = getStoredUsers();
    const user = users.find((u: any) => (u.username === loginId || u.email === loginId) && u.password === password);

    if (user) {
      performLogin(user);
    } else {
      setLoginError('Invalid username/email or password');
    }
  };

  const performLogin = (user: any) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setLoginError('');
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    // Add to remembered users
    const remembered = JSON.parse(localStorage.getItem(REMEMBERED_USERS_KEY) || '[]');
    if (!remembered.find((u: any) => u.username === user.username)) {
      const updatedRemembered = [...remembered, { name: user.name, username: user.username, email: user.email }];
      localStorage.setItem(REMEMBERED_USERS_KEY, JSON.stringify(updatedRemembered));
      setRememberedUsers(updatedRemembered);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedRememberedUser(null);
    setRememberedPassword('');
    localStorage.removeItem(CURRENT_USER_KEY);
    setActiveTab('home');
    setEmployees([]);
    setSettings(DEFAULT_SETTINGS);
    // Force a small delay then reload to ensure clean state if needed, 
    // but state updates should be enough.
  };

  const handleRememberedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getStoredUsers();
    const found = users.find((u: any) => u.username === selectedRememberedUser.username && u.password === rememberedPassword);
    if (found) {
      performLogin(found);
      setSelectedRememberedUser(null);
      setRememberedPassword('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const removeRememberedUser = (username: string) => {
    const updated = rememberedUsers.filter(u => u.username !== username);
    localStorage.setItem(REMEMBERED_USERS_KEY, JSON.stringify(updated));
    setRememberedUsers(updated);
    if (selectedRememberedUser?.username === username) {
      setSelectedRememberedUser(null);
    }
  };

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setLoginError('Passwords do not match');
      return;
    }

    const users = getStoredUsers();
    if (users.find((u: any) => u.email === email || u.username === username)) {
      setLoginError('Username or Email already registered');
      return;
    }

    const newUser = { name, username, email, password };
    const updatedUsers = [...users, newUser];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    // If this is the first user, set them as the admin in settings
    if (updatedUsers.length === 1) {
      const newSettings = {
        ...settings,
        adminProfile: {
          ...settings.adminProfile,
          name: name,
          email: email
        },
        emailConfig: {
          ...settings.emailConfig,
          fromEmail: email
        }
      };
      setSettings(newSettings);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    }
    
    setResetSuccess('Account created successfully! Please login.');
    setTimeout(() => {
      setShowSignUp(false);
      setResetSuccess('');
      setLoginError('');
    }, 2000);
  };

  const handleForgot = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (forgotEmail === settings.adminProfile.email) {
      setIsResetting(true);
      setLoginError('');
    } else {
      setLoginError('Email not found in system');
    }
  };

  const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPass = formData.get('newPassword');
    const confirmPass = formData.get('confirmPassword');

    if (newPass !== confirmPass) {
      setLoginError('Passwords do not match');
      return;
    }

    // In a real app, we'd update the stored password. 
    // For this local version, we'll just simulate success and tell them to use the new pass.
    // Actually, I'll just tell them the default password for now as a "hint" or let them set a temporary one.
    setResetSuccess('Password reset successfully! Please use "admin" and your new password.');
    setTimeout(() => {
      setShowForgot(false);
      setIsResetting(false);
      setResetSuccess('');
    }, 3000);
  };

  useEffect(() => {
    // Load remembered users
    const remembered = localStorage.getItem(REMEMBERED_USERS_KEY);
    if (remembered) setRememberedUsers(JSON.parse(remembered));

    // Check for existing session
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }

    // Force reset for the new requirement
    const hasReset = localStorage.getItem('payroll_final_reset_v4');
    if (!hasReset) {
      localStorage.clear(); // Clear everything
      localStorage.setItem('payroll_final_reset_v4', 'true');
      setEmployees([]);
      setSettings(DEFAULT_SETTINGS);
      window.location.reload(); // Reload to apply clean state
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    const employeesKey = getUserEmployeesKey(currentUser.username);
    const settingsKey = getUserSettingsKey(currentUser.username);

    const savedEmployees = localStorage.getItem(employeesKey);
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      setEmployees([]);
    }

    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings) as AppSettings;
      
      if (!parsedSettings.complianceTasks) {
        parsedSettings.complianceTasks = {};
      }

      if (!parsedSettings.complianceConfig) {
        parsedSettings.complianceConfig = {
          pfDueDay: 15,
          esiDueDay: 15,
          ptaxDueDay: 21
        };
      }
      
      if (!parsedSettings.complianceTasks[selectedMonth]) {
        parsedSettings.complianceTasks[selectedMonth] = [
          { id: 'pf', name: 'PF Compliance', dueDay: parsedSettings.complianceConfig.pfDueDay, isDone: false },
          { id: 'esi', name: 'ESI Compliance', dueDay: parsedSettings.complianceConfig.esiDueDay, isDone: false },
          { id: 'ptax', name: 'PTAX Compliance', dueDay: parsedSettings.complianceConfig.ptaxDueDay, isDone: false }
        ];
        localStorage.setItem(settingsKey, JSON.stringify(parsedSettings));
      }
      
      setSettings(parsedSettings);
    } else {
      // Default settings for new user
      const initialSettings = {
        ...DEFAULT_SETTINGS,
        adminProfile: {
          ...DEFAULT_SETTINGS.adminProfile,
          name: currentUser.name,
          email: currentUser.email
        },
        emailConfig: {
          ...DEFAULT_SETTINGS.emailConfig,
          fromEmail: currentUser.email
        }
      };
      setSettings(initialSettings);
      localStorage.setItem(settingsKey, JSON.stringify(initialSettings));
    }
  }, [selectedMonth, isLoggedIn, currentUser]);

  const updateEmployees = (newEmployeesOrFn: Employee[] | ((prev: Employee[]) => Employee[])) => {
    if (!currentUser) return;
    setEmployees(prev => {
      const next = typeof newEmployeesOrFn === 'function' ? newEmployeesOrFn(prev) : newEmployeesOrFn;
      localStorage.setItem(getUserEmployeesKey(currentUser.username), JSON.stringify(next));
      return next;
    });
  };

  const updateSettings = (newSettings: AppSettings) => {
    if (!currentUser) return;
    // Sync due days for the current month if they were changed in settings
    if (newSettings.complianceTasks[selectedMonth]) {
      newSettings.complianceTasks[selectedMonth] = newSettings.complianceTasks[selectedMonth].map(task => {
        if (task.id === 'pf') return { ...task, dueDay: newSettings.complianceConfig.pfDueDay };
        if (task.id === 'esi') return { ...task, dueDay: newSettings.complianceConfig.esiDueDay };
        if (task.id === 'ptax') return { ...task, dueDay: newSettings.complianceConfig.ptaxDueDay };
        return task;
      });
    }
    setSettings(newSettings);
    localStorage.setItem(getUserSettingsKey(currentUser.username), JSON.stringify(newSettings));
  };

  const toggleComplianceTask = (taskId: string) => {
    const updatedTasks = (settings.complianceTasks[selectedMonth] || []).map(task => 
      task.id === taskId ? { ...task, isDone: !task.isDone } : task
    );
    
    const newSettings = {
      ...settings,
      complianceTasks: {
        ...settings.complianceTasks,
        [selectedMonth]: updatedTasks
      }
    };
    updateSettings(newSettings);
  };

  const clearAllData = () => {
    // Simplified: remove confirm for iframe compatibility
    setEmployees([]);
    localStorage.setItem(currentStorageKey, JSON.stringify([]));
    showToast('All data for ' + selectedMonth + ' has been cleared.', 'success');
  };

  const clearAllMonthsData = () => {
    // Simplified: remove confirm for iframe compatibility
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('payroll_employees_')) {
        localStorage.removeItem(key);
      }
    });
    setEmployees([]);
    showToast('All data for all months has been cleared.', 'success');
  };

  const copyFromPreviousMonth = () => {
    const [m, y] = selectedMonth.split(' ');
    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m);
    const selDate = new Date(parseInt(y), monthIndex, 1);
    
    const targetDate = new Date(selDate);
    targetDate.setMonth(targetDate.getMonth() - 1);
    const prevMonth = targetDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    
    const prevEmployees = employees.filter(e => e.month === prevMonth);
    
    if (prevEmployees.length > 0) {
      const newEmployees = prevEmployees.map(e => ({
        ...e,
        id: Math.random().toString(36).substr(2, 9),
        month: selectedMonth,
        timestamp: new Date().toISOString(),
        attendance: { present: 0, od: 0, wo: 0, leave: 0, holiday: 0, payable: 0, lwp: 0 },
        paymentStatus: 'Pending' as const,
        approvalStatus: 'Approved' as const,
        emailSent: false
      }));
      updateEmployees(prev => [...prev, ...newEmployees]);
      showToast(`Successfully copied ${newEmployees.length} employees from ${prevMonth}.`, 'success');
    } else {
      showToast(`No data found for ${prevMonth}.`, 'error');
    }
  };

  const selectedEmployee = employees.find(e => e.code === selectedEmployeeCode && e.approvalStatus === 'Approved');

  const BLANK_EMPLOYEE: Employee = {
    id: 'blank',
    code: '________',
    name: '__________________________',
    companyName: '__________________________',
    department: '________________',
    designation: '________________',
    joiningDate: '',
    grade: '____',
    uan: '________________',
    email: '',
    attendance: { present: 0, od: 0, wo: 0, leave: 0, holiday: 0, payable: 0, lwp: 0 },
    earnings: { basic: 0, hra: 0, washing: 0, other: 0, personal: 0, transport: 0, remote: 0, contingency: 0, medical: 0, lta: 0, bonus: 0, special: 0 },
    deductions: { pTax: 0, pf: 0, vpf: 0, mobile: 0, loan: 0, lpg: 0, fooding: 0, other: 0, tds: 0 },
    paymentStatus: 'Pending',
    approvalStatus: 'Approved',
    month: '',
    timestamp: '',
    emailSent: false
  };

  const handleSendEmail = async (employee: Employee) => {
    // Check if SMTP settings are configured
    const { smtpUser, smtpPass } = settings.emailConfig;
    if (!smtpUser || !smtpPass) {
      showToast('Please configure SMTP settings (Email & App Password) in the Settings tab first.', 'error');
      setActiveTab('settings');
      return;
    }

    try {
      showToast(`Generating PDF for ${employee.name}...`, 'info');
      // Set the employee to be emailed to trigger hidden rendering
      setEmailingEmployee(employee);
      
      // Wait for the component to render and layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!hiddenSlipRef.current) {
        throw new Error('Failed to render salary slip for email. Please try again.');
      }

      // Generate PDF with high quality settings using html2canvas
      const element = hiddenSlipRef.current.querySelector('#salary-slip-content') as HTMLElement || hiddenSlipRef.current;
      
      console.log('Capturing salary slip for email...');
      const canvas = await html2canvas(element, {
        scale: 2, // Slightly lower scale for faster processing but still good quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Ensure consistent layout
      });
      
      const imgData = canvas.toDataURL('image/png');
      console.log('Image captured, size:', Math.round(imgData.length / 1024), 'KB');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add image to fill the entire A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const pdfBase64 = pdf.output('datauristring');
      
      showToast(`Sending email to ${employee.email}...`, 'info');

      const response = await fetch('/api/send-salary-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: employee.email,
          employeeName: employee.name,
          month: selectedMonth,
          pdfBase64: pdfBase64,
          smtpConfig: settings.emailConfig
        })
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`Email sent successfully to ${employee.email}`, 'success');
        
        // Update employee emailSent status
        updateEmployees(prev => prev.map(e => 
          e.id === employee.id ? { ...e, emailSent: true } : e
        ));
      } else {
        throw new Error(result.error || result.details || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      showToast(`Error: ${error.message}`, 'error');
      throw error; // Re-throw for handleSendAllEmails to catch
    } finally {
      setEmailingEmployee(null);
    }
  };

  const handleSendAllEmails = async (employeesToSend: Employee[]) => {
    // Check if SMTP settings are configured
    const { smtpUser, smtpPass } = settings.emailConfig;
    if (!smtpUser || !smtpPass) {
      showToast('Please configure SMTP settings (Email & App Password) in the Settings tab first.', 'error');
      setActiveTab('settings');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const employee of employeesToSend) {
      if (!employee.email) {
        console.warn(`Skipping ${employee.name}: No email address.`);
        failCount++;
        continue;
      }
      try {
        await handleSendEmail(employee);
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${employee.name}:`, error);
        failCount++;
      }
    }

    showToast(`Email sending complete. Success: ${successCount}, Failed: ${failCount}`, successCount > 0 ? 'success' : 'error');
  };

  const handleAddEmployee = (newEmployee: Omit<Employee, 'id' | 'approvalStatus' | 'month' | 'timestamp'>) => {
    if (editingEmployee) {
      const updatedEmployees = employees.map(e => 
        e.id === editingEmployee.id ? { ...newEmployee, id: editingEmployee.id, approvalStatus: editingEmployee.approvalStatus, emailSent: editingEmployee.emailSent, month: editingEmployee.month, timestamp: editingEmployee.timestamp } : e
      );
      updateEmployees(updatedEmployees);
      setEditingEmployee(null);
    } else {
      const employee: Employee = {
        ...newEmployee,
        id: Math.random().toString(36).substr(2, 9),
        approvalStatus: 'PendingAddition',
        month: selectedMonth,
        timestamp: new Date().toISOString()
      };
      updateEmployees(prev => [...prev, employee]);
    }
    setIsAddModalOpen(false);
  };

  const handleApprove = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      alert('Employee not found!');
      return;
    }

    const updatedEmployees = employees.map(e => {
      if (e.id === employeeId) {
        if (e.approvalStatus === 'PendingAddition') {
          return { ...e, approvalStatus: 'Approved' as const };
        }
        if (e.approvalStatus === 'PendingDeletion') {
          return null;
        }
      }
      return e;
    }).filter(e => e !== null) as Employee[];

    updateEmployees(updatedEmployees);
    
    setNotifications(prev => [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        text: `${employee.name}'s ${employee.approvalStatus === 'PendingAddition' ? 'addition' : 'deletion'} approved.`, 
        time: 'Just now', 
        type: 'success' 
      },
      ...prev
    ]);
  };

  const handleApproveAll = () => {
    const pendingRequests = employees.filter(e => e.approvalStatus !== 'Approved');
    if (pendingRequests.length === 0) return;

    const updatedEmployees = employees.map(e => {
      if (e.approvalStatus === 'PendingAddition') {
        return { ...e, approvalStatus: 'Approved' as const };
      }
      if (e.approvalStatus === 'PendingDeletion') {
        return null;
      }
      return e;
    }).filter(e => e !== null) as Employee[];

    updateEmployees(updatedEmployees);
    
    setNotifications(prev => [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        text: `All ${pendingRequests.length} pending requests approved successfully.`, 
        time: 'Just now', 
        type: 'success' 
      },
      ...prev
    ]);
  };

  const handleUpdateStatus = (employeeId: string, status: 'Paid' | 'Pending') => {
    updateEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, paymentStatus: status } : e));
  };

  const handleReject = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      alert('Employee not found!');
      return;
    }

    const updatedEmployees = employees.map(e => {
      if (e.id === employeeId) {
        if (e.approvalStatus === 'PendingAddition') {
          return null; // Rejecting an addition removes it
        }
        if (e.approvalStatus === 'PendingDeletion') {
          return { ...e, approvalStatus: 'Approved' as const }; // Rejecting a deletion keeps it approved
        }
      }
      return e;
    }).filter(e => e !== null) as Employee[];
    updateEmployees(updatedEmployees);

    setNotifications(prev => [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        text: `${employee.name}'s ${employee.approvalStatus === 'PendingAddition' ? 'addition' : 'deletion'} rejected.`, 
        time: 'Just now', 
        type: 'warning' 
      },
      ...prev
    ]);
  };

  const calculateNextPayCycle = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let payDate = new Date(currentYear, currentMonth, settings.paymentDay);
    
    if (today > payDate) {
      payDate = new Date(currentYear, currentMonth + 1, settings.paymentDay);
    }
    
    const diffTime = Math.abs(payDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      date: payDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      daysRemaining: diffDays
    };
  };

  const nextPay = calculateNextPayCycle();

  const pendingComplianceCount = (settings.complianceTasks[selectedMonth] || []).filter(t => !t.isDone).length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="p-8 bg-india-navy text-white text-center">
            <div className="w-20 h-20 bg-white-10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white-20">
              <Shield size={40} className="text-india-saffron" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Payroll Portal</h2>
            <p className="text-xs text-white-60 font-bold uppercase tracking-widest mt-1">
              {showForgot ? 'Password Recovery' : showSignUp ? 'Create New Account' : 'Secure Administrator Login'}
            </p>
          </div>
          
          <div className="p-8 space-y-6">
            {loginError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 size={16} />
                {resetSuccess}
              </div>
            )}
            
            {!showForgot && !showSignUp ? (
              <div className="space-y-6">
                {rememberedUsers.length > 0 && !selectedRememberedUser && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Accounts</label>
                    <div className="grid grid-cols-1 gap-2">
                      {rememberedUsers.map((user) => (
                        <div key={user.username} className="group relative flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-india-navy-30 transition-all">
                          <button 
                            onClick={() => setSelectedRememberedUser(user)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <div className="w-10 h-10 bg-india-navy text-white rounded-lg flex items-center justify-center font-bold text-sm">
                              {user.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{user.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user.email}</p>
                            </div>
                          </button>
                          <button 
                            onClick={() => removeRememberedUser(user.username)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            title="Remove account"
                          >
                            <Plus size={16} className="rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300 bg-white px-2">Or login with another</div>
                    </div>
                  </div>
                )}

                {selectedRememberedUser ? (
                  <form onSubmit={handleRememberedLogin} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-india-navy text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-xl">
                        {selectedRememberedUser.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-black text-slate-800">{selectedRememberedUser.name}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedRememberedUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter Password</label>
                      <div className="relative">
                        <input 
                          type="password"
                          value={rememberedPassword}
                          onChange={(e) => setRememberedPassword(e.target.value)}
                          required 
                          autoFocus
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                          placeholder="••••••••" 
                        />
                        <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedRememberedUser(null);
                          setRememberedPassword('');
                        }}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-2 py-4 bg-india-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-india-navy-20 active:scale-95"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username or Email</label>
                      <div className="relative">
                        <input 
                          name="username" 
                          required 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                          placeholder="admin or your@email.com" 
                        />
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                        <button 
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-[9px] font-black text-india-navy hover:text-india-saffron uppercase tracking-widest transition-colors"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          name="password" 
                          type="password" 
                          required 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                          placeholder="••••••••" 
                        />
                        <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 bg-india-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-india-navy-20 active:scale-95"
                    >
                      Sign In to Dashboard
                    </button>

                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => setShowSignUp(true)}
                        className="text-[10px] font-black text-slate-400 hover:text-india-navy uppercase tracking-widest transition-colors"
                      >
                        Don't have an account? <span className="text-india-navy underline underline-offset-4">Create One</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : showSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      name="name" 
                      required 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                    <input 
                      name="username" 
                      required 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                      placeholder="johndoe123" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    name="email" 
                    type="email"
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <input 
                    name="password" 
                    type="password"
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                    placeholder="••••••••" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                  <input 
                    name="confirmPassword" 
                    type="password"
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                    placeholder="••••••••" 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 py-3 bg-india-green text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-700 transition-all shadow-xl shadow-green-900-20 active:scale-95"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : !isResetting ? (
              <form onSubmit={handleForgot} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Email Address</label>
                  <div className="relative">
                    <input 
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                      placeholder="your@email.com" 
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                    Enter the email address associated with your admin profile.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 py-4 bg-india-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-india-navy-20 active:scale-95"
                  >
                    Verify Email
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                  <input 
                    name="newPassword" 
                    type="password"
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                    placeholder="••••••••" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                  <input 
                    name="confirmPassword" 
                    type="password"
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold transition-all" 
                    placeholder="••••••••" 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-india-saffron text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-india-saffron-20 active:scale-95"
                >
                  Update Password
                </button>
              </form>
            )}
            
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Authorized Personnel Only • IP Logged<br/>
                {getStoredUsers().length === 0 ? 'First user will be the Administrator' : 'Please sign in with your credentials'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#fdfcf0] flex font-sans text-gray-900 bg-fixed bg-cover bg-center flex-col"
      style={settings.backgroundUrl ? { backgroundImage: `url(${settings.backgroundUrl})` } : {}}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm uppercase tracking-widest border ${
              toast.type === 'success' ? 'bg-green-500 text-white border-green-400' : 
              toast.type === 'error' ? 'bg-red-500 text-white border-red-400' : 
              'bg-india-navy text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : 
             toast.type === 'error' ? <AlertCircle size={18} /> : 
             <Bell size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Flag Banner */}
      <div className="h-1.5 w-full flex no-print">
        <div className="flex-1 bg-india-saffron"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-india-green"></div>
      </div>

      <div className="flex flex-1 relative">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "w-64 bg-slate-900 text-white flex flex-col fixed h-full z-40 no-print transition-transform duration-300 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-india-navy rounded-xl flex items-center justify-center font-bold text-xl border border-white-20 shadow-lg">
                {settings.companyName?.[0] || 'P'}
              </div>
              <div className="leading-tight">
                <h2 className="font-bold text-sm tracking-tight font-display">
                  {settings.companyName || 'PAYROLL PORTAL'}
                </h2>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Payroll India</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
            <NavItem 
              active={activeTab === 'home'} 
              onClick={() => {
                setActiveTab('home');
                setIsMobileMenuOpen(false);
              }} 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
            />
            <NavItem 
              active={activeTab === 'data'} 
              onClick={() => {
                setActiveTab('data');
                setIsMobileMenuOpen(false);
              }} 
              icon={<Users size={20} />} 
              label="Employee Data" 
            />
            <NavItem 
              active={activeTab === 'slip'} 
              onClick={() => {
                setActiveTab('slip');
                setIsMobileMenuOpen(false);
              }} 
              icon={<FileText size={20} />} 
              label="Salary Slips" 
            />
            <NavItem 
              active={activeTab === 'approvals'} 
              onClick={() => {
                setActiveTab('approvals');
                setIsMobileMenuOpen(false);
              }} 
              icon={<CheckCircle2 size={20} />} 
              label="Approvals" 
              badge={employees.filter(e => e.approvalStatus !== 'Approved').length}
            />
            <NavItem 
              active={activeTab === 'settings'} 
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }} 
              icon={<SettingsIcon size={20} />} 
              label="Settings" 
            />
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 print:ml-0 print:p-0 w-full overflow-x-hidden">
          {/* Header */}
          <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8 no-print">
            <div className="flex items-center justify-between lg:block">
              <div className="lg:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"
                >
                  <Menu size={24} />
                </button>
              </div>
              <div className="text-right lg:text-left">
                <div className="flex items-center justify-end lg:justify-start gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-india-green-10 text-india-green text-[10px] font-bold rounded uppercase tracking-wider border border-india-green-20">
                    Live Portal
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="text-xl lg:text-3xl font-bold text-slate-800 font-display italic">
                  {activeTab === 'home' && 'Dashboard Overview'}
                  {activeTab === 'data' && 'Master Payroll Data'}
                  {activeTab === 'slip' && 'Salary Slip Viewer'}
                  {activeTab === 'settings' && 'System Settings'}
                </h1>
                <p className="text-slate-500 text-[10px] lg:text-sm font-medium">Namaste, {currentUser?.name || 'Admin'}!</p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                <Calendar size={16} className="text-india-navy" />
                <select 
                  className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                  }).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-india-navy outline-none w-64 transition-all shadow-sm"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    if (activeTab !== 'data') setActiveTab('data');
                  }}
                />
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all relative shadow-sm"
                >
                  <Bell size={20} />
                  {(notifications.length > 0 || pendingComplianceCount > 0) && (
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white ${pendingComplianceCount > 0 ? 'bg-red-500' : 'bg-india-saffron'}`}></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Notifications</h4>
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-black text-india-navy uppercase tracking-tighter hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {pendingComplianceCount > 0 && (
                          <div className="p-4 bg-red-50 border-b border-red-100">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <AlertCircle size={10} />
                              Pending Compliance
                            </p>
                            <div className="space-y-2">
                              {(settings.complianceTasks[selectedMonth] || []).filter(t => !t.isDone).map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">{t.name}</span>
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                                    {(() => {
                                      const now = new Date();
                                      const currentMonthStr = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                                      if (selectedMonth === currentMonthStr) {
                                        const diff = t.dueDay - now.getDate();
                                        if (diff > 0) return `${diff} days left`;
                                        if (diff === 0) return `Due today!`;
                                        return `Overdue!`;
                                      }
                                      return `Due: ${t.dueDay}${t.dueDay === 1 ? 'st' : t.dueDay === 2 ? 'nd' : t.dueDay === 3 ? 'rd' : 'th'}`;
                                    })()}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button 
                              onClick={() => {
                                setActiveTab('home');
                                setIsNotificationsOpen(false);
                              }}
                              className="w-full mt-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
                            >
                              Go to Dashboard
                            </button>
                          </div>
                        )}
                        {notifications.length === 0 && pendingComplianceCount === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <p className="text-xs font-bold uppercase tracking-widest">No new notifications</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                n.type === 'success' ? 'bg-india-green' : 
                                n.type === 'warning' ? 'bg-india-saffron' : 'bg-india-navy'
                              }`}></div>
                              <div>
                                <p className="text-xs text-slate-700 leading-relaxed">{n.text}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{n.time}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:bg-slate-50 transition-colors rounded-xl p-1 group"
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-india-navy transition-colors">{settings.adminProfile.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{settings.adminProfile.role}</p>
                </div>
                <div className="w-10 h-10 bg-india-navy-10 rounded-xl flex items-center justify-center text-india-navy font-bold shadow-inner overflow-hidden group-hover:ring-2 group-hover:ring-india-navy-20 transition-all">
                  {settings.adminProfile.avatarUrl ? (
                    <img src={settings.adminProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    settings.adminProfile.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && (
                <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard 
                      title="Total Employees" 
                      value={employees.filter(e => e.approvalStatus === 'Approved').length.toString()} 
                      change={employees.length > 0 ? "+0 this month" : "No active employees"} 
                      icon={<Users className="text-india-navy" />} 
                      color="navy"
                    />
                    <StatCard 
                      title="Monthly Payroll" 
                      value={`₹${employees.filter(e => e.approvalStatus === 'Approved').reduce((acc, e) => acc + (Object.values(e.earnings) as number[]).reduce((a, b) => a + b, 0), 0).toLocaleString('en-IN')}`} 
                      change={employees.length > 0 ? "₹0 from last month" : "No payroll data"} 
                      icon={<IndianRupee className="text-india-green" />} 
                      color="green"
                    />
                    <StatCard 
                      title="Pending Approvals" 
                      value={employees.filter(e => e.approvalStatus !== 'Approved').length.toString()} 
                      change={employees.filter(e => e.approvalStatus !== 'Approved').length > 0 ? "Requires action" : "All caught up"} 
                      icon={<Clock className="text-india-saffron" />} 
                      color="saffron"
                    />
                    <StatCard 
                      title="Next Pay Cycle" 
                      value={nextPay.date} 
                      change={`${nextPay.daysRemaining} days remaining`} 
                      icon={<Calendar className="text-slate-400" />} 
                      color="slate"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp size={18} className="text-india-green" />
                          Recent Payroll Activity
                        </h3>
                        <button 
                          onClick={() => setActiveTab('data')}
                          className="text-xs font-bold text-india-navy hover:underline uppercase tracking-widest"
                        >
                          View All
                        </button>
                      </div>
                      <div className="space-y-4">
                        {employees.filter(e => e.approvalStatus === 'Approved').slice(0, 4).map(e => (
                          <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50-50 rounded-xl border border-slate-100 hover:border-india-navy-20 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-slate-400 shadow-sm border border-slate-100 group-hover:text-india-navy transition-colors">
                                {e.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{e.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{e.department}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="font-bold text-slate-800">₹{(Object.values(e.earnings) as number[]).reduce((a, b) => a + b, 0).toLocaleString('en-IN')}</p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${e.paymentStatus === 'Paid' ? 'bg-india-green' : 'bg-india-saffron animate-pulse'}`}></span>
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${e.paymentStatus === 'Paid' ? 'text-india-green' : 'text-india-saffron'}`}>
                                    {e.paymentStatus}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUpdateStatus(e.id, e.paymentStatus === 'Paid' ? 'Pending' : 'Paid')}
                                className={`p-2 rounded-lg transition-all ${e.paymentStatus === 'Paid' ? 'text-india-green bg-green-50' : 'text-slate-300 hover:text-india-saffron hover:bg-orange-50'}`}
                                title={e.paymentStatus === 'Paid' ? "Mark as Pending" : "Mark as Paid"}
                              >
                                <CreditCard size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <div className="bg-india-navy text-white p-5 lg:p-6 rounded-2xl shadow-lg shadow-india-navy-20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-white-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-sm relative z-10">
                          <Plus size={18} />
                          Quick Actions
                        </h3>
                        <div className="space-y-3 relative z-10">
                          <QuickActionBtn 
                            label="Add New Employee" 
                            icon={<Plus size={16} />} 
                            color="blue" 
                            onClick={() => {
                              setEditingEmployee(null);
                              setIsAddModalOpen(true);
                            }}
                          />
                          <QuickActionBtn 
                            label="Blank Salary Slip" 
                            icon={<FileText size={16} />} 
                            color="emerald" 
                            onClick={() => {
                              setShowBlankSlip(true);
                              setSelectedEmployeeCode('');
                              setActiveTab('slip');
                            }}
                          />
                          <QuickActionBtn 
                            label="Generate Slips" 
                            icon={<FileText size={16} />} 
                            color="emerald" 
                            onClick={() => setActiveTab('slip')}
                          />
                          <QuickActionBtn 
                            label="Send Reminders" 
                            icon={<Mail size={16} />} 
                            color="violet" 
                            onClick={async () => {
                              const approvedEmployees = employees.filter(e => e.approvalStatus === 'Approved');
                              if (approvedEmployees.length === 0) {
                                alert('No approved employees found to send reminders.');
                                return;
                              }
                              if (confirm(`Send salary slip reminders to ${approvedEmployees.length} approved employees?`)) {
                                handleSendAllEmails(approvedEmployees);
                              }
                            }}
                          />
                        </div>
                      </div>
                      {/* Compliance Status */}
                      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-india-saffron-10 text-india-saffron rounded-lg">
                              <Shield size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Compliance</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-india-navy">
                              {Math.round(((settings.complianceTasks[selectedMonth] || []).filter(t => t.isDone).length / (settings.complianceTasks[selectedMonth] || []).length) * 100 || 0)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((settings.complianceTasks[selectedMonth] || []).filter(t => t.isDone).length / (settings.complianceTasks[selectedMonth] || []).length) * 100 || 0}%` }}
                            className="h-full bg-india-navy rounded-full"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          {(settings.complianceTasks[selectedMonth] || []).slice(0, 3).map(task => (
                            <div 
                              key={task.id} 
                              className="flex items-center justify-between group cursor-pointer"
                              onClick={() => toggleComplianceTask(task.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                  task.isDone ? 'bg-india-green border-india-green text-white' : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  {task.isDone && <CheckCircle2 size={12} />}
                                </div>
                                <div>
                                  <p className={`text-[11px] font-bold ${task.isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Due: {task.dueDay}th</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => setActiveTab('settings')}
                            className="w-full mt-2 py-2 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-all border border-slate-100"
                          >
                            Manage All Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <MasterPayrollGrid 
                  employees={employees.filter(e => e.approvalStatus === 'Approved')} 
                  settings={settings}
                  initialSearch={globalSearch}
                  onImport={(newEmps) => {
                    updateEmployees([...employees, ...newEmps]);
                  }}
                  onDeleteRequest={(empId) => {
                    const updatedEmployees = employees.map(e => 
                      e.id === empId ? { ...e, approvalStatus: 'PendingDeletion' as const } : e
                    );
                    updateEmployees(updatedEmployees);
                  }}
                  selectedMonth={selectedMonth}
                  onSendEmail={handleSendEmail}
                  onSendAllEmails={handleSendAllEmails}
                  onUpdateStatus={handleUpdateStatus}
                  onPreviewSlip={(emp) => setPreviewEmployee(emp)}
                  onEditEmployee={(emp) => {
                    setEditingEmployee(emp);
                    setIsAddModalOpen(true);
                  }}
                  onViewSlip={(code) => {
                    setSelectedEmployeeCode(code);
                    setShowBlankSlip(false);
                    setActiveTab('slip');
                  }}
                  onCopyFromPrevious={copyFromPreviousMonth}
                  showToast={showToast}
                />
              )}

              {activeTab === 'approvals' && (
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <CheckCircle2 className="text-india-navy" />
                        Pending Approvals
                      </h3>
                      {employees.filter(e => e.approvalStatus !== 'Approved').length > 0 && (
                        <button 
                          onClick={handleApproveAll}
                          className="px-4 py-2 bg-india-green text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-india-green-20 flex items-center gap-2"
                        >
                          <CheckCircle2 size={14} />
                          Approve All
                        </button>
                      )}
                    </div>
                    
                    {employees.filter(e => e.approvalStatus !== 'Approved').length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">No pending approvals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {employees.filter(e => e.approvalStatus !== 'Approved').map(e => (
                          <div key={e.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-india-navy-30 transition-all">
                            <div className="flex items-center gap-6">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${e.approvalStatus === 'PendingAddition' ? 'bg-india-green' : 'bg-red-500'}`}>
                                {e.approvalStatus === 'PendingAddition' ? '+' : '-'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-800 text-lg">{e.name}</h4>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${e.approvalStatus === 'PendingAddition' ? 'bg-india-green-10 text-india-green border-india-green-20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    {e.approvalStatus === 'PendingAddition' ? 'New Addition' : 'Request Deletion'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{e.code} • {e.department} • {e.designation}</p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleReject(e.id)}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handleApprove(e.id)}
                                className="px-6 py-2.5 bg-india-navy text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-india-navy-20"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'slip' && (
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl flex gap-4 items-center no-print">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search by Employee Code (e.g. EMP001)..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-india-navy outline-none transition-all"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedEmployeeCode('');
                        setShowBlankSlip(true);
                      }}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest text-xs flex items-center gap-2"
                    >
                      <FileText size={16} />
                      Blank Slip
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedEmployeeCode(searchCode);
                        setShowBlankSlip(false);
                      }}
                      className="px-8 py-3 bg-india-navy text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-india-navy-20 uppercase tracking-widest text-xs"
                    >
                      Search Slip
                    </button>
                    {(selectedEmployeeCode || showBlankSlip) && (
                      <button 
                        onClick={() => {
                          setSelectedEmployeeCode('');
                          setSearchCode('');
                          setShowBlankSlip(false);
                        }}
                        className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                        title="Clear Selection"
                      >
                        <LogOut size={20} className="rotate-180" />
                      </button>
                    )}
                  </div>

                  {showBlankSlip ? (
                    <SalarySlip employee={BLANK_EMPLOYEE} settings={settings} month={selectedMonth} />
                  ) : selectedEmployee ? (
                    <SalarySlip employee={selectedEmployee} settings={settings} month={selectedMonth} />
                  ) : (
                    <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-slate-300" />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">No Slip Selected</h3>
                      <p className="text-slate-400 text-sm">Enter an employee code above to view their detailed pay slip</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'settings' && (
                <Settings 
                  settings={settings} 
                  onSave={(newSettings) => {
                    updateSettings(newSettings);
                    alert('Settings saved successfully!');
                  }} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Hidden container for PDF generation */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        {emailingEmployee && (
          <div ref={hiddenSlipRef}>
            <SalarySlip 
              employee={emailingEmployee} 
              settings={settings} 
              month={selectedMonth} 
              hideControls={true}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900-60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden border border-slate-200"
            >
              <div className="p-6 bg-india-navy text-white flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button onClick={() => {
                  setIsLoggedIn(false);
                  setIsAddModalOpen(false);
                  setEditingEmployee(null);
                }} className="hover:bg-white-10 p-2 rounded-lg transition-colors">
                  <LogOut size={20} className="rotate-180" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                
                const attendance = {
                  present: Number(data.present),
                  od: Number(data.od),
                  wo: Number(data.wo),
                  leave: Number(data.leave),
                  holiday: Number(data.holiday),
                  payable: Number(data.payable),
                  lwp: Number(data.lwp)
                };

                const earnings = {
                  basic: Number(data.basic),
                  hra: Number(data.hra),
                  washing: Number(data.washing),
                  other: Number(data.other_earning),
                  personal: Number(data.personal),
                  transport: Number(data.transport),
                  remote: Number(data.remote),
                  contingency: Number(data.contingency),
                  medical: Number(data.medical),
                  lta: Number(data.lta),
                  bonus: Number(data.bonus),
                  special: Number(data.special)
                };

                const deductions = {
                  pTax: Number(data.pTax),
                  pf: Number(data.pf),
                  vpf: Number(data.vpf),
                  mobile: Number(data.mobile),
                  loan: Number(data.loan),
                  lpg: Number(data.lpg),
                  fooding: Number(data.fooding),
                  other: Number(data.other_deduction),
                  tds: Number(data.tds)
                };

                handleAddEmployee({
                  code: data.code as string,
                  name: data.name as string,
                  companyName: data.companyName as string,
                  department: data.department as string,
                  designation: data.designation as string,
                  joiningDate: data.joiningDate as string,
                  grade: data.grade as string,
                  uan: data.uan as string,
                  email: data.email as string,
                  paymentStatus: editingEmployee?.paymentStatus || 'Pending',
                  attendance,
                  earnings,
                  deductions
                });
              }} className="p-8 space-y-10 max-h-[80vh] overflow-y-auto">
                
                {/* Basic Details */}
                <section>
                  <h4 className="text-xs font-black text-india-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-india-navy rounded-full"></div>
                    Basic Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Code</label>
                      <input name="code" defaultValue={editingEmployee?.code} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="EMP001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input name="name" defaultValue={editingEmployee?.name} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name (For Pay Slip)</label>
                      <input name="companyName" defaultValue={editingEmployee?.companyName} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="Leave blank to use default" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input name="email" type="email" defaultValue={editingEmployee?.email} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                      <input name="department" defaultValue={editingEmployee?.department} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="IT" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                      <input name="designation" defaultValue={editingEmployee?.designation} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="Developer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining Date</label>
                      <input name="joiningDate" type="date" defaultValue={editingEmployee?.joiningDate} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</label>
                      <input name="grade" defaultValue={editingEmployee?.grade} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="S1" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UAN Number</label>
                      <input name="uan" defaultValue={editingEmployee?.uan} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy font-bold" placeholder="100XXXXXXXXX" />
                    </div>
                  </div>
                </section>

                {/* Attendance Summary */}
                <section>
                  <h4 className="text-xs font-black text-india-saffron uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-india-saffron rounded-full"></div>
                    Attendance Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                      { name: 'present', label: 'Days Present' },
                      { name: 'od', label: 'OD' },
                      { name: 'wo', label: 'WO' },
                      { name: 'leave', label: 'Leave Days' },
                      { name: 'holiday', label: 'Holiday' },
                      { name: 'payable', label: 'Days payable' },
                      { name: 'lwp', label: 'LWP' }
                    ].map(field => (
                      <div key={field.name} className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{field.label}</label>
                        <input 
                          type="number" 
                          name={field.name} 
                          defaultValue={editingEmployee?.attendance[field.name as keyof typeof editingEmployee.attendance] || 0} 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-india-saffron font-bold text-sm" 
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Earnings */}
                <section>
                  <h4 className="text-xs font-black text-india-green uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-india-green rounded-full"></div>
                    Earnings
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'basic', label: 'Basic Salary' },
                      { name: 'hra', label: 'House Rent Allowance' },
                      { name: 'washing', label: 'Washing Allowance' },
                      { name: 'other_earning', label: 'Other Allowance', key: 'other' },
                      { name: 'personal', label: 'Personal Allowance' },
                      { name: 'transport', label: 'Transportation Allowance' },
                      { name: 'remote', label: 'Remote Area Allowance' },
                      { name: 'contingency', label: 'Contingency Allowance' },
                      { name: 'medical', label: 'Medical (Monthly)' },
                      { name: 'lta', label: 'LTA (Monthly)' },
                      { name: 'bonus', label: 'Bonus (Monthly)' },
                      { name: 'special', label: 'Special Allowance (Fooding)' }
                    ].map(field => (
                      <div key={field.name} className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{field.label}</label>
                        <input 
                          type="number" 
                          name={field.name} 
                          defaultValue={editingEmployee?.earnings[(field.key || field.name) as keyof typeof editingEmployee.earnings] || 0} 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-india-green font-bold text-sm" 
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Deductions */}
                <section>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                    Deductions
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { name: 'pTax', label: 'P. Tax' },
                      { name: 'pf', label: 'Employees PF' },
                      { name: 'vpf', label: 'VPF' },
                      { name: 'mobile', label: 'Mobile Deduction' },
                      { name: 'loan', label: 'Loan /Adv. Deduction' },
                      { name: 'lpg', label: 'LPG Deduction' },
                      { name: 'fooding', label: 'Fooding' },
                      { name: 'other_deduction', label: 'Other Deduction', key: 'other' },
                      { name: 'tds', label: 'TDS' }
                    ].map(field => (
                      <div key={field.name} className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{field.label}</label>
                        <input 
                          type="number" 
                          name={field.name} 
                          defaultValue={editingEmployee?.deductions[(field.key || field.name) as keyof typeof editingEmployee.deductions] || 0} 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-500 font-bold text-sm" 
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex gap-4 pt-6 sticky bottom-0 bg-white pb-4 border-t border-slate-100">
                  <button type="button" onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEmployee(null);
                  }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-india-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-india-navy-20">
                    {editingEmployee ? 'Update Employee' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewEmployee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900-80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden border border-white-20"
            >
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-india-navy-10 rounded-xl text-india-navy">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">
                      Print Preview
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {previewEmployee.name} • {selectedMonth}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewEmployee(null)} 
                  className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors text-slate-500"
                >
                  <LogOut size={20} className="rotate-180" />
                </button>
              </div>
              
              <div className="p-8 max-h-[80vh] overflow-y-auto flex justify-center bg-slate-100-50">
                <SalarySlip 
                  employee={previewEmployee} 
                  settings={settings} 
                  month={selectedMonth} 
                />
              </div>

              <div className="p-6 bg-white border-t border-slate-200 flex justify-center gap-4">
                <button 
                  onClick={() => setPreviewEmployee(null)}
                  className="px-8 py-3 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-200 transition-all"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full p-3.5 rounded-xl transition-all font-bold text-sm uppercase tracking-widest relative
        ${active 
          ? 'bg-india-navy text-white shadow-xl shadow-india-navy-30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'}
      `}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-india-saffron text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
          {badge}
        </span>
      )}
      {active && <ArrowUpRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}

function StatCard({ title, value, change, icon, color }: { title: string, value: string, change: string, icon: React.ReactNode, color: 'navy' | 'green' | 'saffron' | 'slate' }) {
  const borderColors = {
    navy: 'border-india-navy-20',
    green: 'border-india-green-20',
    saffron: 'border-india-saffron-20',
    slate: 'border-slate-200'
  };

  const iconColors = {
    navy: 'bg-india-navy-10 text-india-navy',
    green: 'bg-india-green-10 text-india-green',
    saffron: 'bg-india-saffron-10 text-india-saffron',
    slate: 'bg-slate-100 text-slate-500'
  };

  return (
    <div className={`bg-white p-5 rounded-2xl border ${borderColors[color]} shadow-sm hover:shadow-md transition-all cursor-default group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconColors[color]} transition-colors`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-full border border-slate-100">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            color === 'green' ? 'bg-india-green' : 
            color === 'saffron' ? 'bg-india-saffron' : 'bg-india-navy'
          }`}></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Live</span>
        </div>
      </div>
      <div>
        <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <p className="text-xl lg:text-2xl font-black text-slate-800">{value}</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            {change}
          </p>
          <ArrowUpRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}

function QuickActionBtn({ label, icon, color, onClick }: { label: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'violet', onClick?: () => void }) {
  const colors = {
    blue: 'bg-white-10 text-white hover:bg-white-20',
    emerald: 'bg-white-10 text-white hover:bg-white-20',
    violet: 'bg-white-10 text-white hover:bg-white-20',
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest group ${colors[color]}`}
    >
      <div className="p-2 rounded-lg bg-white-10 group-hover:bg-white-20 transition-colors">
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}
