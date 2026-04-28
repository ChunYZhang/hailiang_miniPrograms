import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { SeriesItem, CategoryItem } from '../../types';

const typeLabels: Record<string, string> = {
  doll: '娃娃系列',
  accessory: '配饰系列',
  both: '通用',
};
const typeColors: Record<string, string> = {
  doll: 'bg-pink-100 text-pink-700',
  accessory: 'bg-blue-100 text-blue-700',
  both: 'bg-green-100 text-green-700',
};

export default function SeriesCategoryPage() {
  const [activeTab, setActiveTab] = useState<'series' | 'category'>('series');
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seriesRes, categoryRes] = await Promise.all([
        api.series.list(),
        api.category.list(),
      ]);
      setSeriesList(seriesRes.data || []);
      setCategories(categoryRes.data || []);
    } catch (err) {
      console.error('获取数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteSeries = async (id: string) => {
    if (!confirm('确认删除该系列？')) return;
    try {
      await api.series.delete(id);
      fetchData();
    } catch (err) {
      alert('删除失败');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('确认删除该分类？')) return;
    try {
      await api.category.delete(id);
      fetchData();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div>
      <PageHeader
        title="系列与分类管理"
        subtitle="管理娃娃/配饰的系列和配饰分类"
        actions={
          activeTab === 'series' ? (
            <button
              onClick={() => { setEditingSeries(null); setShowSeriesModal(true); }}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> 新增系列
            </button>
          ) : (
            <button
              onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> 新增分类
            </button>
          )
        }
      />

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'series', label: '系列管理' },
          { id: 'category', label: '配饰分类' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'series' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">加载中...</p></div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">系列名称</th>
                  <th className="px-4 py-3 text-center font-semibold">适用类型</th>
                  <th className="px-4 py-3 text-left font-semibold">描述</th>
                  <th className="px-4 py-3 text-center font-semibold">状态</th>
                  <th className="px-4 py-3 text-center font-semibold">创建时间</th>
                  <th className="px-4 py-3 text-center font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {seriesList.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[s.type]}`}>
                        {typeLabels[s.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-500 truncate max-w-xs">{s.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={s.status} type="product" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-400">{s.createdAt?.slice(0, 10)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditingSeries(s); setShowSeriesModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => deleteSeries(s.id)}
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
          )}
        </div>
      )}

      {activeTab === 'category' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">加载中...</p></div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">分类名称</th>
                  <th className="px-4 py-3 text-center font-semibold">标识值</th>
                  <th className="px-4 py-3 text-left font-semibold">描述</th>
                  <th className="px-4 py-3 text-center font-semibold">状态</th>
                  <th className="px-4 py-3 text-center font-semibold">创建时间</th>
                  <th className="px-4 py-3 text-center font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.value}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-500">{c.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={c.status} type="product" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-400">{c.createdAt?.slice(0, 10)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditingCategory(c); setShowCategoryModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => deleteCategory(c.id)}
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
          )}
        </div>
      )}

      {showSeriesModal && (
        <SeriesFormModal
          item={editingSeries}
          onClose={() => setShowSeriesModal(false)}
          onSave={async (data) => {
            try {
              if (editingSeries) {
                await api.series.update({ ...data, id: editingSeries.id });
              } else {
                await api.series.create(data);
              }
              setShowSeriesModal(false);
              fetchData();
            } catch (err: any) {
              alert(err.message || '保存失败');
            }
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryFormModal
          item={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={async (data) => {
            try {
              if (editingCategory) {
                await api.category.update({ ...data, id: editingCategory.id });
              } else {
                await api.category.create(data);
              }
              setShowCategoryModal(false);
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

function SeriesFormModal({ item, onClose, onSave }: {
  item: SeriesItem | null;
  onClose: () => void;
  onSave: (data: Partial<SeriesItem>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    type: item?.type || 'doll' as SeriesItem['type'],
    status: item?.status || 'active' as SeriesItem['status'],
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{item ? '编辑系列' : '新增系列'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">系列名称 *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="如：花园系列"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">适用类型</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as SeriesItem['type'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="doll">娃娃系列</option>
              <option value="accessory">配饰系列</option>
              <option value="both">通用（娃娃+配饰）</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="简短描述该系列的风格"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">状态</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as SeriesItem['status'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-colors">保存</button>
        </div>
      </div>
    </div>
  );
}

function CategoryFormModal({ item, onClose, onSave }: {
  item: CategoryItem | null;
  onClose: () => void;
  onSave: (data: Partial<CategoryItem>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || '',
    value: item?.value || '',
    description: item?.description || '',
    status: item?.status || 'active' as CategoryItem['status'],
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{item ? '编辑分类' : '新增分类'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">分类名称 *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="如：头饰"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">标识值 *</label>
            <input type="text" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
              placeholder="如：headwear（英文小写）"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">状态</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CategoryItem['status'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={() => form.name.trim() && form.value.trim() && onSave(form)}
            disabled={!form.name.trim() || !form.value.trim()}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-colors">保存</button>
        </div>
      </div>
    </div>
  );
}