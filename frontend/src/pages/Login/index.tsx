import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, Lock, User } from 'lucide-react';
import { api } from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    // 获取公司名称用于登录页显示
    api.company.get().then(res => {
      setCompanyName(res.data?.name || '公司名称');
    }).catch(() => {
      setCompanyName('公司名称');
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(form.username, form.password);
      sessionStorage.setItem('admin_id', data.id);
      sessionStorage.setItem('admin_username', data.username);
      sessionStorage.setItem('admin_role', data.role);
      
      // 添加一个小延迟，确保cookie被设置
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '账号或密码错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30">
            <Heart size={28} className="text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{companyName || '公司名称'}</h1>
          <p className="text-slate-400 text-sm mt-1">询价管理后台</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">管理员登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">账号</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="请输入账号"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">密码</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-9 pr-10 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-2.5 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/50 text-white font-semibold rounded-xl transition-all text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                登录中...
              </span>
            ) : '登录'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            测试账号：admin / admin123
          </p>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2024 {companyName || '公司名称'} · 管理系统
        </p>
      </div>
    </div>
  );
}
