import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, AlertTriangle, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { Doll } from '../../types';

interface AccessoryItem {
  id: string;
  name: string;
  price: number;
  images?: string[];
  series?: string;
  category?: string;
}

export default function DollsPage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeries, setFilterSeries] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDoll, setEditingDoll] = useState<Doll | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [seriesList, setSeriesList] = useState<{id: string; name: string; type: string}[]>([]);
  const [seriesCounts, setSeriesCounts] = useState<Record<string, number>>({});
  const PAGE_SIZE = 8;

  const fetchDolls = async () => {
    setLoading(true);
    try {
      const res = await api.doll.list({ keyword: search, status: filterStatus === 'all' ? undefined : filterStatus, series: filterSeries === 'all' ? undefined : filterSeries, page, page_size: PAGE_SIZE });
      setDolls(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取娃娃列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeriesCounts = async () => {
    try {
      const [seriesRes, dollRes] = await Promise.all([
        api.series.list(),
        api.doll.list({ keyword: '', page: 1, page_size: 1000 }),
      ]);
      const dollSeries = (seriesRes.data || []).filter((s: any) => s.type === 'doll' || s.type === 'both');
      setSeriesList(dollSeries);
      const allDolls = dollRes.data || [];
      const counts: Record<string, number> = { all: allDolls.length };
      dollSeries.forEach(s => {
        counts[s.name] = allDolls.filter(d => d.series === s.name).length;
      });
      setSeriesCounts(counts);
    } catch (err) {
      console.error('获取系列统计失败', err);
    }
  };

  useEffect(() => {
    fetchDolls();
    fetchSeriesCounts();
  }, [search, filterStatus, filterSeries, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.doll.toggleStatus(id);
      fetchDolls();
    } catch (err) {
      alert('操作失败');
    }
  };

  const toggleHot = async (id: string) => {
    try {
      await api.doll.toggleHot(id);
      fetchDolls();
    } catch (err) {
      alert('操作失败');
    }
  };

  const deleteDoll = async (id: string) => {
    if (!confirm('确认删除该娃娃？')) return;
    try {
      await api.doll.delete(id);
      fetchDolls();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div>
      <PageHeader
        title="娃娃管理"
        subtitle={`共 ${seriesCounts.all || 0} 款娃娃`}
        actions={
          <button
            onClick={() => { setEditingDoll(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> 新增娃娃
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索名称、系列..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="all">全部状态</option>
            <option value="active">已上架</option>
            <option value="inactive">已下架</option>
          </select>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterSeries('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterSeries === 'all' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              全部系列 ({seriesCounts.all || 0})
            </button>
            {seriesList.map(s => (
              <button
                key={s.id}
                onClick={() => setFilterSeries(s.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterSeries === s.name ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s.name} ({seriesCounts[s.name] || 0})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-semibold">娃娃信息</th>
                <th className="px-4 py-3 text-left font-semibold">系列</th>
                <th className="px-4 py-3 text-right font-semibold">售价</th>
                <th className="px-4 py-3 text-center font-semibold">库存</th>
                <th className="px-4 py-3 text-center font-semibold">浏览/询价</th>
                <th className="px-4 py-3 text-center font-semibold">默认配饰</th>
                <th className="px-4 py-3 text-center font-semibold">状态</th>
                <th className="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dolls.map(doll => (
                <tr key={doll.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={doll.images?.[0] || 'https://via.placeholder.com/48'} alt={doll.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{doll.name}</p>
                        <p className="text-xs text-gray-400">{doll.size} · {doll.material}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{doll.series}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-rose-600">¥{doll.price}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-semibold ${doll.stock <= doll.lowStockThreshold ? 'text-red-500' : 'text-gray-700'}`}>
                        {doll.stock}
                      </span>
                      {doll.stock <= doll.lowStockThreshold && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-500 mt-0.5">
                          <AlertTriangle size={10} /> 库存不足
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-500">{doll.views} / {doll.inquiries}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-600 max-w-[120px] truncate block" title={doll.defaultAccessory || ''}>
                      {doll.defaultAccessory ? (doll.defaultAccessory.length > 15 ? doll.defaultAccessory.slice(0, 15) + '...' : doll.defaultAccessory) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={doll.status} type="product" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditingDoll(doll); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => toggleHot(doll.id)}
                        className={`p-1.5 rounded transition-colors ${doll.isHot ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
                        title={doll.isHot ? '取消热门' : '设为热门'}
                      >
                        <Star size={14} fill={doll.isHot ? '#f59e0b' : 'none'} />
                      </button>
                      <button
                        onClick={() => toggleStatus(doll.id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title={doll.status === 'active' ? '下架' : '上架'}
                      >
                        {doll.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => deleteDoll(doll.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除"
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
          {!loading && dolls.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">暂无数据</p>
            </div>
          )}
          {!loading && dolls.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">共 {total} 条</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-700">{page} / {Math.ceil(total / PAGE_SIZE) || 1}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <DollFormModal
          doll={editingDoll}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              const payload = { ...data, price: Number(data.price) || 0 };
              if (editingDoll) {
                await api.doll.update({ ...payload, id: editingDoll.id });
              } else {
                await api.doll.create(payload);
              }
              setShowModal(false);
              fetchDolls();
            } catch (err: any) {
              alert(err.message || '保存失败');
            }
          }}
        />
      )}
    </div>
  );
}

interface SelectedAccessory {
  id: string;
  name: string;
  price: number;
  images?: string[];
  series?: string;
}

function DollFormModal({ doll, onClose, onSave }: {
  doll: Doll | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: doll?.name || '',
    price: doll?.price ?? '',
    material: doll?.material || '',
    size: doll?.size || '',
    stock: doll?.stock || 0,
    series: doll?.series || '',
    patentNo: doll?.patentNo || '',
    lowStockThreshold: doll?.lowStockThreshold || 10,
    minQuantity: doll?.minQuantity || 1,
    status: doll?.status || 'active',
    isHot: doll?.isHot || false,
    description: doll?.description || '',
    images: doll?.images || [],
    defaultAccessory: doll?.defaultAccessory || '',
    selectedAccessories: (doll as any)?.selectedAccessories || [],
  });

  const [uploading, setUploading] = useState(false);
  const [seriesList, setSeriesList] = useState<{id: string; name: string; type: string}[]>([]);
  const [showAccModal, setShowAccModal] = useState(false);
  const [allAccessories, setAllAccessories] = useState<AccessoryItem[]>([]);
  const [accKeyword, setAccKeyword] = useState('');
  const [accCategory, setAccCategory] = useState('');
  const [accSeries, setAccSeries] = useState('');
  const [accLoading, setAccLoading] = useState(false);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await api.series.list();
        const filtered = (res.data || []).filter((s: any) => s.type === 'doll' || s.type === 'both');
        setSeriesList(filtered);
      } catch (err) {
        console.error('获取系列列表失败', err);
      }
    };
    fetchSeries();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.upload.image(file);
      setForm(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (err) {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const openAccModal = async () => {
    setShowAccModal(true);
    setAccLoading(true);
    try {
      const res = await api.accessory.list({ page_size: 500 });
      setAllAccessories(res.data || []);
    } catch (err) {
      console.error('获取配饰列表失败', err);
    } finally {
      setAccLoading(false);
    }
  };

  const toggleAccessory = (acc: AccessoryItem) => {
    setForm(prev => {
      const exists = prev.selectedAccessories.find((a: any) => a.id === acc.id);
      if (exists) {
        return { ...prev, selectedAccessories: prev.selectedAccessories.filter((a: any) => a.id !== acc.id) };
      } else {
        return { ...prev, selectedAccessories: [...prev.selectedAccessories, { id: acc.id, name: acc.name, price: acc.price, images: acc.images, series: acc.series }] };
      }
    });
  };

  const isAccSelected = (accId: string) => form.selectedAccessories.some((a: any) => a.id === accId);

  const filteredAccessories = allAccessories.filter(acc => {
    if (accKeyword && !acc.name.toLowerCase().includes(accKeyword.toLowerCase())) return false;
    if (accCategory && acc.category !== accCategory) return false;
    if (accSeries && acc.series !== accSeries) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{doll ? '编辑娃娃' : '新增娃娃'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">娃娃名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="请输入娃娃名称"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">系列</label>
              <select
                value={form.series}
                onChange={e => setForm({ ...form, series: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">请选择系列</option>
                {seriesList.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">售价 (¥)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setForm({ ...form, price: val });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">库存数量</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.stock}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) || val === '') {
                    setForm({ ...form, stock: val === '' ? 0 : parseInt(val, 10) });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">预警阈值</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.lowStockThreshold}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) || val === '') {
                    setForm({ ...form, lowStockThreshold: val === '' ? 0 : parseInt(val, 10) });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">起购数量</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.minQuantity}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) || val === '') {
                    setForm({ ...form, minQuantity: val === '' ? 1 : parseInt(val, 10) });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">材质</label>
              <input
                type="text"
                value={form.material}
                onChange={e => setForm({ ...form, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="如：优质棉麻布料"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">尺寸</label>
              <input
                type="text"
                value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="如：45cm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">专利编号</label>
            <input
              type="text"
              value={form.patentNo}
              onChange={e => setForm({ ...form, patentNo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="如：ZL202310001234"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">商品状态</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="active">上架</option>
                <option value="inactive">下架</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">热门推荐</label>
              <select
                value={form.isHot ? '1' : '0'}
                onChange={e => setForm({ ...form, isHot: e.target.value === '1' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="0">否</option>
                <option value="1">是</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">默认配饰</label>
            <input
              type="text"
              value={form.defaultAccessory}
              onChange={e => setForm({ ...form, defaultAccessory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="如：挂链、魔法棒（多个用顿号分隔）"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">搭配配饰</label>
              <button
                type="button"
                onClick={openAccModal}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                + 选择配饰
              </button>
            </div>
            {form.selectedAccessories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.selectedAccessories.map((acc: any) => (
                  <div key={acc.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 pr-3">
                    <img src={acc.images?.[0] || 'https://via.placeholder.com/40'} alt={acc.name} className="w-8 h-8 rounded object-cover" />
                    <div className="text-xs">
                      <p className="text-gray-700 font-medium">{acc.name}</p>
                      <p className="text-gray-400">¥{acc.price}</p>
                    </div>
                    <button
                      onClick={() => toggleAccessory(acc)}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
                暂未选择配饰
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">娃娃图片</label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 w-5 h-5 bg-black/50 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-rose-400 transition-colors">
                {uploading ? (
                  <span className="text-xs text-gray-400">上传中...</span>
                ) : (
                  <>
                    <span className="text-xl text-gray-400">+</span>
                    <span className="text-xs text-gray-400">上传</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">详细介绍</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              placeholder="请输入商品详细介绍..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </button>
          <button
            onClick={() => form.name.trim() && onSave(form)}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      {/* 配饰选择弹窗 */}
      {showAccModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">选择配饰</h3>
              <button onClick={() => setShowAccModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={accKeyword}
                  onChange={e => setAccKeyword(e.target.value)}
                  placeholder="搜索配饰名称..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <select
                  value={accCategory}
                  onChange={e => setAccCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <option value="">全部分类</option>
                  <option value="headwear">头饰</option>
                  <option value="clothing">服装</option>
                  <option value="shoes">鞋子</option>
                  <option value="props">道具</option>
                  <option value="giftbox">礼盒</option>
                </select>
                <select
                  value={accSeries}
                  onChange={e => setAccSeries(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <option value="">全部系列</option>
                  {seriesList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {accLoading ? (
                <div className="text-center py-8 text-gray-400">加载中...</div>
              ) : filteredAccessories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">暂无配饰</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredAccessories.map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => toggleAccessory(acc)}
                      className={`border rounded-lg p-2 cursor-pointer transition-colors ${isAccSelected(acc.id) ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-rose-300'}`}
                    >
                      <div className="relative">
                        <img src={acc.images?.[0] || 'https://via.placeholder.com/120'} alt={acc.name} className="w-full aspect-square rounded object-cover" />
                        {isAccSelected(acc.id) && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-800 mt-1 truncate">{acc.name}</p>
                      <p className="text-xs text-gray-400">{acc.series || '基础款'}</p>
                      <p className="text-xs text-rose-500 font-medium">¥{acc.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowAccModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
