import { Bell, Search, User } from 'lucide-react';
import { mockInquiries } from '../../data/mockData';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export default function Header({ sidebarCollapsed }: HeaderProps) {
  const pendingCount = mockInquiries.filter(i => i.status === 'pending').length;

  return (
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

        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-tight">管理员</p>
            <p className="text-xs text-gray-400">超级管理员</p>
          </div>
        </div>
      </div>
    </header>
  );
}
