import { useState, useEffect } from 'react';
import { Package, Users, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import StatCard from '../../components/Common/StatCard';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';

const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.report.dashboard(),
      api.report.chartData(7),
    ]).then(([dashRes, chartRes]) => {
      setDashboardData(dashRes.data);
      setChartData(chartRes.data);
    }).catch(err => {
      console.error('获取数据失败', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="控制台" subtitle="欢迎回来，以下是今日业务概览" />
        <div className="text-center py-20 text-gray-400"><p className="text-sm">加载中...</p></div>
      </div>
    );
  }

  const pendingInquiries = dashboardData?.pendingInquiries || [];
  const lowStockDolls = dashboardData?.lowStockDolls || [];
  const todayAmount = dashboardData?.todayAmount || 0;
  const totalInquiries = dashboardData?.totalInquiries || 0;
  const monthlyUsers = dashboardData?.monthlyUsers || 0;

  const dailyInquiries = chartData?.dailyInquiries || [];
  const accessoryUsage = chartData?.accessoryUsage || [];
  const dollViews = chartData?.dollViews || [];
  const userRegistrations = chartData?.userRegistrations || [];

  return (
    <div>
      <PageHeader title="控制台" subtitle="欢迎回来，以下是今日业务概览" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="今日询价金额"
          value={`¥${(todayAmount || 0).toLocaleString()}`}
          icon={<TrendingUp size={20} className="text-rose-600" />}
          iconBg="bg-rose-50"
          trend={{ value: dashboardData?.todayAmountTrend || 0, label: '较昨日' }}
        />
        <StatCard
          title="待处理询价单"
          value={pendingInquiries.length}
          subtitle="需要跟进处理"
          icon={<Clock size={20} className="text-amber-600" />}
          iconBg="bg-amber-50"
          trend={{ value: dashboardData?.pendingTrend || 0, label: '较昨日' }}
        />
        <StatCard
          title="本月新增用户"
          value={monthlyUsers}
          icon={<Users size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          trend={{ value: dashboardData?.userTrend || 0, label: '较上月' }}
        />
        <StatCard
          title="询价总单数"
          value={totalInquiries}
          icon={<Package size={20} className="text-green-600" />}
          iconBg="bg-green-50"
          trend={{ value: dashboardData?.inquiryTrend || 0, label: '较上月' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">近7日询价趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyInquiries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} name="询价单数" />
              <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="报价金额(¥)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">配饰使用分布</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={accessoryUsage}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#999', strokeDasharray: '3 3' }}
              >
                {accessoryUsage.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {accessoryUsage.slice(0, 4).map((item: any, index: number) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index] }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">娃娃浏览量排行</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dollViews} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="views" fill="#f43f5e" radius={[0, 4, 4, 0]} name="浏览量" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">用户注册趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userRegistrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="注册人数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">待处理询价单</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {pendingInquiries.length} 条
            </span>
          </div>
          <div className="space-y-3">
            {pendingInquiries.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{order.orderNo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{order.userName} · {order.userPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-rose-600">¥{order.totalAmount}</p>
                  <StatusBadge status={order.status} type="inquiry" />
                </div>
              </div>
            ))}
            {pendingInquiries.length === 0 && (
              <div className="flex flex-col items-center py-8 text-gray-300">
                <CheckCircle size={32} />
                <p className="text-sm mt-2">暂无待处理订单</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">库存预警</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {lowStockDolls.length} 条
            </span>
          </div>
          <div className="space-y-3">
            {lowStockDolls.map((doll: any) => (
              <div key={doll.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={doll.images?.[0] || 'https://via.placeholder.com/36'} alt={doll.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doll.name}</p>
                    <p className="text-xs text-gray-400">{doll.series}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <AlertTriangle size={14} />
                  <span className="text-sm font-semibold">剩余 {doll.stock}</span>
                </div>
              </div>
            ))}
            {lowStockDolls.length === 0 && (
              <div className="flex flex-col items-center py-8 text-gray-300">
                <CheckCircle size={32} />
                <p className="text-sm mt-2">库存充足</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}