import { useState, useEffect } from 'react';
import { Search, Eye, FileDown, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import StatusBadge from '../../components/Common/StatusBadge';
import { api } from '../../services/api';
import type { InquiryOrder } from '../../types';

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'contacted', label: '已联系' },
  { value: 'quoted', label: '已报价' },
  { value: 'closed', label: '已成交' },
  { value: 'cancelled', label: '已取消' },
];

export default function InquiriesPage() {
  const [orders, setOrders] = useState<InquiryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<InquiryOrder | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 8;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.inquiry.list({
        keyword: search || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
        page,
        page_size: PAGE_SIZE,
      });
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取询价单列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, filterStatus, page]);

  const updateStatus = async (id: string, status: InquiryOrder['status'], adminNote?: string) => {
    try {
      await api.inquiry.updateStatus({ id, status, adminNote });
      fetchOrders();
      if (selectedOrder?.id === id) {
        const detail = await api.inquiry.detail(id);
        setSelectedOrder(detail.data);
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const counts = statusOptions.reduce((acc, opt) => {
    acc[opt.value] = opt.value === 'all' ? orders.length : orders.filter(o => o.status === opt.value).length;
    return acc;
  }, {} as Record<string, number>);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="询价订单管理"
        subtitle={`共 ${total} 条询价单`}
        actions={
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <FileDown size={16} /> 导出Excel
          </button>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setFilterStatus(opt.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === opt.value ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filterStatus === opt.value ? 'bg-white/20' : 'bg-gray-100'}`}>
              {counts[opt.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索单号、客户名、手机号..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-semibold">询价单号</th>
                <th className="px-4 py-3 text-left font-semibold">客户信息</th>
                <th className="px-4 py-3 text-left font-semibold">收货地址</th>
                <th className="px-4 py-3 text-left font-semibold">搭配内容</th>
                <th className="px-4 py-3 text-center font-semibold">是否拼单</th>
                <th className="px-4 py-3 text-right font-semibold">报价金额</th>
                <th className="px-4 py-3 text-center font-semibold">状态</th>
                <th className="px-4 py-3 text-center font-semibold">提交时间</th>
                <th className="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-gray-600">{order.orderNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{order.userName}</p>
                    <p className="text-xs text-gray-400">{order.userPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {order.address ? (
                      <p className="text-xs text-gray-600 max-w-[180px] truncate" title={order.address}>
                        {order.address}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300">-</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx}>
                        <p className="text-xs text-gray-700 font-medium flex items-center gap-1">
                          {item.type === 'outfit' && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">搭配</span>}
                          {item.type === 'doll' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">娃娃</span>}
                          {item.type === 'accessory' && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-xs rounded">配饰</span>}
                          {item.name || item.dollName || '未知商品'}
                        </p>
                        <p className="text-xs text-gray-400">
                          ¥{(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.isPindan ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full">是</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">否</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-rose-600">¥{order.totalAmount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={order.status} type="inquiry" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <p className="text-xs text-gray-500">{order.createdAt?.slice(0, 10)}</p>
                    <p className="text-xs text-gray-400">{order.createdAt?.slice(11, 16)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={async () => {
                          try {
                            const detail = await api.inquiry.detail(order.id);
                            setSelectedOrder(detail.data);
                            setShowFollowUp(false);
                          } catch (err) {
                            alert('获取详情失败');
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="查看详情"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const detail = await api.inquiry.detail(order.id);
                            setSelectedOrder(detail.data);
                            setShowFollowUp(true);
                          } catch (err) {
                            alert('获取详情失败');
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="跟进历史"
                      >
                        <Clock size={14} />
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
          {!loading && orders.length === 0 && (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">暂无数据</p></div>
          )}
          {!loading && orders.length > 0 && (
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

      {selectedOrder && !showFollowUp && (
        <InquiryDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}

      {selectedOrder && showFollowUp && (
        <FollowUpHistoryModal
          orderId={selectedOrder.id}
          orderNo={selectedOrder.orderNo}
          onClose={() => { setShowFollowUp(false); setSelectedOrder(null); }}
        />
      )}
    </div>
  );
}

function FollowUpHistoryModal({ orderId, orderNo, onClose }: {
  orderId: string;
  orderNo: string;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.inquiry.followUp(orderId).then(res => {
      setRecords(res.data || []);
    }).catch(() => {
      console.error('获取跟进记录失败');
    }).finally(() => {
      setLoading(false);
    });
  }, [orderId]);

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    contacted: '已联系',
    quoted: '已报价',
    closed: '已成交',
    cancelled: '已取消',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">跟进历史</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{orderNo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400"><p className="text-sm">加载中...</p></div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无跟进记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record: any) => (
                <div key={record.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs rounded-full">
                        {statusLabels[record.status] || record.status}
                      </span>
                      <span className="text-xs text-gray-400">{record.operator || '管理员'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{record.createdAt}</span>
                  </div>
                  {record.note && (
                    <p className="text-sm text-gray-700">{record.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function InquiryDetailModal({ order, onClose, onUpdateStatus }: {
  order: InquiryOrder;
  onClose: () => void;
  onUpdateStatus: (id: string, status: InquiryOrder['status'], note?: string) => void;
}) {
  const [adminNote, setAdminNote] = useState(order.adminNote || '');
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  // 规范化items数据，确保accessories和defaultAccessories是数组，且price是数字
  const normalizedItems = (order.items || []).map((item: any) => {
    let accessories = item.accessories;
    if (typeof accessories === 'string' && accessories) {
      try { accessories = JSON.parse(accessories); } catch { accessories = []; }
    }
    if (!Array.isArray(accessories)) accessories = [];
    // 确保每个配饰的price是数字
    accessories = (accessories || []).map((acc: any) => ({
      ...acc,
      name: acc.name || '',
      price: typeof acc.price === 'number' ? acc.price : (parseFloat(acc.price) || 0)
    }));

    let defaultAccessories = item.defaultAccessories;
    if (typeof defaultAccessories === 'string' && defaultAccessories) {
      try { defaultAccessories = JSON.parse(defaultAccessories); } catch { defaultAccessories = []; }
    }
    if (!Array.isArray(defaultAccessories)) defaultAccessories = [];
    // 确保每个配饰的price是数字
    defaultAccessories = (defaultAccessories || []).map((acc: any) => ({
      ...acc,
      name: acc.name || '',
      price: typeof acc.price === 'number' ? acc.price : (parseFloat(acc.price) || 0)
    }));

    return { ...item, accessories, defaultAccessories };
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedStatus !== order.status || adminNote !== order.adminNote) {
        await onUpdateStatus(order.id, selectedStatus, adminNote);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">询价单详情</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{order.orderNo}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} type="inquiry" />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">客户姓名</p>
              <p className="text-sm font-semibold text-gray-800">{order.userName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">联系电话</p>
              <p className="text-sm font-semibold text-gray-800">{order.userPhone}</p>
            </div>
            {order.address && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">收货地址</p>
                <p className="text-sm text-gray-700">{order.address}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">提交时间</p>
              <p className="text-sm text-gray-700">{order.createdAt}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">更新时间</p>
              <p className="text-sm text-gray-700">{order.updatedAt}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">搭配清单</h4>
            {normalizedItems.map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-4 mb-3">
                {item.type === 'outfit' ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">搭配: {item.name}</span>
                      <span className="text-sm font-bold text-rose-600">¥{(item.price || 0).toFixed(2)}</span>
                    </div>
                    {item.dollName && (
                      <div className="ml-3 mb-2 text-xs text-gray-600 flex items-center gap-1">
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded">娃娃</span>
                        {item.dollName}
                      </div>
                    )}
                    {item.defaultAccessories?.length > 0 && (
                      <div className="ml-3 mb-2">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded">默认配饰</span>
                        </div>
                        {item.defaultAccessories.map((acc: any, accIdx: number) => (
                          <div key={accIdx} className="flex items-center justify-between text-xs text-gray-500 ml-3">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">•</span>
                              {acc.name}
                            </div>
                            <span className="text-gray-400">¥{(acc.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.accessories?.length > 0 && (
                      <div className="ml-3">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded">自选配饰</span>
                        </div>
                        {item.accessories.map((acc: any, accIdx: number) => (
                          <div key={accIdx} className="flex items-center justify-between text-xs text-gray-600 ml-3">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">•</span>
                              {acc.name}
                            </div>
                            <span className="text-gray-500">¥{(acc.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {item.type === 'doll' && '娃娃: '}{item.type === 'accessory' && '配饰: '}{item.name || '未知商品'}
                    </span>
                    <span className="text-sm font-bold text-rose-600">¥{(item.price || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end items-center gap-2 mt-3 p-3 bg-rose-50 rounded-xl">
              <span className="text-sm text-gray-600">总报价：</span>
              <span className="text-xl font-bold text-rose-600">¥{order.totalAmount}</span>
            </div>
          </div>

          {order.remark && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1">客户备注</h4>
              <p className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg">{order.remark}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-1">状态</h4>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as InquiryOrder['status'])}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="pending">待处理</option>
              <option value="contacted">已联系</option>
              <option value="quoted">已报价</option>
              <option value="closed">已成交</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-1">跟进备注</h4>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              rows={3}
              placeholder="记录跟进情况..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 pb-5 gap-3">
          <div className="flex gap-2">
            {order.status !== 'cancelled' && order.status !== 'closed' && (
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onUpdateStatus(order.id, 'cancelled', adminNote);
                    onClose();
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                取消订单
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              关闭
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}