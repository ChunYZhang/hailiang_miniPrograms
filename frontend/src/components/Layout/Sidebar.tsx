import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Warehouse,
  Building2, Settings, BarChart3, ChevronLeft, ChevronRight,
  Heart, Tag
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '控制台' },
  { to: '/products/dolls', icon: Heart, label: '娃娃管理' },
  { to: '/products/accessories', icon: ShoppingBag, label: '配饰管理' },
  { to: '/series-category', icon: Tag, label: '系列/分类' },
  { to: '/inquiries', icon: Package, label: '询价订单' },
  { to: '/users', icon: Users, label: '用户管理' },
  { to: '/inventory', icon: Warehouse, label: '进销存' },
  { to: '/reports', icon: BarChart3, label: '数据报表' },
  { to: '/company', icon: Building2, label: '企业信息' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { companyInfo } = useCompany();
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center h-16 px-4 border-b border-slate-700 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart size={16} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight truncate">{companyInfo.name || '公司名称'}</p>
              <p className="text-xs text-slate-400 truncate">{companyInfo.slogan || '管理系统'}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center mx-auto">
            <Heart size={16} className="text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 group ${
                isActive
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4 border-t border-slate-700 pt-4">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
