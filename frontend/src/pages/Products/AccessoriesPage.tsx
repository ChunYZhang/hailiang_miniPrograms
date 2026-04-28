import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, AlertTriangle, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { Accessory } from '../../types';

const categoryColors: Record<string, string> = {
  headwear: 'bg-pink-100 text-pink-700',
  clothing: 'bg-blue-100 text-blue-700',
  shoes: 'bg-amber-100 text-amber-700',
  props: 'bg-green-100 text-green-700',
  giftbox: 'bg-rose-100 text-rose-700',
};

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Accessory | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const PAGE_SIZE = 8;
  const CATEGORIES = ['headwear', 'clothing', 'shoes', 'props', 'giftbox'];

  const fetchAccessories = async () => {
    setLoading(true);
    try {
      const res = await api.accessory.list({ keyword: search, category: filterCategory === 'all' ? undefined : filterCategory, page, page_size: PAGE_SIZE });
      setAccessories(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取配饰列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      const res = await api.accessory.list({ keyword: '', page: 1, page_size: 1000 });
      const allAccessories = res.data || [];
      const counts: Record<string, number> = { all: allAccessories.length };
      CATEGORIES.forEach(cat => {
        counts[cat] = allAccessories.filter(a => a.category === cat).length;
      });
      setCategoryCounts(counts);
    } catch (err) {
      console.error('获取分类统计失败', err);
    }
  };

  useEffect(() => {
    fetchAccessories();
    fetchCategoryCounts();
  }, [search, filterCategory, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.accessory.toggleStatus(id);
      fetchAccessories();
    } catch (err) {
      alert('操作失败');
    }
  };

  const toggleHot = async (id: string) => {
    try {
      await api.accessory.toggleHot(id);
      fetchAccessories();
    } catch (err) {
      alert('操作失败');
    }
  };

  const deleteAccessory = async (id: string) => {
    if (!confirm('确认删除该配饰？')) return;
    try {
      await api.accessory.delete(id);
      fetchAccessories();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div>
      <PageHeader
        title="配饰管理"
        subtitle={`共 ${categoryCounts.all || 0} 款配饰`}
        actions={
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> 新增配饰
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="relative max-w-xs flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索配饰名称..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === 'all' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              全部分类 ({categoryCounts.all || 0})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat === 'headwear' ? '头饰' : cat === 'clothing' ? '衣服' : cat === 'shoes' ? '鞋子' : cat === 'props' ? '道具' : '礼盒'} ({categoryCounts[cat] || 0})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-semibold">配饰信息</th>
                <th className="px-4 py-3 text-center font-semibold">分类</th>
                <th className="px-4 py-3 text-center font-semibold">系列</th>
                <th className="px-4 py-3 text-right font-semibold">价格</th>
                <th className="px-4 py-3 text-center font-semibold">库存</th>
                <th className="px-4 py-3 text-center font-semibold">浏览量</th>
                <th className="px-4 py-3 text-center font-semibold">状态</th>
                <th className="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accessories.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={item.images[0] || 'https://via.placeholder.com/48'} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.material}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category] || 'bg-gray-100 text-gray-600'}`}>
                      {item.category === 'headwear' ? '头饰' : item.category === 'clothing' ? '衣服' : item.category === 'shoes' ? '鞋子' : item.category === 'props' ? '道具' : '礼盒'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.series || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-rose-600">¥{item.price}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-semibold ${item.stock <= item.lowStockThreshold ? 'text-red-500' : 'text-gray-700'}`}>
                        {item.stock}
                      </span>
                      {item.stock <= item.lowStockThreshold && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-500 mt-0.5">
                          <AlertTriangle size={10} /> 库存不足
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-500">{item.views}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.status} type="product" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditingItem(item); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => toggleHot(item.id)}
                        className={`p-1.5 rounded transition-colors ${item.isHot ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
                        title={item.isHot ? '取消热门' : '设为热门'}
                      >
                        <Star size={14} fill={item.isHot ? '#f59e0b' : 'none'} />
                      </button>
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      >
                        {item.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => deleteAccessory(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
          {!loading && accessories.length === 0 && (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
          )}
          {!loading && accessories.length > 0 && (
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
        <AccessoryFormModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              const payload = { ...data, price: Number(data.price) || 0 };
              if (editingItem) {
                await api.accessory.update({ ...payload, id: editingItem.id });
              } else {
                await api.accessory.create(payload);
              }
              setShowModal(false);
              fetchAccessories();
            } catch (err: any) {
              alert(err.message || '保存失败');
            }
          }}
        />
      )}
    </div>
  );
}

function AccessoryFormModal({ item, onClose, onSave }: {
  item: Accessory | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'headwear',
    series: item?.series || '',
    price: item?.price ?? '',
    stock: item?.stock || 0,
    lowStockThreshold: item?.lowStockThreshold || 20,
    material: item?.material || '',
    status: item?.status || 'active',
    isHot: item?.isHot || false,
    description: item?.description || '',
    images: item?.images || [],
  });
  const [uploading, setUploading] = useState(false);
  const [seriesList, setSeriesList] = useState<{id: string; name: string; type: string}[]>([]);

  // 获取系列列表
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await api.series.list();
        // 过滤出配饰系列和通用系列
        const filtered = (res.data || []).filter((s: any) => s.type === 'accessory' || s.type === 'both');
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
    } catch {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{item ? '编辑配饰' : '新增配饰'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">配饰名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="请输入配饰名称"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">分类</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="headwear">头饰</option>
                <option value="clothing">衣服</option>
                <option value="shoes">鞋子</option>
                <option value="props">道具</option>
                <option value="giftbox">礼盒包装</option>
              </select>
            </div>
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">价格 (¥)</label>
              <input type="text" inputMode="decimal" value={form.price} onChange={e => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setForm({ ...form, price: val });
                }
              }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">库存</label>
              <input type="text" inputMode="numeric" value={form.stock} onChange={e => {
                const val = e.target.value;
                if (/^\d*$/.test(val) || val === '') {
                  setForm({ ...form, stock: val === '' ? 0 : parseInt(val, 10) });
                }
              }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">预警阈值</label>
              <input type="text" inputMode="numeric" value={form.lowStockThreshold} onChange={e => {
                const val = e.target.value;
                if (/^\d*$/.test(val) || val === '') {
                  setForm({ ...form, lowStockThreshold: val === '' ? 0 : parseInt(val, 10) });
                }
              }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">材质</label>
            <input type="text" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" placeholder="如：蕾丝+金属" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">状态</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
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
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">配饰图片</label>
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
            <label className="text-xs font-medium text-gray-600 mb-1 block">详细描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button
            onClick={() => form.name.trim() && onSave(form)}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
