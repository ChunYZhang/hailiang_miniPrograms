import { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Label, LabelList
} from 'recharts';
import PageHeader from '../../components/Common/PageHeader';
import { api } from '../../services/api';

const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];

const tabs = [
  { id: 'inquiry', label: '询价报表' },
  { id: 'product', label: '商品流量' },
  { id: 'user', label: '用户报表' },
  { id: 'region', label: '地区分析' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inquiry');
  const [dateRange, setDateRange] = useState('month');
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = dateRange === 'day' ? 1 : dateRange === 'week' ? 7 : 30;
    api.report.chartData(days).then(res => {
      setChartData(res.data);
    }).catch(err => {
      console.error('获取报表数据失败', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [dateRange]);

  const dailyInquiries = chartData?.dailyInquiries || [];
  const dollViews = chartData?.dollViews || [];
  const accessoryUsage = chartData?.accessoryUsage || [];
  const userRegistrations = chartData?.userRegistrations || [];
  const regionData = chartData?.regionData || [];

  const totalInquiries = dailyInquiries.reduce((s: number, d: any) => s + (d.count || 0), 0);
  const totalAmount = dailyInquiries.reduce((s: number, d: any) => s + (d.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="数据报表"
        subtitle="全维度业务数据统计分析"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="day">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
            <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FileDown size={16} /> 导出Excel
            </button>
          </div>
        }
      />

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><p className="text-sm">加载中...</p></div>
      ) : (
        <>
          {activeTab === 'inquiry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: '总询价数', value: totalInquiries, sub: '全部状态' },
                  { label: '总报价金额', value: `¥${(totalAmount || 0).toLocaleString()}`, sub: '含全部状态' },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">询价单数量趋势</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dailyInquiries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} name="询价数" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">报价金额趋势</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyInquiries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => [`¥${value}`, '报价金额']} />
                      <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} name="报价金额" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'product' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">娃娃浏览量排行</h3>
                  {dollViews.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={dollViews} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                        <Tooltip />
                        <Bar dataKey="views" fill="#f43f5e" radius={[0, 4, 4, 0]} name="浏览量" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">配饰使用率 TOP6</h3>
                  {accessoryUsage.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={accessoryUsage}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: '#999', strokeDasharray: '3 3' }}
                        >
                          {accessoryUsage.map((_: any, index: number) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: '总注册用户', value: chartData?.totalUsers || 0 },
                  { label: '活跃用户', value: chartData?.activeUsers || 0 },
                  { label: '月新增用户', value: chartData?.monthlyNewUsers || 0 },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">用户注册趋势</h3>
                  {userRegistrations.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={userRegistrations}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="注册人数" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'region' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">各省份用户分布</h3>
                  {regionData.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={regionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={45} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="用户数" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">地区占比</h3>
                  {regionData.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={regionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="count"
                          nameKey="region"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: '#999', strokeDasharray: '3 3' }}
                        >
                          {regionData.map((_: any, index: number) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {regionData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">各地区详细数据</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <th className="px-4 py-3 text-left font-semibold">地区</th>
                          <th className="px-4 py-3 text-right font-semibold">用户数</th>
                          <th className="px-4 py-3 text-right font-semibold">占比</th>
                          <th className="px-4 py-3 text-center font-semibold">分布</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {regionData.map((item: any, idx: number) => {
                          const total = regionData.reduce((s: number, r: any) => s + r.count, 0);
                          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                          return (
                            <tr key={item.region} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                  <span className="text-sm font-medium text-gray-800">{item.region}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{item.count}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-500">{pct}%</td>
                              <td className="px-4 py-3">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden max-w-32 ml-auto">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}