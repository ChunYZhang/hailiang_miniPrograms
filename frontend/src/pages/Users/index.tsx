import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Eye, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { User, MiniUserRegister } from '../../types';

interface UserFormData {
  phone: string;
  nickname: string;
  region: string;
  avatar: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'registers'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({ phone: '', nickname: '', region: '', avatar: '' });

  // 注册申请相关
  const [registers, setRegisters] = useState<MiniUserRegister[]>([]);
  const [registerLoading, setRegisterLoading] = useState(true);
  const [filterRegisterStatus, setFilterRegisterStatus] = useState('all');

  // 分页
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [registerPage, setRegisterPage] = useState(1);
  const [registerTotal, setRegisterTotal] = useState(0);
  const PAGE_SIZE = 8;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.user.list({ keyword: search || undefined, status: filterStatus === 'all' ? undefined : filterStatus, page, page_size: PAGE_SIZE });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取用户列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisters = async () => {
    setRegisterLoading(true);
    try {
      const res = await api.miniUser.registerList({ status: filterRegisterStatus === 'all' ? undefined : filterRegisterStatus, page: registerPage, page_size: PAGE_SIZE });
      setRegisters(res.data || []);
      setRegisterTotal(res.total || 0);
    } catch (err) {
      console.error('获取注册申请列表失败', err);
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchRegisters();
    }
  }, [search, filterStatus, activeTab, filterRegisterStatus, page, registerPage]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setRegisterPage(1);
  };

  const toggleUserStatus = async (id: string) => {
    try {
      await api.user.toggleStatus(id);
      fetchUsers();
    } catch (err) {
      alert('操作失败');
    }
  };

  const approveRegister = async (id: string) => {
    if (!confirm('确认通过该注册申请？')) return;
    try {
      await api.miniUser.approve(id);
      fetchRegisters();
    } catch (err) {
      alert('操作失败');
    }
  };

  const rejectRegister = async (id: string) => {
    if (!confirm('确认拒绝该注册申请？')) return;
    try {
      await api.miniUser.reject(id);
      fetchRegisters();
    } catch (err) {
      alert('操作失败');
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ phone: '', nickname: '', region: '', avatar: '' });
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ phone: user.phone || '', nickname: user.nickname || '', region: user.region || '', avatar: user.avatar || '' });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await api.user.update({ id: editingUser.id, ...userForm });
      } else {
        await api.user.create(userForm);
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('确认删除该用户？')) return;
    try {
      await api.user.delete(id);
      fetchUsers();
    } catch (err) {
      alert('删除失败');
    }
  };

  const filtered = users;

  return (
    <div>
      <PageHeader
        title="用户管理"
        subtitle={`共 ${total} 位用户，活跃 ${users.filter(u => u.status === 'active').length} 位`}
        actions={
          activeTab === 'users' && (
            <button
              onClick={openCreateUser}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> 添加用户
            </button>
          )
        }
      />

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          用户列表
        </button>
        <button
          onClick={() => setActiveTab('registers')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'registers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          注册申请
          {registers.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full">
              {registers.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: '总用户数', value: total, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: '活跃用户', value: users.filter(u => u.status === 'active').length, color: 'text-green-600', bg: 'bg-green-50' },
              { label: '已禁用', value: users.filter(u => u.status === 'disabled').length, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索手机号、昵称、地区..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="all">全部状态</option>
            <option value="active">正常</option>
            <option value="disabled">已禁用</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-semibold">用户信息</th>
                <th className="px-4 py-3 text-center font-semibold">地区</th>
                <th className="px-4 py-3 text-center font-semibold">询价次数</th>
                <th className="px-4 py-3 text-center font-semibold">注册时间</th>
                <th className="px-4 py-3 text-center font-semibold">最近活跃</th>
                <th className="px-4 py-3 text-center font-semibold">状态</th>
                <th className="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.nickname?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.nickname}</p>
                        <p className="text-xs text-gray-400">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-600">{user.region || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-rose-600">{user.inquiryCount || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-500">{user.createdAt?.slice(0, 10)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-500">{user.lastActive?.slice(0, 10) || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={user.status} type="user" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="查看详情"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-1.5 rounded transition-colors ${
                          user.status === 'active'
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={user.status === 'active' ? '禁用用户' : '启用用户'}
                      >
                        {user.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="编辑用户"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除用户"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">加载中...</p></div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无用户</p></div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">共 {total} 条</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600">{page} / {Math.ceil(total / PAGE_SIZE) || 1}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
        </>
      )}

      {activeTab === 'registers' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <select
                value={filterRegisterStatus}
                onChange={e => { setFilterRegisterStatus(e.target.value); setRegisterPage(1); }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left font-semibold">用户信息</th>
                    <th className="px-4 py-3 text-center font-semibold">手机号</th>
                    <th className="px-4 py-3 text-center font-semibold">注册时间</th>
                    <th className="px-4 py-3 text-center font-semibold">状态</th>
                    <th className="px-4 py-3 text-center font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registers.map(reg => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                            {reg.avatar ? (
                              <img src={reg.avatar} alt={reg.nickname} className="w-full h-full object-cover" />
                            ) : (
                              reg.nickname?.[0] || '?'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{reg.nickname || '未设置昵称'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-600">{reg.phone || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">{reg.createdAt?.slice(0, 16) || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {reg.status === 'pending' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium"><Clock size={10} /> 待审核</span>}
                        {reg.status === 'approved' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium"><CheckCircle size={10} /> 已通过</span>}
                        {reg.status === 'rejected' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium"><XCircle size={10} /> 已拒绝</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {reg.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveRegister(reg.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="通过"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => rejectRegister(reg.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="拒绝"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {registerLoading && (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">加载中...</p></div>
              )}
              {!registerLoading && registers.length === 0 && (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无注册申请</p></div>
              )}
              {!registerLoading && registers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">共 {registerTotal} 条</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRegisterPage(p => Math.max(1, p - 1))}
                      disabled={registerPage === 1}
                      className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-600">{registerPage} / {Math.ceil(registerTotal / PAGE_SIZE) || 1}</span>
                    <button
                      onClick={() => setRegisterPage(p => p + 1)}
                      disabled={registerPage >= Math.ceil(registerTotal / PAGE_SIZE)}
                      className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">用户详情</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.nickname?.[0] || '?'}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{selectedUser.nickname}</p>
                  <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                  <StatusBadge status={selectedUser.status} type="user" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                {[
                  { label: '注册时间', value: selectedUser.createdAt?.slice(0, 16) || '—' },
                  { label: '最近活跃', value: selectedUser.lastActive?.slice(0, 16) || '—' },
                  { label: '注册地区', value: selectedUser.region || '—' },
                  { label: '注册IP', value: selectedUser.registerIp || '—' },
                  { label: '累计询价', value: `${selectedUser.inquiryCount || 0} 次` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">{editingUser ? '编辑用户' : '添加用户'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">手机号</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">昵称</label>
                <input
                  type="text"
                  value={userForm.nickname}
                  onChange={e => setUserForm({ ...userForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="请输入昵称"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">地区</label>
                <input
                  type="text"
                  value={userForm.region}
                  onChange={e => setUserForm({ ...userForm, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="请输入地区"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">头像URL</label>
                <input
                  type="text"
                  value={userForm.avatar}
                  onChange={e => setUserForm({ ...userForm, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="请输入头像URL"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}