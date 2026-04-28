import { useState, useEffect, useMemo } from 'react';
import { Plus, Star, Edit, Trash2, X, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import { api } from '../../services/api';
import type { OutfitTemplate, Doll, Accessory } from '../../types';

interface AccessoryItem {
  id: string;
  name: string;
  price: number;
}

interface FormState {
  name: string;
  dollId: string;
  dollName: string;
  dollSeries: string;
  accessories: AccessoryItem[];
  coverImage: string;
  isHot: boolean;
  totalPrice?: number;
}

const emptyForm: FormState = {
  name: '',
  dollId: '',
  dollName: '',
  dollSeries: '',
  accessories: [],
  coverImage: '',
  isHot: false,
};

export default function OutfitsPage() {
  const [templates, setTemplates] = useState<OutfitTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutfitTemplate | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 6;

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.outfit.list({ page, page_size: PAGE_SIZE });
      setTemplates(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取搭配方案失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page]);

  const toggleHot = async (id: string) => {
    try {
      await api.outfit.toggleHot(id);
      fetchTemplates();
    } catch (err) {
      alert('操作失败');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('确认删除该搭配方案？')) return;
    try {
      await api.outfit.delete(id);
      fetchTemplates();
    } catch (err) {
      alert('删除失败');
    }
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const openEdit = (template: OutfitTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleSave = async (form: FormState) => {
    try {
      const payload = { ...form, totalPrice: form.totalPrice || 0 };
      if (editingTemplate) {
        await api.outfit.update({ ...payload, id: editingTemplate.id });
      } else {
        await api.outfit.create(payload);
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div>
      <PageHeader
        title="搭配方案管理"
        subtitle={`共 ${templates.length} 套预设方案`}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> 新建方案
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-20 text-gray-400"><p className="text-sm">加载中...</p></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">暂无搭配方案</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img src={template.coverImage || 'https://via.placeholder.com/400x200'} alt={template.name} className="w-full h-full object-cover" />
                {template.isHot && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    <Star size={10} fill="currentColor" /> 热门
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => toggleHot(template.id)}
                    className={`p-1.5 rounded-lg transition-colors ${template.isHot ? 'bg-rose-100 text-rose-600' : 'bg-white/80 text-gray-500 hover:text-rose-500'}`}
                    title={template.isHot ? '取消热门' : '设为热门'}
                  >
                    <Star size={14} fill={template.isHot ? '#f59e0b' : 'none'} />
                  </button>
                  <button
                    onClick={() => openEdit(template)}
                    className="p-1.5 bg-white/80 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-1.5 bg-white/80 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{template.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{template.dollSeries || '基础款'}：{template.dollName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">¥{template.totalPrice}</p>
                    <p className="text-xs text-gray-400">已使用 {template.usageCount || 0} 次</p>
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-3 mt-2">
                  <p className="text-xs text-gray-500 mb-1.5">配饰清单</p>
                  <div className="flex flex-wrap gap-1">
                    {template.accessories.map(acc => (
                      <span key={acc.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {acc.name} +¥{acc.price}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>创建于 {template.createdAt?.slice(0, 10) || '—'}</span>
                  <span className="text-rose-500 font-medium">{template.accessories.length} 件配饰</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!loading && templates.length > 0 && (
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
        </>
      )}

      {showModal && (
        <OutfitFormModal
          template={editingTemplate}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function OutfitFormModal({ template, onClose, onSave }: {
  template: OutfitTemplate | null;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (template) {
      return {
        name: template.name,
        dollId: template.dollId,
        dollName: template.dollName,
        dollSeries: template.dollSeries || '',
        accessories: template.accessories.map(a => ({ id: a.id, name: a.name, price: a.price })),
        coverImage: template.coverImage,
        isHot: template.isHot,
      };
    }
    return { ...emptyForm };
  });

  const [dolls, setDolls] = useState<Doll[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dollSearch, setDollSearch] = useState('');
  const [dollSeriesFilter, setDollSeriesFilter] = useState('all');
  const [accSearch, setAccSearch] = useState('');
  const [accCategoryFilter, setAccCategoryFilter] = useState('all');
  const [accSeriesFilter, setAccSeriesFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      api.doll.list(),
      api.accessory.list(),
      api.series.list(),
      api.category.list(),
    ]).then(([dollRes, accRes, seriesRes, catRes]) => {
      setDolls(dollRes.data || []);
      setAccessories(accRes.data || []);
      setSeriesList(seriesRes.data || []);
      setCategories(catRes.data || []);
    }).catch(err => {
      console.error('获取数据失败', err);
    }).finally(() => {
      setLoadingData(false);
    });
  }, []);

  const dollSeriesOptions = seriesList.filter((s: any) => s.status === 'active' && (s.type === 'doll' || s.type === 'both'));
  const accSeriesOptions = seriesList.filter((s: any) => s.status === 'active' && (s.type === 'accessory' || s.type === 'both'));

  const filteredDolls = dolls.filter(d => {
    if (d.status !== 'active') return false;
    const matchSearch = !dollSearch || d.name.includes(dollSearch);
    const matchSeries = dollSeriesFilter === 'all' || d.series === dollSeriesFilter;
    return matchSearch && matchSeries;
  });

  // 构建显示列表：始终包含已选娃娃（从完整dolls列表中获取）
  const displayedDolls = useMemo(() => {
    if (!form.dollId) return filteredDolls;
    const selectedDoll = dolls.find(d => d.id === form.dollId);
    if (!selectedDoll) return filteredDolls;
    // 如果已选娃娃不在 filteredDolls 中，把它加到最前面
    const inFiltered = filteredDolls.some(d => d.id === form.dollId);
    if (inFiltered) return filteredDolls;
    return [selectedDoll, ...filteredDolls];
  }, [form.dollId, filteredDolls, dolls]);

  const filteredAccessories = accessories.filter(a => {
    if (a.status !== 'active') return false;
    const matchSearch = !accSearch || a.name.includes(accSearch);
    const matchCategory = accCategoryFilter === 'all' || a.category === accCategoryFilter;
    const matchSeries = accSeriesFilter === 'all' || a.series === accSeriesFilter;
    return matchSearch && matchCategory && matchSeries;
  });

  // selectedDoll 优先从 displayedDolls 找，找不到时如果 form.dollId 存在则构造一个虚拟对象
  const selectedDoll = displayedDolls.find(d => d.id === form.dollId) || (form.dollId ? {
    id: form.dollId,
    name: form.dollName || '未知娃娃',
    price: 0,
    images: form.coverImage ? [form.coverImage] : [],
  } : null);

  const handleDollChange = (dollId: string) => {
    const doll = dolls.find(d => d.id === dollId);
    setForm(prev => ({
      ...prev,
      dollId,
      dollName: doll?.name ?? '',
      dollSeries: doll?.series ?? '',
      coverImage: doll?.images?.[0] ?? prev.coverImage,
    }));
  };

  const toggleAccessory = (acc: AccessoryItem) => {
    setForm(prev => {
      const exists = prev.accessories.find(a => a.id === acc.id);
      return {
        ...prev,
        accessories: exists
          ? prev.accessories.filter(a => a.id !== acc.id)
          : [...prev.accessories, acc],
      };
    });
  };

  const isAccSelected = (id: string) => form.accessories.some(a => a.id === id);

  // 使用整数计算避免浮点数精度问题（以分为单位）
  const totalPrice = (() => {
    const dollPrice = Math.round((selectedDoll?.price ?? 0) * 100);
    const accTotal = form.accessories.reduce((s, a) => s + Math.round((Number(a.price) || 0) * 100), 0);
    return (dollPrice + accTotal) / 100;
  })();

  const canSave = form.name.trim() && form.dollId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-800">
            {template ? '编辑搭配方案' : '新建搭配方案'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">方案名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="如：公主礼服全套"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">选择基础娃娃 *</label>
              {form.dollId && (
                <span className="text-xs text-rose-500 font-medium">已选：{form.dollName}</span>
              )}
            </div>
            {loadingData ? (
              <p className="text-xs text-gray-400 py-3 text-center">加载中...</p>
            ) : (
              <>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <div className="relative flex-1 min-w-0">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={dollSearch}
                      onChange={e => setDollSearch(e.target.value)}
                      placeholder="搜索娃娃名称..."
                      className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <select
                    value={dollSeriesFilter}
                    onChange={e => setDollSeriesFilter(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    <option value="all">全部系列</option>
                    {dollSeriesOptions.map((s: any) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {displayedDolls.map(doll => (
                    <button
                      key={doll.id}
                      type="button"
                      onClick={() => handleDollChange(doll.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left ${
                        form.dollId === doll.id
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <img src={doll.images[0] || 'https://via.placeholder.com/40'} alt={doll.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-gray-800 truncate">{doll.name}</p>
                        <p className="text-xs text-gray-400 truncate">{doll.series}</p>
                        <p className="text-xs text-rose-600 font-bold">¥{doll.price}</p>
                      </div>
                      {form.dollId === doll.id && (
                        <Check size={13} className="text-rose-500 flex-shrink-0 ml-auto" />
                      )}
                    </button>
                  ))}
                  {displayedDolls.length === 0 && (
                    <p className="text-xs text-gray-400 py-3 col-span-3 text-center">暂无匹配的娃娃</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">搭配配饰</label>
              {form.accessories.length > 0 && (
                <span className="text-xs text-rose-500 font-medium">已选 {form.accessories.length} 件</span>
              )}
            </div>
            {loadingData ? (
              <p className="text-xs text-gray-400 py-3 text-center">加载中...</p>
            ) : (
              <>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <div className="relative flex-1 min-w-0">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={accSearch}
                      onChange={e => setAccSearch(e.target.value)}
                      placeholder="搜索配饰名称..."
                      className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <select
                    value={accCategoryFilter}
                    onChange={e => setAccCategoryFilter(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    <option value="all">全部分类</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.value}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={accSeriesFilter}
                    onChange={e => setAccSeriesFilter(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    <option value="all">全部系列</option>
                    {accSeriesOptions.map((s: any) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {filteredAccessories.map(acc => {
                    const selected = isAccSelected(acc.id);
                    const catLabel = categories.find((c: any) => c.value === acc.category)?.name || acc.category;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleAccessory({ id: acc.id, name: acc.name, price: acc.price })}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left ${
                          selected ? 'border-rose-400 bg-rose-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <img src={acc.images[0] || 'https://via.placeholder.com/40'} alt={acc.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-semibold text-gray-800 truncate">{acc.name}</p>
                          <p className="text-xs text-gray-400 truncate">{catLabel} · {acc.series || '—'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-rose-600">+¥{acc.price}</p>
                          {selected && <Check size={12} className="text-rose-500 ml-auto mt-0.5" />}
                        </div>
                      </button>
                    );
                  })}
                  {filteredAccessories.length === 0 && (
                    <p className="text-xs text-gray-400 py-3 col-span-2 text-center">暂无匹配的配饰</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div
              onClick={() => setForm(prev => ({ ...prev, isHot: !prev.isHot }))}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={`w-9 h-5 rounded-full transition-colors ${form.isHot ? 'bg-rose-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${form.isHot ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">设为热门方案</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">预计总报价</p>
              <p className="text-xl font-bold text-rose-600">¥{totalPrice}</p>
            </div>
          </div>

          {(selectedDoll || form.accessories.length > 0) && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">已选清单</p>
              <div className="space-y-1">
                {selectedDoll && (
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>{selectedDoll.name}（娃娃）</span>
                    <span className="font-semibold">¥{selectedDoll.price}</span>
                  </div>
                )}
                {form.accessories.map(acc => (
                  <div key={acc.id} className="flex justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-rose-300 rounded-full" />
                      {acc.name}
                    </span>
                    <span>+¥{acc.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => canSave && onSave({ ...form, totalPrice })}
            disabled={!canSave}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {template ? '保存修改' : '创建方案'}
          </button>
        </div>
      </div>
    </div>
  );
}