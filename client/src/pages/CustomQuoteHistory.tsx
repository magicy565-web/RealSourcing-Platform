/**
 * CustomQuoteHistory
 * 定制报价历史页面（买家 + 工厂双视角）
 *
 * 功能：
 *   - 展示所有定制 RFQ 的历史记录
 *   - 支持按状态筛选（待报价、已报价、已接受、已拒绝）
 *   - 展示 AI 解析置信度、工艺复杂度、设计稿缩略图
 *   - 点击查看详情（含工厂报价、替代方案）
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scissors, FileImage, Clock, DollarSign, Package,
  ChevronRight, Filter, Search, RefreshCw, CheckCircle2,
  XCircle, AlertCircle, Layers, ArrowLeft, Eye
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: '待报价', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  submitted: { label: '已报价', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: <Package className="w-3 h-3" /> },
  accepted:  { label: '已接受', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:  { label: '已拒绝', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
  expired:   { label: '已过期', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: <AlertCircle className="w-3 h-3" /> },
};

const COMPLEXITY_LABELS: Record<string, { label: string; color: string }> = {
  simple:  { label: '简单', color: 'text-green-400' },
  medium:  { label: '中等', color: 'text-yellow-400' },
  complex: { label: '复杂', color: 'text-red-400' },
};

interface CustomRfqHistoryItem {
  id: number;
  productName: string;
  category: string;
  description: string;
  quantity?: number;
  targetPrice?: number;
  currency?: string;
  leadTime?: number;
  customSpecJson?: string;
  status: string;
  createdAt: string;
  factoryName?: string;
  quotedPrice?: number;
  quoteStatus?: string;
}

export default function CustomQuoteHistory() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<CustomRfqHistoryItem | null>(null);

  // 模拟数据（实际应从 trpc 获取）
  const mockData: CustomRfqHistoryItem[] = [
    {
      id: 1001,
      productName: '定制刺绣帽子',
      category: 'Headwear',
      description: '产品：定制刺绣帽子\n材质：100% 棉\n颜色：藏青色\n数量：500 件',
      quantity: 500,
      targetPrice: 8.5,
      currency: 'USD',
      leadTime: 25,
      customSpecJson: JSON.stringify({
        material: '100% 棉',
        dimensions: '标准尺寸 58cm',
        color: '藏青色',
        complexity: 'medium',
        budgetRange: { min: 7, max: 10, currency: 'USD' },
        designFileUrls: ['https://example.com/design1.png'],
        specialRequirements: '正面刺绣 LOGO，侧面织唛标签',
      }),
      status: 'submitted',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      factoryName: '深圳优质帽厂',
      quotedPrice: 8.2,
      quoteStatus: 'submitted',
    },
    {
      id: 1002,
      productName: '定制升华印花 T 恤',
      category: 'Apparel',
      description: '产品：定制升华印花 T 恤\n材质：涤纶\n颜色：全彩印花\n数量：200 件',
      quantity: 200,
      targetPrice: 12,
      currency: 'USD',
      leadTime: 20,
      customSpecJson: JSON.stringify({
        material: '100% 涤纶',
        dimensions: 'S/M/L/XL 各 50 件',
        color: '全彩升华印花',
        complexity: 'complex',
        budgetRange: { min: 10, max: 15, currency: 'USD' },
        designFileUrls: ['https://example.com/design2.pdf'],
        specialRequirements: '全身升华印花，需要颜色精准还原',
      }),
      status: 'accepted',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      factoryName: '广州升华印花厂',
      quotedPrice: 11.5,
      quoteStatus: 'accepted',
    },
    {
      id: 1003,
      productName: '定制皮革手提包',
      category: 'Bags',
      description: '产品：定制皮革手提包\n材质：头层牛皮\n颜色：棕色\n数量：100 件',
      quantity: 100,
      targetPrice: 45,
      currency: 'USD',
      leadTime: 40,
      customSpecJson: JSON.stringify({
        material: '头层牛皮',
        dimensions: '35cm × 28cm × 12cm',
        color: '棕色',
        complexity: 'complex',
        budgetRange: { min: 40, max: 55, currency: 'USD' },
        designFileUrls: [],
        specialRequirements: '内衬需要定制印花，金属配件需要镀金处理',
      }),
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredData = mockData.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery && !item.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const parseSpec = (specJson?: string) => {
    try { return specJson ? JSON.parse(specJson) : {}; } catch { return {}; }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Scissors className="w-6 h-6 text-purple-400" />
              定制报价历史
            </h1>
            <p className="text-gray-400 text-sm mt-1">查看所有定制询价的进展和报价记录</p>
          </div>
          <Button
            variant="outline"
            className="border-white/20 text-gray-400 hover:text-white text-sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '全部', value: mockData.length, key: 'all', color: 'text-white' },
            { label: '待报价', value: mockData.filter(d => d.status === 'pending').length, key: 'pending', color: 'text-yellow-400' },
            { label: '已报价', value: mockData.filter(d => d.status === 'submitted').length, key: 'submitted', color: 'text-blue-400' },
            { label: '已接受', value: mockData.filter(d => d.status === 'accepted').length, key: 'accepted', color: 'text-green-400' },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setStatusFilter(stat.key)}
              className={`bg-white/5 rounded-xl p-3 text-center border transition-all ${
                statusFilter === stat.key
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/10 hover:bg-white/10'
              }`}
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索产品名称..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* 列表 */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredData.map((item, idx) => {
              const spec = parseSpec(item.customSpecJson);
              const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['pending'];
              const complexityInfo = COMPLEXITY_LABELS[spec.complexity ?? 'medium'];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all cursor-pointer group"
                  onClick={() => setSelectedRfq(selectedRfq?.id === item.id ? null : item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* 图标 */}
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Scissors className="w-5 h-5 text-purple-400" />
                      </div>
                      {/* 主信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-medium text-sm">{item.productName}</h3>
                          <Badge className={`text-xs border ${statusCfg.color} flex items-center gap-1`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </Badge>
                          {spec.complexity && (
                            <span className={`text-xs ${complexityInfo.color}`}>
                              {complexityInfo.label}工艺
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-gray-400 text-xs">{item.category}</span>
                          {item.quantity && (
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {item.quantity.toLocaleString()} 件
                            </span>
                          )}
                          {spec.budgetRange && (
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {spec.budgetRange.currency} {spec.budgetRange.min}–{spec.budgetRange.max}
                            </span>
                          )}
                          {spec.designFileUrls?.length > 0 && (
                            <span className="text-blue-400 text-xs flex items-center gap-1">
                              <FileImage className="w-3 h-3" />
                              {spec.designFileUrls.length} 个设计稿
                            </span>
                          )}
                          <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                        </div>
                        {item.factoryName && (
                          <p className="text-gray-400 text-xs mt-1">
                            工厂：{item.factoryName}
                            {item.quotedPrice && (
                              <span className="text-green-400 ml-2">
                                报价 {item.currency ?? 'USD'} {item.quotedPrice}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
                      selectedRfq?.id === item.id ? 'rotate-90' : ''
                    }`} />
                  </div>

                  {/* 展开详情 */}
                  <AnimatePresence>
                    {selectedRfq?.id === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          {/* 规格详情 */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {spec.material && (
                              <div><span className="text-gray-500">材质：</span><span className="text-gray-200">{spec.material}</span></div>
                            )}
                            {spec.dimensions && (
                              <div><span className="text-gray-500">尺寸：</span><span className="text-gray-200">{spec.dimensions}</span></div>
                            )}
                            {spec.color && (
                              <div><span className="text-gray-500">颜色：</span><span className="text-gray-200">{spec.color}</span></div>
                            )}
                            {item.leadTime && (
                              <div><span className="text-gray-500">期望交期：</span><span className="text-gray-200">{item.leadTime} 天</span></div>
                            )}
                          </div>
                          {spec.specialRequirements && (
                            <div>
                              <span className="text-gray-500 text-xs">特殊要求：</span>
                              <p className="text-gray-200 text-xs mt-0.5">{spec.specialRequirements}</p>
                            </div>
                          )}
                          {/* 操作按钮 */}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="border-white/20 text-gray-400 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              查看完整报价
                            </Button>
                            {item.status === 'submitted' && (
                              <>
                                <Button size="sm" className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  接受报价
                                </Button>
                                <Button size="sm" className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  拒绝
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Scissors className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">暂无定制报价记录</p>
              <p className="text-gray-500 text-sm mt-1">上传设计稿，发起您的第一个定制询价</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
