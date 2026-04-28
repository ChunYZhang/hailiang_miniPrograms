import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { Admin } from '../../types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'admins' | 'password'>('email');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [smsConfig, setSmsConfig] = useState({
    enabled: false,
    phone: '',
    provider: 'aliyun',
    note: '短信功能预留配置，暂不实际发送',
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emailRes, adminRes] = await Promise.all([
        api.emailConfig.get(),
        api.admin.list(),
      ]);
      setEmailConfig(emailRes.data);
      setAdmins(adminRes.data || []);
    } catch (err) {
      console.error('获取数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveEmail = async () => {
    try {
      await api.emailConfig.save(emailConfig);
      setSaved('email');
      setTimeout(() => setSaved(null), 2000);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleSaveSms = () => {
    setSaved('sms');
    setTimeout(() => setSaved(null), 2000);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('新密码与确认密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('新密码至少8位');
      return;
    }
    try {
      await api.admin.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setSaved('password');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSaved(null), 2000);
    } catch (err: any) {
      alert(err.message || '修改失败');
    }
  };

  const toggleAdminStatus = async (id: string) => {
    try {
      await api.admin.toggleStatus(id);
      fetchData();
    } catch (err) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="系统设置" subtitle="邮件通知、短信配置与账号管理" />
        <div className="text-center py-20 text-gray-400"><p className="text-sm">加载中...</p></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="系统设置" subtitle="邮件通知、短信配置与账号管理" />

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'email', label: '邮件配置' },
          { id: 'sms', label: '短信配置' },
          { id: 'admins', label: '管理员账号' },
          { id: 'password', label: '修改密码' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'email' && emailConfig && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">邮件通知配置</h3>
                <p className="text-xs text-gray-400 mt-0.5">收到新询价单时自动发送邮件通知</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">{emailConfig.enabled ? '已开启' : '已关闭'}</span>
                <div
                  onClick={() => setEmailConfig({ ...emailConfig, enabled: !emailConfig.enabled })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${emailConfig.enabled ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${emailConfig.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">SMTP 服务器</label>
                  <input type="text" value={emailConfig.smtpServer || ''} onChange={e => setEmailConfig({ ...emailConfig, smtpServer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">端口</label>
                  <input type="text" value={emailConfig.smtpPort || ''} onChange={e => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">发件邮箱</label>
                <input type="email" value={emailConfig.username || ''} onChange={e => setEmailConfig({ ...emailConfig, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">邮箱密码/授权码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailConfig.password || ''}
                    onChange={e => setEmailConfig({ ...emailConfig, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">发件人名称</label>
                <input type="text" value={emailConfig.fromName || ''} onChange={e => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">触发条件</p>
                <p className="text-xs text-blue-600 mt-1">当客户提交询价单时，自动向发件邮箱发送通知，包含：询价单号、客户电话、搭配清单、总报价、提交时间。</p>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleSaveEmail}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved === 'email' ? 'bg-green-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
              >
                <Save size={14} /> {saved === 'email' ? '已保存' : '保存配置'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">短信通知配置</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">仅预留，不实际发送</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mb-4">
              <p className="text-xs text-amber-700">{smsConfig.note}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">接收短信手机号</label>
                <input
                  type="tel"
                  value={smsConfig.phone}
                  onChange={e => setSmsConfig({ ...smsConfig, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="请输入接收通知的手机号"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">短信服务商</label>
                <select
                  value={smsConfig.provider}
                  onChange={e => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <option value="aliyun">阿里云</option>
                  <option value="tencent">腾讯云</option>
                  <option value="yunpian">云片</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={handleSaveSms}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved === 'sms' ? 'bg-green-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
              >
                <Save size={14} /> {saved === 'sms' ? '已保存' : '保存配置'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admins' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> 添加管理员
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">账号信息</th>
                  <th className="px-4 py-3 text-center font-semibold">角色</th>
                  <th className="px-4 py-3 text-left font-semibold">邮箱</th>
                  <th className="px-4 py-3 text-center font-semibold">最后登录</th>
                  <th className="px-4 py-3 text-center font-semibold">状态</th>
                  <th className="px-4 py-3 text-center font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {admin.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{admin.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        admin.role === 'super' ? 'bg-rose-100 text-rose-700' :
                        admin.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {admin.role === 'super' ? '超级管理员' : admin.role === 'manager' ? '经理' : '员工'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{admin.email || '—'}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{admin.lastLogin || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={admin.status} type="admin" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">编辑</button>
                        {admin.role !== 'super' && (
                          <button
                            onClick={() => toggleAdminStatus(admin.id)}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            {admin.status === 'active' ? '禁用' : '启用'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admins.length === 0 && (
              <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无管理员</p></div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="max-w-md">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3">修改登录密码</h3>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">当前密码</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="请输入当前密码"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">新密码</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="请输入新密码（至少8位）"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">确认新密码</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="请再次输入新密码"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved === 'password' ? 'bg-green-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
              >
                <Save size={14} /> {saved === 'password' ? '修改成功' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}