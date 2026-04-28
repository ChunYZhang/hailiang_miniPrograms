import { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Upload, Globe, Phone, MapPin, Clock, X, Check, Search, Edit } from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import { api } from '../../services/api';
import type { CompanyInfo, Banner, Doll, Accessory, OutfitTemplate } from '../../types';

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'banners' | 'certs'>('info');
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const companyRes = await api.company.get();
      setInfo(companyRes.data || {});
    } catch (err) {
      console.error('获取企业信息失败', err);
      setInfo({});
    }
    try {
      const bannerRes = await api.banner.list();
      setBanners(bannerRes.data || []);
    } catch (err) {
      console.error('获取轮播图失败', err);
    }
    try {
      const certRes = await api.certificate.list();
      setCertificates(certRes.data || []);
    } catch (err) {
      console.error('获取证书失败', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      await api.company.save(info);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleBannerToggle = async (id: string) => {
    try {
      await api.banner.toggleStatus(id);
      fetchData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleBannerDelete = async (id: string) => {
    if (!confirm('确认删除该轮播图？')) return;
    try {
      await api.banner.delete(id);
      fetchData();
    } catch (err) {
      alert('删除失败');
    }
  };

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // 资质证书相关
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);

  const handleCertSave = async (cert: any) => {
    try {
      if (cert.id.startsWith('new_')) {
        await api.certificate.create(cert);
      } else {
        await api.certificate.update(cert);
      }
      setShowCertModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleCertDelete = async (id: string) => {
    if (!confirm('确认删除该证书？')) return;
    try {
      await api.certificate.delete(id);
      fetchData();
    } catch (err) {
      alert('删除失败');
    }
  };

  const openBannerModal = (banner?: Banner) => {
    setEditingBanner(banner || null);
    setShowBannerModal(true);
  };

  const handleAddBanner = () => {
    openBannerModal();
  };

  const handleBannerSave = async (banner: Banner) => {
    try {
      if (banner.id.startsWith('new_')) {
        await api.banner.create(banner);
      } else {
        await api.banner.update(banner);
      }
      setShowBannerModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="企业信息管理" subtitle="管理公司基本信息、轮播图和资质证书" />
        <div className="text-center py-20 text-gray-400"><p className="text-sm">加载中...</p></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="企业信息管理"
        subtitle="管理公司基本信息、轮播图和资质证书"
        actions={
          activeTab === 'info' && (
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                saved ? 'bg-green-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              <Save size={16} /> {saved ? '已保存' : '保存更改'}
            </button>
          )
        }
      />

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'info', label: '基本信息' },
          { id: 'banners', label: '首页轮播图' },
          { id: 'certs', label: '资质证书' },
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

      {activeTab === 'info' && info && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3">基本联系信息</h3>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">公司名称</label>
              <input type="text" value={info.name || ''} onChange={e => setInfo({ ...info, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Phone size={12} /> 联系电话</label>
                <input type="text" value={info.phone || ''} onChange={e => setInfo({ ...info, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Globe size={12} /> 邮箱</label>
                <input type="email" value={info.email || ''} onChange={e => setInfo({ ...info, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><MapPin size={12} /> 公司地址</label>
              <input type="text" value={info.address || ''} onChange={e => setInfo({ ...info, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Clock size={12} /> 工作时间</label>
              <input type="text" value={info.workHours || ''} onChange={e => setInfo({ ...info, workHours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">公司标语</label>
              <input type="text" value={info.slogan || ''} onChange={e => setInfo({ ...info, slogan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">公司简介</label>
              <textarea value={info.description || ''} onChange={e => setInfo({ ...info, description: e.target.value })}
                rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3">地图配置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">经度</label>
                <input type="text" value={info.mapLng || ''} onChange={e => setInfo({ ...info, mapLng: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">纬度</label>
                <input type="text" value={info.mapLat || ''} onChange={e => setInfo({ ...info, mapLat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
            </div>
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center">
                <MapPin size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">地图预览区域</p>
                <p className="text-xs text-gray-300 mt-1">{info.mapLng}, {info.mapLat}</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">公司实力亮点</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🏭', label: '自有工厂', desc: '10000㎡生产基地' },
                  { icon: '🔬', label: '研发团队', desc: '50+专业设计师' },
                  { icon: '📜', label: '专利数量', desc: '持有专利30+项' },
                  { icon: '🌍', label: '出口国家', desc: '产品出口30+国' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'banners' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={handleAddBanner} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> 新增轮播图
            </button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {banners.map(banner => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative h-44">
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-white text-sm font-semibold">{banner.title}</p>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleBannerToggle(banner.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${banner.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
                    >
                      {banner.status === 'active' ? '显示中' : '已隐藏'}
                    </button>
                    <button
                      onClick={() => openBannerModal(banner)}
                      className="p-1 bg-blue-500 text-white rounded"
                      title="编辑"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleBannerDelete(banner.id)}
                      className="p-1 bg-red-500 text-white rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'certs' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingCert({ id: `new_${Date.now()}`, name: '', image: '', sort: certificates.length, status: 'active' });
                setShowCertModal(true);
              }}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> 新增证书
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all">
                <p className="text-base font-bold text-gray-800 mb-4 text-center">{cert.name}</p>
                {cert.image ? (
                  <div className="mb-4">
                    <img src={cert.image} alt={cert.name} className="w-full h-40 object-cover rounded-xl" />
                    <div className="flex gap-2 justify-center mt-4">
                      <button
                        onClick={() => {
                          setEditingCert(cert);
                          setShowCertModal(true);
                        }}
                        className="px-4 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        更换图片
                      </button>
                      <button
                        onClick={() => handleCertDelete(cert.id)}
                        className="px-4 py-2 text-xs bg-gray-100 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setEditingCert(cert);
                      setShowCertModal(true);
                    }}
                    className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer mb-4"
                  >
                    <Upload size={28} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">点击上传证书图片</p>
                    <p className="text-xs text-gray-300 mt-1">支持 JPG/PNG</p>
                  </div>
                )}
              </div>
            ))}
            {certificates.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm">暂无资质证书，点击右上角按钮添加</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCertModal && (
        <CertModal
          cert={editingCert}
          onClose={() => setShowCertModal(false)}
          onSave={handleCertSave}
        />
      )}

      {showBannerModal && (
        <BannerModal
          banner={editingBanner}
          onClose={() => setShowBannerModal(false)}
          onSave={handleBannerSave}
        />
      )}
    </div>
  );
}

function BannerModal({ banner, onClose, onSave }: {
  banner: Banner | null;
  onClose: () => void;
  onSave: (banner: Banner) => void;
}) {
  // 处理后端返回的snake_case字段
  const getLinkType = () => (banner as any)?.link_type || banner?.linkType || '';
  const getLinkId = () => (banner as any)?.link_id || banner?.linkId || '';

  const [form, setForm] = useState({
    id: banner?.id || `new_${Date.now()}`,
    title: banner?.title || '',
    image: banner?.image || '',
    linkType: getLinkType() as 'doll' | 'accessory' | 'outfit' | '',
    linkId: getLinkId(),
    sort: banner?.sort || 0,
    status: banner?.status || 'active' as 'active' | 'inactive',
  });

  // 当banner prop变化时（编辑时），更新form
  useEffect(() => {
    if (banner) {
      setForm({
        id: banner.id,
        title: banner.title || '',
        image: banner.image || '',
        linkType: getLinkType() as 'doll' | 'accessory' | 'outfit' | '',
        linkId: getLinkId(),
        sort: banner.sort || 0,
        status: banner.status || 'active' as 'active' | 'inactive',
      });
    }
  }, [banner]);

  const [dollSearch, setDollSearch] = useState('');
  const [accSearch, setAccSearch] = useState('');
  const [outfitSearch, setOutfitSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'doll' | 'accessory' | 'outfit'>('all');

  const [dolls, setDolls] = useState<Doll[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [outfits, setOutfits] = useState<OutfitTemplate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.doll.list(),
      api.accessory.list(),
      api.outfit.list(),
    ]).then(([dollRes, accRes, outfitRes]) => {
      setDolls(dollRes.data || []);
      setAccessories(accRes.data || []);
      setOutfits(outfitRes.data || []);
    }).catch(err => {
      console.error('获取数据失败', err);
    }).finally(() => {
      setLoadingData(false);
    });
  }, []);

  const filteredDolls = dolls.filter(d => {
    if (d.status !== 'active') return false;
    return !dollSearch || d.name.includes(dollSearch);
  });

  const filteredAccessories = accessories.filter(a => {
    if (a.status !== 'active') return false;
    return !accSearch || a.name.includes(accSearch);
  });

  const filteredOutfits = outfits.filter(o => {
    return !outfitSearch || o.name.includes(outfitSearch);
  });

  const selectedProduct = useMemo(() => {
    if (!form.linkId || !form.linkType) return null;
    if (form.linkType === 'doll') return dolls.find(d => d.id === form.linkId);
    if (form.linkType === 'accessory') return accessories.find(a => a.id === form.linkId);
    if (form.linkType === 'outfit') return outfits.find(o => o.id === form.linkId);
    return null;
  }, [form.linkId, form.linkType, dolls, accessories, outfits]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.upload.image(file);
      setForm(prev => ({ ...prev, image: url }));
    } catch {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectProduct = (type: 'doll' | 'accessory' | 'outfit', id: string) => {
    let image = '';
    if (type === 'doll') {
      const doll = dolls.find(d => d.id === id);
      image = doll?.images?.[0] || '';
    } else if (type === 'accessory') {
      const acc = accessories.find(a => a.id === id);
      image = acc?.images?.[0] || '';
    } else if (type === 'outfit') {
      const outfit = outfits.find(o => o.id === id);
      image = outfit?.coverImage || '';
    }
    setForm(prev => ({ ...prev, linkType: type, linkId: id, image: image || prev.image }));
  };

  const canSave = form.title.trim() && form.image;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-800">
            {banner ? '编辑轮播图' : '新增轮播图'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 图片上传 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">轮播图图片 *</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-rose-300 transition-colors relative">
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="预览" className="w-full h-40 object-contain rounded-lg" />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-6">
                  {uploading ? (
                    <span className="text-xs text-gray-400">上传中...</span>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">点击上传轮播图</p>
                      <p className="text-xs text-gray-300 mt-0.5">建议尺寸 800x400</p>
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
              )}
            </div>
          </div>

          {/* 标题 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">轮播图标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="如：春季新品上市"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* 已选商品 */}
          {selectedProduct && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    {form.linkType === 'doll' ? '娃娃' : form.linkType === 'accessory' ? '配饰' : '搭配'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {'name' in selectedProduct ? selectedProduct.name : ''}
                  </span>
                </div>
                <button
                  onClick={() => setForm(prev => ({ ...prev, linkType: '', linkId: '' }))}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  移除
                </button>
              </div>
            </div>
          )}

          {/* 商品筛选 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">跳转商品（可选）</label>
            <div className="flex gap-2 mb-2">
              {(['all', 'doll', 'accessory', 'outfit'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === type
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? '全部' : type === 'doll' ? '娃娃' : type === 'accessory' ? '配饰' : '搭配'}
                </button>
              ))}
            </div>

            {loadingData ? (
              <p className="text-xs text-gray-400 py-3 text-center">加载中...</p>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                {filterType === 'all' && (
                  <>
                    {filteredDolls.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">娃娃</div>
                        <div className="p-2 space-y-1">
                          <div className="flex gap-2 mb-2">
                            <div className="relative flex-1">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={dollSearch}
                                onChange={e => setDollSearch(e.target.value)}
                                placeholder="搜索娃娃..."
                                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                          {filteredDolls.slice(0, 10).map(doll => (
                            <button
                              key={doll.id}
                              onClick={() => handleSelectProduct('doll', doll.id)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                                form.linkType === 'doll' && form.linkId === doll.id
                                  ? 'border-rose-400 bg-rose-50'
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <img src={doll.images[0] || 'https://via.placeholder.com/32'} alt={doll.name} className="w-8 h-8 rounded-lg object-cover" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-semibold text-gray-800 truncate">{doll.name}</p>
                                <p className="text-xs text-gray-400">¥{doll.price}</p>
                              </div>
                              {form.linkType === 'doll' && form.linkId === doll.id && (
                                <Check size={12} className="text-rose-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredAccessories.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">配饰</div>
                        <div className="p-2 space-y-1">
                          <div className="flex gap-2 mb-2">
                            <div className="relative flex-1">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={accSearch}
                                onChange={e => setAccSearch(e.target.value)}
                                placeholder="搜索配饰..."
                                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                          {filteredAccessories.slice(0, 10).map(acc => (
                            <button
                              key={acc.id}
                              onClick={() => handleSelectProduct('accessory', acc.id)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                                form.linkType === 'accessory' && form.linkId === acc.id
                                  ? 'border-rose-400 bg-rose-50'
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <img src={acc.images[0] || 'https://via.placeholder.com/32'} alt={acc.name} className="w-8 h-8 rounded-lg object-cover" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-semibold text-gray-800 truncate">{acc.name}</p>
                                <p className="text-xs text-gray-400">¥{acc.price}</p>
                              </div>
                              {form.linkType === 'accessory' && form.linkId === acc.id && (
                                <Check size={12} className="text-rose-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredOutfits.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">搭配方案</div>
                        <div className="p-2 space-y-1">
                          <div className="flex gap-2 mb-2">
                            <div className="relative flex-1">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={outfitSearch}
                                onChange={e => setOutfitSearch(e.target.value)}
                                placeholder="搜索搭配..."
                                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                          {filteredOutfits.slice(0, 10).map(outfit => (
                            <button
                              key={outfit.id}
                              onClick={() => handleSelectProduct('outfit', outfit.id)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                                form.linkType === 'outfit' && form.linkId === outfit.id
                                  ? 'border-rose-400 bg-rose-50'
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <img src={outfit.coverImage || 'https://via.placeholder.com/32'} alt={outfit.name} className="w-8 h-8 rounded-lg object-cover" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-semibold text-gray-800 truncate">{outfit.name}</p>
                                <p className="text-xs text-gray-400">¥{outfit.totalPrice}</p>
                              </div>
                              {form.linkType === 'outfit' && form.linkId === outfit.id && (
                                <Check size={12} className="text-rose-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {filterType === 'doll' && (
                  <div className="p-2">
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={dollSearch}
                          onChange={e => setDollSearch(e.target.value)}
                          placeholder="搜索娃娃名称..."
                          className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredDolls.map(doll => (
                        <button
                          key={doll.id}
                          onClick={() => handleSelectProduct('doll', doll.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                            form.linkType === 'doll' && form.linkId === doll.id
                              ? 'border-rose-400 bg-rose-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <img src={doll.images[0] || 'https://via.placeholder.com/32'} alt={doll.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-gray-800 truncate">{doll.name}</p>
                            <p className="text-xs text-gray-400">{doll.series} · ¥{doll.price}</p>
                          </div>
                          {form.linkType === 'doll' && form.linkId === doll.id && (
                            <Check size={12} className="text-rose-500" />
                          )}
                        </button>
                      ))}
                      {filteredDolls.length === 0 && (
                        <p className="text-xs text-gray-400 py-3 text-center">暂无匹配的娃娃</p>
                      )}
                    </div>
                  </div>
                )}

                {filterType === 'accessory' && (
                  <div className="p-2">
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={accSearch}
                          onChange={e => setAccSearch(e.target.value)}
                          placeholder="搜索配饰名称..."
                          className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredAccessories.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => handleSelectProduct('accessory', acc.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                            form.linkType === 'accessory' && form.linkId === acc.id
                              ? 'border-rose-400 bg-rose-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <img src={acc.images[0] || 'https://via.placeholder.com/32'} alt={acc.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-gray-800 truncate">{acc.name}</p>
                            <p className="text-xs text-gray-400">{acc.series || '—'} · ¥{acc.price}</p>
                          </div>
                          {form.linkType === 'accessory' && form.linkId === acc.id && (
                            <Check size={12} className="text-rose-500" />
                          )}
                        </button>
                      ))}
                      {filteredAccessories.length === 0 && (
                        <p className="text-xs text-gray-400 py-3 text-center">暂无匹配的配饰</p>
                      )}
                    </div>
                  </div>
                )}

                {filterType === 'outfit' && (
                  <div className="p-2">
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={outfitSearch}
                          onChange={e => setOutfitSearch(e.target.value)}
                          placeholder="搜索搭配方案名称..."
                          className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredOutfits.map(outfit => (
                        <button
                          key={outfit.id}
                          onClick={() => handleSelectProduct('outfit', outfit.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                            form.linkType === 'outfit' && form.linkId === outfit.id
                              ? 'border-rose-400 bg-rose-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <img src={outfit.coverImage || 'https://via.placeholder.com/32'} alt={outfit.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-gray-800 truncate">{outfit.name}</p>
                            <p className="text-xs text-gray-400">¥{outfit.totalPrice}</p>
                          </div>
                          {form.linkType === 'outfit' && form.linkId === outfit.id && (
                            <Check size={12} className="text-rose-500" />
                          )}
                        </button>
                      ))}
                      {filteredOutfits.length === 0 && (
                        <p className="text-xs text-gray-400 py-3 text-center">暂无匹配的搭配方案</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => canSave && onSave(form as Banner)}
            disabled={!canSave}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {banner ? '保存修改' : '创建轮播图'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CertModal({ cert, onClose, onSave }: {
  cert: any;
  onClose: () => void;
  onSave: (cert: any) => void;
}) {
  const [form, setForm] = useState({
    id: cert?.id || `new_${Date.now()}`,
    name: cert?.name || '',
    image: cert?.image || '',
    sort: cert?.sort || 0,
    status: cert?.status || 'active',
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (cert) {
      setForm({
        id: cert.id,
        name: cert.name || '',
        image: cert.image || '',
        sort: cert.sort || 0,
        status: cert.status || 'active',
      });
    }
  }, [cert]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.upload.image(file);
      setForm(prev => ({ ...prev, image: url }));
    } catch {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const canSave = form.name.trim() && form.image;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            {cert ? '编辑证书' : '新增证书'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 证书名称 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">证书名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="如：营业执照"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* 证书图片 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">证书图片 *</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-rose-300 transition-colors relative">
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="预览" className="w-full h-40 object-contain rounded-lg" />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-6">
                  {uploading ? (
                    <span className="text-xs text-gray-400">上传中...</span>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">点击上传证书图片</p>
                      <p className="text-xs text-gray-300 mt-0.5">建议尺寸 800x600</p>
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
              )}
            </div>
          </div>

          {/* 排序 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">排序</label>
            <input
              type="number"
              value={form.sort}
              onChange={e => setForm(prev => ({ ...prev, sort: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {cert ? '保存修改' : '创建证书'}
          </button>
        </div>
      </div>
    </div>
  );
}