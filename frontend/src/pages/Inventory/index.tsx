import { useState, useEffect } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Filter } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { InventoryRecord } from '../../types';

export default function InventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, recordsRes] = await Promise.all([
        api.inventory.overview(),
        api.inventory.records(),
      ]);
      setProducts(overviewRes.data?.products || []);
      setRecords(recordsRes.data || []);
    } catch (err) {
      console.error('获取数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = records.filter(r => filterType === 'all' || r.type === filterType);
  const lowStockItems = products.filter((p: any) => p.stock <= p.threshold);

  const totalIn = records.filter(r => r.type === 'in').reduce((s, r) => s + r.quantity, 0);

  return (
    <div>
      <PageHeader
        title="进销存管理"
        subtitle="库存总览与出入库记录"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> 新增记录
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">娃娃品类</p>
          <p className="text-2xl font-bold text-gray-900">{products.filter((p: any) => p.type === 'doll').length}</p>
          <p className="text-xs text-gray-400 mt-1">总库存 {products.filter((p: any) => p.type === 'doll').reduce((s: number, p: any) => s + p.stock, 0)} 件</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">配饰品类</p>
          <p className="text-2xl font-bold text-gray-900">{products.filter((p: any) => p.type === 'accessory').length}</p>
          <p className="text-xs text-gray-400 mt-1">总库存 {products.filter((p: any) => p.type === 'accessory').reduce((s: number, p: any) => s + p.stock, 0)} 件</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">本月入库</p>
          <p className="text-2xl font-bold text-green-600">{totalIn}</p>
          <p className="text-xs text-gray-400 mt-1">{records.filter(r => r.type === 'in').length} 笔记录</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">库存预警</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockItems.length}</p>
          <p className="text-xs text-gray-400 mt-1">需及时补货</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          库存总览
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'records' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          出入库明细
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {lowStockItems.length > 0 && (
            <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <span className="text-amber-600 text-xs font-medium">库存预警：以下商品库存低于预警阈值，请及时补货</span>
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">加载中...</p></div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">商品信息</th>
                  <th className="px-4 py-3 text-center font-semibold">类型</th>
                  <th className="px-4 py-3 text-center font-semibold">当前库存</th>
                  <th className="px-4 py-3 text-center font-semibold">预警阈值</th>
                  <th className="px-4 py-3 text-center font-semibold">库存状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p: any) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.stock <= p.threshold ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.series}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'doll' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.type === 'doll' ? '娃娃' : '配饰'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${p.stock <= p.threshold ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-500">{p.threshold}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.stock <= p.threshold ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">库存不足</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">库存充足</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <Filter size={14} className="text-gray-400" />
            {[
              { value: 'all', label: '全部' },
              { value: 'in', label: '入库' },
              { value: 'out', label: '出库' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterType === opt.value ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">商品</th>
                  <th className="px-4 py-3 text-center font-semibold">类型</th>
                  <th className="px-4 py-3 text-center font-semibold">数量</th>
                  <th className="px-4 py-3 text-center font-semibold">操作前/后</th>
                  <th className="px-4 py-3 text-left font-semibold">原因</th>
                  <th className="px-4 py-3 text-center font-semibold">操作人</th>
                  <th className="px-4 py-3 text-center font-semibold">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 font-medium">{record.productName}</p>
                      <p className="text-xs text-gray-400">{record.productType === 'doll' ? '娃娃' : '配饰'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {record.type === 'in' ? (
                          <ArrowDownCircle size={14} className="text-green-500" />
                        ) : (
                          <ArrowUpCircle size={14} className="text-red-500" />
                        )}
                        <StatusBadge status={record.type} type="inventory" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${record.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                        {record.type === 'in' ? '+' : '-'}{record.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-500">{record.balanceBefore} → {record.balanceAfter}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{record.reason}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-500">{record.operator}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-500">{record.createdAt?.slice(0, 16)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <StockRecordModal
          products={products}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              await api.inventory.addRecord(data);
              setShowModal(false);
              fetchData();
            } catch (err: any) {
              alert(err.message || '保存失败');
            }
          }}
        />
      )}
    </div>
  );
}

function StockRecordModal({ products, onClose, onSave }: {
  products: any[];
  onClose: () => void;
  onSave: (data: Partial<InventoryRecord>) => void;
}) {
  const [form, setForm] = useState({
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    productType: products[0]?.type || 'doll',
    type: 'in' as 'in' | 'out',
    quantity: 0,
    reason: '',
  });

  const handleProductChange = (id: string) => {
    const p = products.find((p: any) => p.id === id);
    if (p) setForm(prev => ({ ...prev, productId: p.id, productName: p.name, productType: p.type }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">新增出入库记录</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">选择商品</label>
            <select
              value={form.productId}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.type === 'doll' ? '娃娃' : '配饰'})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">操作类型</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as 'in' | 'out' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="in">入库</option>
                <option value="out">出库</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">数量</label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                min="1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">原因</label>
            <select
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="">请选择原因</option>
              {form.type === 'in' ? (
                <>
                  <option value="生产入库">生产入库</option>
                  <option value="采购入库">采购入库</option>
                  <option value="退货入库">退货入库</option>
                </>
              ) : (
                <>
                  <option value="订单出库">订单出库</option>
                  <option value="损耗出库">损耗出库</option>
                  <option value="盘点调整">盘点调整</option>
                </>
              )}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={() => form.quantity > 0 && form.reason && onSave(form as any)} disabled={!form.quantity || !form.reason} className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-colors">保存</button>
        </div>
      </div>
    </div>
  );
}