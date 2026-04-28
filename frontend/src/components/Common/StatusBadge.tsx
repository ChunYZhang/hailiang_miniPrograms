interface StatusBadgeProps {
  status: string;
  type?: 'inquiry' | 'product' | 'user' | 'inventory' | 'admin';
}

const inquiryMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-100 text-amber-700' },
  contacted: { label: '已联系', className: 'bg-blue-100 text-blue-700' },
  quoted: { label: '已报价', className: 'bg-violet-100 text-violet-700' },
  closed: { label: '已成交', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
};

const productMap: Record<string, { label: string; className: string }> = {
  active: { label: '已上架', className: 'bg-green-100 text-green-700' },
  inactive: { label: '已下架', className: 'bg-gray-100 text-gray-500' },
};

const userMap: Record<string, { label: string; className: string }> = {
  active: { label: '正常', className: 'bg-green-100 text-green-700' },
  disabled: { label: '已禁用', className: 'bg-red-100 text-red-600' },
};

const inventoryMap: Record<string, { label: string; className: string }> = {
  in: { label: '入库', className: 'bg-green-100 text-green-700' },
  out: { label: '出库', className: 'bg-red-100 text-red-600' },
};

export default function StatusBadge({ status, type = 'product' }: StatusBadgeProps) {
  const maps = { inquiry: inquiryMap, product: productMap, user: userMap, inventory: inventoryMap, admin: userMap };
  const map = maps[type] || productMap;
  const config = map[status] || { label: status, className: 'bg-gray-100 text-gray-500' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
