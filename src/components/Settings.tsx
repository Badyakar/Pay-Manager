import React from 'react';
import { AppSettings } from '../types';
import { Upload, Save, Globe, Mail, Shield, CheckCircle2, User, Calendar as CalendarIcon } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, backgroundUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, signatureUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ 
          ...localSettings, 
          adminProfile: { ...localSettings.adminProfile, avatarUrl: reader.result as string } 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Admin Profile Section */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-india-saffron"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-india-saffron-10 rounded-xl text-india-saffron">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Admin Profile</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personal Information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-saffron transition-all font-bold text-slate-700"
                value={localSettings.adminProfile.name}
                onChange={(e) => setLocalSettings({...localSettings, adminProfile: {...localSettings.adminProfile, name: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-saffron transition-all font-bold text-slate-700"
                value={localSettings.adminProfile.email}
                onChange={(e) => setLocalSettings({...localSettings, adminProfile: {...localSettings.adminProfile, email: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-saffron transition-all font-bold text-slate-700"
                value={localSettings.adminProfile.role}
                onChange={(e) => setLocalSettings({...localSettings, adminProfile: {...localSettings.adminProfile, role: e.target.value}})}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Picture</label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50-50 group hover:border-india-saffron-30 transition-colors">
                <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                  {localSettings.adminProfile.avatarUrl ? (
                    <img src={localSettings.adminProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-300" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-tighter">PNG/JPG • Square Recommended</p>
                  <label className="inline-block px-4 py-2 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-india-saffron hover:text-white hover:border-india-saffron transition-all shadow-sm">
                    Upload Photo
                    <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payroll Configuration Section */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-india-navy"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-india-navy-10 rounded-xl text-india-navy">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Payroll Configuration</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cycle & Schedule</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Payment Day</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy transition-all font-bold text-slate-700 appearance-none"
                value={localSettings.paymentDay}
                onChange={(e) => setLocalSettings({...localSettings, paymentDay: parseInt(e.target.value)})}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <CalendarIcon size={18} />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">This will update the "Next Pay Cycle" countdown on your dashboard.</p>
          </div>
        </div>
      </section>

      {/* Branding Section */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-india-navy"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-india-navy-10 rounded-xl text-india-navy">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Company Branding</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Identity & Visuals</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy transition-all font-bold text-slate-700"
                value={localSettings.companyName}
                onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Address</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-navy transition-all h-32 font-medium text-slate-600 leading-relaxed"
                value={localSettings.companyAddress}
                onChange={(e) => setLocalSettings({...localSettings, companyAddress: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Management</label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50-50 group hover:border-india-navy-30 transition-colors">
                <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                  {localSettings.logoUrl ? (
                    <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Upload className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-tighter">PNG/JPG • Max 2MB</p>
                  <label className="inline-block px-4 py-2 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-india-navy hover:text-white hover:border-india-navy transition-all shadow-sm">
                    Choose File
                    <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Background</label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50-50 group hover:border-india-navy-30 transition-colors">
                <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                  {localSettings.backgroundUrl ? (
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${localSettings.backgroundUrl})` }} />
                  ) : (
                    <Upload className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-tighter">HD Wallpaper • 1920x1080</p>
                  <label className="inline-block px-4 py-2 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-india-navy hover:text-white hover:border-india-navy transition-all shadow-sm">
                    Choose File
                    <input type="file" className="hidden" onChange={handleBackgroundUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature</label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50-50 group hover:border-india-navy-30 transition-colors">
                <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                  {localSettings.signatureUrl ? (
                    <img src={localSettings.signatureUrl} alt="Signature" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Upload className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-tighter">PNG/JPG • Transparent Recommended</p>
                  <label className="inline-block px-4 py-2 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-india-navy hover:text-white hover:border-india-navy transition-all shadow-sm">
                    Choose File
                    <input type="file" className="hidden" onChange={handleSignatureUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Configuration Section */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-500-10 rounded-xl text-red-500">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Compliance Configuration</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Due Dates & Alerts</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PF Due Day</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold text-slate-700 appearance-none"
              value={localSettings.complianceConfig.pfDueDay}
              onChange={(e) => setLocalSettings({
                ...localSettings, 
                complianceConfig: { ...localSettings.complianceConfig, pfDueDay: parseInt(e.target.value) }
              })}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESI Due Day</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold text-slate-700 appearance-none"
              value={localSettings.complianceConfig.esiDueDay}
              onChange={(e) => setLocalSettings({
                ...localSettings, 
                complianceConfig: { ...localSettings.complianceConfig, esiDueDay: parseInt(e.target.value) }
              })}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PTAX Due Day</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold text-slate-700 appearance-none"
              value={localSettings.complianceConfig.ptaxDueDay}
              onChange={(e) => setLocalSettings({
                ...localSettings, 
                complianceConfig: { ...localSettings.complianceConfig, ptaxDueDay: parseInt(e.target.value) }
              })}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
          Note: Changing these dates will apply to new monthly cycles. For the current month, existing alerts will be updated to reflect the new due dates.
        </p>
      </section>

      {/* Email Section */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-india-green"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-india-green-10 rounded-xl text-india-green">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Email Gateway</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">SMTP Configuration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Host</label>
            <input 
              type="text" 
              placeholder="e.g. smtp.gmail.com"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-green transition-all font-bold text-slate-700"
              value={localSettings.emailConfig.smtpHost}
              onChange={(e) => setLocalSettings({...localSettings, emailConfig: {...localSettings.emailConfig, smtpHost: e.target.value}})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Port</label>
            <input 
              type="number" 
              placeholder="587"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-green transition-all font-bold text-slate-700"
              value={localSettings.emailConfig.smtpPort}
              onChange={(e) => setLocalSettings({...localSettings, emailConfig: {...localSettings.emailConfig, smtpPort: parseInt(e.target.value)}})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Username</label>
            <input 
              type="text" 
              placeholder="your-email@example.com"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-green transition-all font-bold text-slate-700"
              value={localSettings.emailConfig.smtpUser}
              onChange={(e) => setLocalSettings({...localSettings, emailConfig: {...localSettings.emailConfig, smtpUser: e.target.value}})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Password (App Password)</label>
            <input 
              type="password" 
              placeholder="16-digit app password"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-green transition-all font-bold text-slate-700"
              value={localSettings.emailConfig.smtpPass}
              onChange={(e) => setLocalSettings({...localSettings, emailConfig: {...localSettings.emailConfig, smtpPass: e.target.value}})}
            />
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Use a 16-digit Gmail App Password, not your regular password.</p>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Email Address</label>
            <input 
              type="email" 
              placeholder="payroll@yourcompany.in"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-india-green transition-all font-bold text-slate-700"
              value={localSettings.emailConfig.fromEmail}
              onChange={(e) => setLocalSettings({...localSettings, emailConfig: {...localSettings.emailConfig, fromEmail: e.target.value}})}
            />
          </div>
          <div className="md:col-span-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                const btn = document.getElementById('test-smtp-btn');
                if (btn) {
                  const originalText = btn.innerHTML;
                  btn.innerHTML = 'Testing...';
                  btn.setAttribute('disabled', 'true');
                  try {
                    const response = await fetch('/api/test-smtp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ smtpConfig: localSettings.emailConfig })
                    });
                    const result = await response.json();
                    if (response.ok) {
                      alert('✅ Success! SMTP connection verified and test email sent.');
                    } else {
                      alert('❌ Failed: ' + (result.error || result.details));
                    }
                  } catch (err: any) {
                    alert('❌ Error: ' + err.message);
                  } finally {
                    btn.innerHTML = originalText;
                    btn.removeAttribute('disabled');
                  }
                }
              }}
              id="test-smtp-btn"
              className="px-6 py-3 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-india-green hover:text-white transition-all border border-slate-200"
            >
              Test SMTP Connection
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => onSave(localSettings)}
          className="flex items-center gap-3 px-10 py-5 bg-india-navy text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-india-navy-30 active:scale-95 group"
        >
          <Save size={20} className="group-hover:rotate-12 transition-transform" /> 
          Save System Configuration
        </button>
      </div>
    </div>
  );
};
