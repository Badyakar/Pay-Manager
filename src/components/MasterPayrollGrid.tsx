import React, { useState } from 'react';
import { Employee, AppSettings } from '../types';
import { Search, Filter, FileSpreadsheet, FileText, Mail, ArrowRight, Upload, Download as DownloadIcon, Edit2, Trash2, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MasterPayrollGridProps {
  employees: Employee[];
  settings: AppSettings;
  selectedMonth: string;
  initialSearch?: string;
  onViewSlip: (code: string) => void;
  onPreviewSlip: (employee: Employee) => void;
  onSendEmail: (employee: Employee) => Promise<void>;
  onImport: (newEmployees: Employee[]) => void;
  onDeleteRequest: (employeeId: string) => void;
  onEditEmployee: (employee: Employee) => void;
  onCopyFromPrevious?: () => void;
  onSendAllEmails: (employees: Employee[]) => Promise<void>;
  onUpdateStatus: (employeeId: string, status: 'Paid' | 'Pending') => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const MasterPayrollGrid: React.FC<MasterPayrollGridProps> = ({ 
  employees, 
  settings,
  selectedMonth,
  initialSearch = '',
  onViewSlip, 
  onPreviewSlip,
  onSendEmail,
  onImport,
  onDeleteRequest,
  onEditEmployee,
  onCopyFromPrevious,
  onSendAllEmails,
  onUpdateStatus,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [deptFilter, setDeptFilter] = useState('All');
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);

  React.useEffect(() => {
    if (initialSearch !== searchTerm) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  const departments = ['All', ...new Set(employees.map(e => e.department))];

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const groupedEmployees = filteredEmployees.reduce((acc, emp) => {
    const month = emp.month || 'Unknown';
    if (!acc[month]) acc[month] = [];
    acc[month].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  const sortedMonths = Object.keys(groupedEmployees).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    const [ma, ya] = a.split(' ');
    const [mb, yb] = b.split(' ');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndexA = monthNames.indexOf(ma);
    const monthIndexB = monthNames.indexOf(mb);
    const dateA = new Date(parseInt(ya), monthIndexA, 1);
    const dateB = new Date(parseInt(yb), monthIndexB, 1);
    return dateB.getTime() - dateA.getTime();
  });

  const handleSendEmail = async (e: Employee) => {
    setSendingEmailId(e.id);
    try {
      await onSendEmail(e);
    } catch (err) {
      // Error already handled in App.tsx
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSendAllEmails = async () => {
    if (filteredEmployees.length === 0) {
      showToast('No employees to send emails to.', 'error');
      return;
    }
    setIsSendingAll(true);
    try {
      await onSendAllEmails(filteredEmployees);
    } finally {
      setIsSendingAll(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const newEmployees: Employee[] = parsedData.map((row, index) => ({
          id: row.id || Math.random().toString(36).substr(2, 9),
          code: row.code || `EMP${index + 100}`,
          name: row.name || 'Unknown',
          companyName: row.companyName || '',
          department: row.department || 'General',
          designation: row.designation || 'Staff',
          joiningDate: row.joiningDate || new Date().toLocaleDateString(),
          grade: row.grade || 'S1',
          uan: row.uan || '',
          email: row.email || '',
          attendance: {
            present: Number(row.present) || 0,
            od: Number(row.od) || 0,
            wo: Number(row.wo) || 0,
            leave: Number(row.leave) || 0,
            holiday: Number(row.holiday) || 0,
            payable: Number(row.payable) || 0,
            lwp: Number(row.lwp) || 0,
          },
          earnings: {
            basic: Number(row.basic) || 0,
            hra: Number(row.hra) || 0,
            washing: Number(row.washing) || 0,
            other: Number(row.other_earning || row.other) || 0,
            personal: Number(row.personal) || 0,
            transport: Number(row.transport) || 0,
            remote: Number(row.remote) || 0,
            contingency: Number(row.contingency) || 0,
            medical: Number(row.medical) || 0,
            lta: Number(row.lta) || 0,
            bonus: Number(row.bonus) || 0,
            special: Number(row.special) || 0,
          },
          deductions: {
            pTax: Number(row.pTax) || 0,
            pf: Number(row.pf) || 0,
            vpf: Number(row.vpf) || 0,
            mobile: Number(row.mobile) || 0,
            loan: Number(row.loan) || 0,
            lpg: Number(row.lpg) || 0,
            fooding: Number(row.fooding) || 0,
            other: Number(row.other_deduction || row.other) || 0,
            tds: Number(row.tds) || 0,
          },
          paymentStatus: (row.paymentStatus === 'Paid' ? 'Paid' : 'Pending') as 'Paid' | 'Pending',
          approvalStatus: 'PendingAddition' as const,
          month: row.month || selectedMonth,
          timestamp: row.timestamp || new Date().toISOString(),
          emailSent: row.emailSent === 'true' || row.emailSent === true
        }));

        // Simplified: remove confirm for iframe compatibility
        onImport(newEmployees);
        showToast(`Imported ${newEmployees.length} employees for approval.`, 'success');
      },
      error: (error) => {
        showToast(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  const downloadSampleCsv = () => {
    const headers = [
      'code', 'name', 'companyName', 'department', 'designation', 'joiningDate', 'grade', 'uan', 'email',
      'present', 'od', 'wo', 'leave', 'holiday', 'payable', 'lwp',
      'basic', 'hra', 'washing', 'other_earning', 'personal', 'transport', 'remote', 'contingency', 'medical', 'lta', 'bonus', 'special',
      'pTax', 'pf', 'vpf', 'mobile', 'loan', 'lpg', 'fooding', 'other_deduction', 'tds', 'paymentStatus'
    ].join(',');
    
    const sampleRow = [
      'EMP003', 'Sample User', 'Sample Corp', 'IT', 'Developer', '01/01/2025', 'S3', '123456789012', 'sample@example.com',
      '22', '0', '4', '0', '1', '27', '0',
      '30000', '12000', '500', '1000', '2000', '1500', '0', '500', '1250', '2000', '2000', '1000',
      '200', '1800', '0', '0', '0', '0', '500', '0', '2000', 'Pending'
    ].join(',');

    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${sampleRow}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (filteredEmployees.length === 0) {
      showToast('No data to export.', 'error');
      return;
    }

    const exportData = filteredEmployees.map(e => {
      const gross = (Object.values(e.earnings) as number[]).reduce((a, b) => a + b, 0);
      const deductions = (Object.values(e.deductions) as number[]).reduce((a, b) => a + b, 0);
      const net = gross - deductions;

      return {
        'Employee Code': e.code,
        'Name': e.name,
        'Company Name': e.companyName || '',
        'Department': e.department,
        'Designation': e.designation,
        'Grade': e.grade,
        'UAN': e.uan,
        'Email': e.email,
        'Joining Date': e.joiningDate,
        'Days Present': e.attendance.present,
        'Payable Days': e.attendance.payable,
        'Gross Salary': gross,
        'Total Deductions': deductions,
        'Net Payable': net
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Data");
    XLSX.writeFile(workbook, `Payroll_Export_${selectedMonth.replace(' ', '_')}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50-50">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
            Data for {selectedMonth}
          </div>
          <div className="flex gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or code..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all shadow-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none bg-white shadow-sm font-medium text-slate-600"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
        
      <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all cursor-pointer font-bold text-sm shadow-sm">
            <Upload size={18} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          <button 
            onClick={downloadSampleCsv}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm"
          >
            <DownloadIcon size={18} /> Sample
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 text-white bg-slate-800 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all font-bold text-sm shadow-lg"
          >
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button 
            onClick={handleSendAllEmails}
            disabled={isSendingAll || filteredEmployees.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-white bg-indigo-600 border border-indigo-600 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
              isSendingAll && "animate-pulse"
            )}
          >
            <Mail size={18} /> {isSendingAll ? 'Sending All...' : 'Send All Emails'}
          </button>
          {onCopyFromPrevious && employees.length === 0 && (
            <button 
              onClick={onCopyFromPrevious}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-800 bg-white border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-bold text-sm shadow-sm"
            >
              <ArrowRight size={18} /> Copy from Last Month
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <th className="px-6 py-4 border-b border-slate-200">Code</th>
              <th className="px-6 py-4 border-b border-slate-200">Employee Name</th>
              <th className="px-6 py-4 border-b border-slate-200">Department</th>
              <th className="px-6 py-4 border-b border-slate-200">Grade</th>
              <th className="px-6 py-4 border-b border-slate-200">Joining Date</th>
              <th className="px-6 py-4 border-b border-slate-200">Gross (₹)</th>
              <th className="px-6 py-4 border-b border-slate-200">Net Payable (₹)</th>
              <th className="px-6 py-4 border-b border-slate-200 text-center">Payment</th>
              <th className="px-6 py-4 border-b border-slate-200">Email Status</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedMonths.map(month => (
              <React.Fragment key={month}>
                <tr className="bg-slate-100/50">
                  <td colSpan={10} className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-y border-slate-200">
                    {month}
                  </td>
                </tr>
                {groupedEmployees[month].map((e) => {
              const gross = (Object.values(e.earnings) as number[]).reduce((a, b) => a + b, 0);
              const deductions = (Object.values(e.deductions) as number[]).reduce((a, b) => a + b, 0);
              const net = gross - deductions;

              return (
                <tr key={e.id} className="hover:bg-slate-50-80 transition-colors group">
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => onViewSlip(e.code)}
                      className="text-slate-800 font-bold hover:underline flex items-center gap-1.5"
                    >
                      {e.code} <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">{e.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{e.designation}</div>
                  </td>
                  <td className="px-6 py-5 text-slate-600 font-medium">{e.department}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">{e.grade}</span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-xs font-medium">{e.joiningDate}</td>
                  <td className="px-6 py-5 font-mono text-slate-700 font-bold">₹{gross.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-5 font-mono font-black text-slate-900 text-base">₹{net.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        e.paymentStatus === 'Paid' 
                          ? 'bg-green-100 text-india-green border border-green-200' 
                          : 'bg-orange-100 text-india-saffron border border-orange-200 animate-pulse'
                      }`}>
                        {e.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {e.emailSent ? (
                      <span className="flex items-center gap-1.5 text-india-green font-bold text-[10px] uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const newStatus = e.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
                          onUpdateStatus(e.id, newStatus);
                          showToast(`${e.name} marked as ${newStatus}.`, 'success');
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          e.paymentStatus === 'Paid' 
                            ? 'text-india-green hover:bg-green-50' 
                            : 'text-india-saffron hover:bg-orange-50'
                        }`}
                        title={e.paymentStatus === 'Paid' ? "Mark as Pending" : "Mark as Paid"}
                      >
                        <CreditCard size={16} />
                      </button>
                      <button
                        onClick={() => onPreviewSlip(e)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                        title="Print Preview"
                      >
                        <Search size={16} />
                      </button>
                      <button
                        onClick={() => onViewSlip(e.code)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                        title="View Salary Slip"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => onEditEmployee(e)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                        title="Edit Employee"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          // Simplified: remove confirm for iframe compatibility
                          onDeleteRequest(e.id);
                          showToast(`Deletion request sent for ${e.name}.`, 'info');
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Request Deletion"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleSendEmail(e)}
                        disabled={sendingEmailId === e.id}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm",
                          sendingEmailId === e.id 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-slate-100 text-slate-800 hover:bg-slate-800 hover:text-white hover:shadow-lg"
                        )}
                      >
                        <Mail size={14} />
                        {sendingEmailId === e.id ? 'Sending...' : 'Send Slip'}
                      </button>
                    </div>
                  </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredEmployees.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          No employees found matching your filters.
        </div>
      )}
    </div>
  );
};
