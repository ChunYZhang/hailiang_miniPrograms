import { Bell, Search, User, Key, LogOut, X } from 'lucide-react';
import { mockInquiries } from '../../data/mockData';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export default function Header({ sidebarCollapsed }: HeaderProps) {
  const pendingCount = mockInquiries.filter(i => i.status === 'pending').length;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = () => {
    setShowDropdown(false);
    setShowPasswordModal(true);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMsg(null);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: '请填写所有密码' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: '新密码与确认密码不一致' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: '新密码至少8位' });
      return;
    }
    try {
      await api.admin.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordMsg({ type: 'success', text: '修改成功' });
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || '修改失败' });
    }
  };

  const handleLogout = () => {
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'left-16' : 'left-60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单、用户..."
              className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-2 pl-4 border-l border-gray-200 cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 leading-tight">管理员</p>
                <p className="text-xs text-gray-400">超级管理员</p>
              </div>
            </div>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <Key size={16} className="text-gray-400" />
                  修改密码
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-all"
                >
                  <LogOut size={16} className="text-red-500" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">修改密码</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
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
              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMsg.text}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
