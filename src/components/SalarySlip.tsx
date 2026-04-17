import React, { useRef } from 'react';
import { Employee, AppSettings } from '../types';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

interface SalarySlipProps {
  employee: Employee;
  settings: AppSettings;
  month?: string;
  hideControls?: boolean;
}

const DetailRow = ({ label, value, highlight = '' }: { label: string, value: string, highlight?: string }) => (
  <div className="flex justify-between border-b border-slate-100 pb-1.5">
    <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">{label}:</span>
    <span className={`font-semibold ${highlight}`}>{value}</span>
  </div>
);

const AttendanceCol = ({ label, value, isHeader = false }: { label?: string, value: number | string, isHeader?: boolean }) => (
  <div className={cn(
    "p-1.5",
    isHeader ? "bg-slate-50 font-bold text-[10px] uppercase text-slate-500 border-b border-slate-200" : "bg-white text-slate-700 font-medium",
    "border-r border-slate-200 last:border-r-0"
  )}>
    {isHeader ? label : value}
  </div>
);

const AmountRow = ({ label, value, last = false }: { label: string, value: number, last?: boolean }) => (
  <div className={cn("flex justify-between p-2 text-[11px]", !last && "border-b border-slate-50")}>
    <span className="text-slate-600 font-medium">{label}</span>
    <span className="font-bold text-slate-800">{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </div>
);

const SummaryBox = ({ label, value, primary = false }: { label: string, value: number, primary?: boolean }) => (
  <div className={cn(
    "p-4 rounded-xl border shadow-sm transition-all",
    primary 
      ? "border-slate-800 bg-slate-800 text-white scale-105" 
      : "border-slate-200 bg-white text-slate-800"
  )}>
    <p className={cn("text-[9px] uppercase font-bold tracking-widest mb-1", primary ? "text-slate-300" : "text-slate-400")}>{label}</p>
    <p className="text-xl font-black">₹ {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
  </div>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const [integerPart, decimalPart] = num.toFixed(2).split('.');
  const n = parseInt(integerPart);
  const d = parseInt(decimalPart);

  if (n === 0 && d === 0) return 'Zero Rupees Only';

  let result = n === 0 ? '' : inWords(n);
  if (n > 0) result += 'Rupees ';

  if (d > 0) {
    if (n > 0) result += 'and ';
    result += inWords(d) + 'Paise ';
  }

  return result + 'Only';
};

export const SalarySlip: React.FC<SalarySlipProps> = ({ employee, settings, month, hideControls = false }) => {
  const slipRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = React.useState(false);

  const calculateGrossEarnings = () => {
    return (Object.values(employee.earnings) as number[]).reduce((a, b) => a + b, 0);
  };

  const calculateGrossDeductions = () => {
    return (Object.values(employee.deductions) as number[]).reduce((a, b) => a + b, 0);
  };

  const netPayable = calculateGrossEarnings() - calculateGrossDeductions();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current || isDownloading) return;
    
    setIsDownloading(true);
    console.log('Starting PDF generation...');
    
    try {
      // Ensure the element is visible and scroll to top for capture
      window.scrollTo(0, 0);
      
      // Small delay to ensure all images are loaded and layout is stable
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log('Capturing image...');
      const canvas = await html2canvas(slipRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      console.log('Image captured, generating PDF...');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add image to fill the entire A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileName = employee.id === 'blank' ? 'Blank_Salary_Slip.pdf' : `SalarySlip_${employee.code}_${month}.pdf`;
      console.log('Saving PDF:', fileName);
      pdf.save(fileName);
      console.log('PDF saved successfully.');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again or use the Print option.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (val === 0 && employee.id !== 'blank') return '0.00';
    if (employee.id === 'blank') return '0.00';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6 w-full max-w-5xl mx-auto print:p-0 print:m-0 print:w-full print:max-w-none">
      {!hideControls && (
        <div className="flex gap-4 no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm w-full justify-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
          >
            <Printer size={16} /> Print Slip
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg uppercase tracking-widest text-[10px] ${
              isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800'
            }`}
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white-30 border-t-white rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <Download size={16} /> Download PDF
              </>
            )}
          </button>
        </div>
      )}

      <div
        ref={slipRef}
        className="w-[210mm] min-h-[297mm] bg-white text-slate-800 p-[10mm] font-sans border-8 border-slate-50 shadow-2xl rounded-sm relative overflow-hidden"
        id="salary-slip-content"
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8 pb-6 border-b-2 border-slate-900 relative z-10">
          <div className="flex items-center gap-6">
            {settings.logoUrl ? (
              <div className="w-20 h-20 bg-white rounded-2xl border border-slate-100 p-3 flex items-center justify-center shadow-xl">
                <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-display font-black text-4xl shadow-2xl">
                {(employee.companyName || settings.companyName).charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tight leading-none mb-2">
                {employee.companyName || settings.companyName}
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] max-w-sm leading-relaxed">{settings.companyAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2 relative">
              <h2 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter leading-none">PAY SLIP</h2>
              {employee.paymentStatus === 'Paid' && (
                <div className="absolute -top-6 -right-4 transform rotate-12 border-4 border-india-green text-india-green px-4 py-1 rounded-xl font-black text-xl uppercase tracking-widest opacity-60 shadow-lg">
                  PAID
                </div>
              )}
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                {employee.id === 'blank' ? 'Template / Blank' : month}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
              Official Record
            </div>
          </div>
        </div>

        {/* Employee Info Grid - Modern Layout */}
        <div className="grid grid-cols-3 gap-8 mb-8 relative z-10">
          <div className="space-y-4">
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Employee Name</p>
              <p className="text-sm font-display font-black text-slate-900 border-b border-slate-100 pb-1">{employee.name}</p>
            </div>
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Designation</p>
              <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.designation}</p>
            </div>
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Department</p>
              <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.department}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Employee Code</p>
              <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.code}</p>
            </div>
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Joining Date</p>
              <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.joiningDate}</p>
            </div>
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">UAN Number</p>
              <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.uan || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="group">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Grade / Level</p>
              <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.grade}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Present</p>
                <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.attendance.present}</p>
              </div>
              <div className="group">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-900 transition-colors">Payable</p>
                <p className="text-[12px] font-bold text-slate-700 border-b border-slate-100 pb-1">{employee.attendance.payable}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions - Advanced Table */}
        <div className="grid grid-cols-2 gap-0 mb-6 relative z-10 border-2 border-slate-900 rounded-xl overflow-hidden shadow-lg">
          {/* Earnings Column */}
          <div className="bg-white p-5 border-r-2 border-slate-900">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-slate-100">
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
              <h3 className="text-[11px] font-display font-black text-slate-900 uppercase tracking-[0.2em]">Earnings</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Basic Salary', val: employee.earnings.basic },
                { label: 'House Rent Allowance', val: employee.earnings.hra },
                { label: 'Washing Allowance', val: employee.earnings.washing },
                { label: 'Other Allowance', val: employee.earnings.other },
                { label: 'Personal Allowance', val: employee.earnings.personal },
                { label: 'Transportation Allowance', val: employee.earnings.transport },
                { label: 'Remote Area Allowance', val: employee.earnings.remote },
                { label: 'Contingency Allowance', val: employee.earnings.contingency },
                { label: 'Medical (Monthly)', val: employee.earnings.medical },
                { label: 'LTA (Monthly)', val: employee.earnings.lta },
                { label: 'Bonus (Monthly)', val: employee.earnings.bonus },
                { label: 'Special Allowance', val: employee.earnings.special },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] group">
                  <span className="text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-900 transition-colors">{item.label}</span>
                  <span className="font-black text-slate-900">₹ {formatCurrency(item.val)}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t-2 border-double border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Gross Earnings</span>
                <span className="text-base font-display font-black text-slate-900">₹ {calculateGrossEarnings().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-slate-200">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              <h3 className="text-[11px] font-display font-black text-slate-900 uppercase tracking-[0.2em]">Deductions</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Professional Tax', val: employee.deductions.pTax },
                { label: 'Provident Fund (PF)', val: employee.deductions.pf },
                { label: 'Voluntary PF (VPF)', val: employee.deductions.vpf },
                { label: 'Mobile Deduction', val: employee.deductions.mobile },
                { label: 'Loan / Advance', val: employee.deductions.loan },
                { label: 'LPG Deduction', val: employee.deductions.lpg },
                { label: 'Fooding Deduction', val: employee.deductions.fooding },
                { label: 'Other Deductions', val: employee.deductions.other },
                { label: 'TDS', val: employee.deductions.tds },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] group">
                  <span className="text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-900 transition-colors">{item.label}</span>
                  <span className="font-black text-slate-900">₹ {formatCurrency(item.val)}</span>
                </div>
              ))}
              {/* Spacer to align with earnings */}
              <div className="h-[40px]"></div>
              <div className="pt-3 mt-3 border-t-2 border-double border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Deductions</span>
                <span className="text-base font-display font-black text-slate-900">₹ {calculateGrossDeductions().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay Summary Card */}
        <div className="bg-slate-900 rounded-[24px] p-6 text-white flex justify-between items-center shadow-lg relative z-10 overflow-hidden border-4 border-slate-800 mb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-[0.03] rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Net Payable Amount</p>
            <h2 className="text-4xl font-display font-black tracking-tighter text-white">₹ {netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="text-right relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Amount in Words</p>
            <p className="text-[12px] font-display font-black italic text-slate-300 max-w-[300px] leading-tight">
              {employee.id === 'blank' ? 'Zero Rupees Only' : numberToWords(netPayable)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t-2 border-slate-900 flex justify-between items-end relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-4 mb-2">
              {/* QR Code */}
              <div className="w-16 h-16 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                <QRCodeCanvas 
                  value={`Employee: ${employee.name}\nCode: ${employee.code}\nMonth: ${month}\nNet Pay: ₹${netPayable.toLocaleString('en-IN')}`}
                  size={50}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Pay Slip Details</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-sm">
                  This is a computer generated pay slip and does not require a physical signature. Verified for {month}.
                </p>
              </div>
            </div>
            <div className="inline-block px-3 py-1.5 border-2 border-slate-100 rounded-xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Document ID: <span className="text-slate-900">{employee.id}-{month?.replace(' ', '-')}-SECURE</span></p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-48 h-16 border-b-2 border-slate-900 mb-3 relative flex items-center justify-center">
               {settings.signatureUrl ? (
                 <img src={settings.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain relative z-20" />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 rotate-[-12deg]">
                    <p className="text-2xl font-display font-black uppercase tracking-tighter">VERIFIED</p>
                 </div>
               )}
               <p className="absolute bottom-1 right-0 text-[10px] font-black text-slate-300 italic uppercase tracking-widest">E-Signature Verified</p>
            </div>
            <p className="text-[11px] font-display font-black text-slate-900 uppercase tracking-[0.2em]">Authorized Signatory</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{employee.companyName || settings.companyName}</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { 
            height: 100%;
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: hidden !important;
            background: white !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          #salary-slip-content { 
            border: none !important; 
            box-shadow: none !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 auto !important;
            padding: 15mm !important;
            background: white !important;
            color: #1e293b !important;
            border-radius: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            z-index: 9999;
          }
          .bg-slate-900 { 
            background-color: #0f172a !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          .bg-slate-50 {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-white { color: white !important; -webkit-print-color-adjust: exact; }
          .text-slate-400 { color: #94a3b8 !important; -webkit-print-color-adjust: exact; }
          .text-slate-500 { color: #64748b !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};
