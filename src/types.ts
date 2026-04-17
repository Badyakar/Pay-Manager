export interface AttendanceSummary {
  present: number;
  od: number;
  wo: number;
  leave: number;
  holiday: number;
  payable: number;
  lwp: number;
}

export interface Earnings {
  basic: number;
  hra: number;
  washing: number;
  other: number;
  personal: number;
  transport: number;
  remote: number;
  contingency: number;
  medical: number;
  lta: number;
  bonus: number;
  special: number;
}

export interface Deductions {
  pTax: number;
  pf: number;
  vpf: number;
  mobile: number;
  loan: number;
  lpg: number;
  fooding: number;
  other: number;
  tds: number;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  companyName?: string;
  department: string;
  designation: string;
  joiningDate: string;
  grade: string;
  uan: string;
  email: string;
  attendance: AttendanceSummary;
  earnings: Earnings;
  deductions: Deductions;
  paymentStatus: 'Paid' | 'Pending';
  approvalStatus: 'Approved' | 'PendingAddition' | 'PendingDeletion';
  emailSent?: boolean;
  month: string; // Format: "Month Year" e.g. "March 2026"
  timestamp: string; // ISO string
}

export interface ComplianceTask {
  id: string;
  name: string;
  dueDay: number;
  isDone: boolean;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  logoUrl?: string;
  signatureUrl?: string;
  backgroundUrl?: string;
  paymentDay: number;
  adminProfile: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  emailConfig: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
  };
  complianceConfig: {
    pfDueDay: number;
    esiDueDay: number;
    ptaxDueDay: number;
  };
  complianceTasks: {
    [month: string]: ComplianceTask[];
  };
}
