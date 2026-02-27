/**
 * MyQuotes - 买家"我的报价"页面
 * 
 * 功能：
 * - 展示所有 RFQ 的报价汇总
 * - 按状态筛选（待回复、已回复、已接受、已拒绝）
 * - 报价详情卡片（单价、MOQ、交期、样品信息）
 * - 快速操作（接受/拒绝、查看详情）
 * - 报价对比视图
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, Filter, DollarSign, Clock, Package,
  CheckCircle2, XCircle, AlertCircle, TrendingDown,
  Loader2, ChevronRight, Calendar, MapPin, Building2,
  Eye, Trash2, RefreshCw, Download, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QuoteCard } from '@/components/sourcing/QuoteCard';

type QuoteStatus = 'all' | 'pending' | 'replied' | 'accepted' | 'rejected';

interface RfqQuoteWithDetails {
  id: number;
  inquiryId: number;
  demandId?: number;
  factoryId: number;
  buyerId: number;
  status: string;
  unitPrice?: number;
  currency?: string;
  moq?: number;
  leadTimeDays?: number;
  validUntil?: Date;
  tierPricing?: any;
  factoryNotes?: string;
  paymentTerms?: string;
  shippingTerms?: string;
  sampleAvailable?: boolean;
  samplePrice?: number;
  sampleLeadDays?: number;
  buyerFeedback?: string;
  respondedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  factory?: {
    id: number;
    name: string;
    logoUrl?: string;
    location?: string;
    category?: string;
  };
  inquiry?: {
    id: number;
    productName?: string;
    quantity?: number;
    destination?: string;
  };
  demand?: {
    id: number;
    productName?: string;
  };
}

export default function MyQuotes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<QuoteStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'leadtime'>('newest');

  // 获取买家的所有报价
  const { data: quotes = [], isLoading, refetch } = trpc.rfq.getBuyerRFQs.useQuery(undefined, {
    enabled: !!user,
  });

  // 接受报价 mutation
  const acceptMutation = trpc.rfq.accept.useMutation({
    onSuccess: () => {
      toast.success('✅ 报价已接受！');
      refetch();
    },
    onError: (error) => {
      toast.error('❌ 接受失败', { description: error.message });
    },
  });

  // 拒绝报价 mutation
  const rejectMutation = trpc.rfq.reject.useMutation({
    onSuccess: () => {
      toast.success('✅ 报价已拒绝');
      refetch();
    },
    onError: (error) => {
      toast.error('❌ 拒绝失败', { description: error.message });
    },
  });

  // 过滤和排序报价
  const filteredQuotes = quotes
    .filter((q: RfqQuoteWithDetails) => {
      // 状态过滤
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          q.factory?.name?.toLowerCase().includes(query) ||
          q.inquiry?.productName?.toLowerCase().includes(query) ||
          q.demand?.productName?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a: RfqQuoteWithDetails, b: RfqQuoteWithDetails) => {
      switch (sortBy) {
        case 'price':
          return (a.unitPrice || 0) - (b.unitPrice || 0);
        case 'leadtime':
          return (a.leadTimeDays || 0) - (b.leadTimeDays || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // 统计数据
  const stats = {
    total: quotes.length,
    pending: quotes.filter((q: RfqQuoteWithDetails) => q.status === 'pending').length,
    replied: quotes.filter((q: RfqQuoteWithDetails) => q.status === 'replied').length,
    accepted: quotes.filter((q: RfqQuoteWithDetails) => q.status === 'accepted').length,
    rejected: quotes.filter((q: RfqQuoteWithDetails) => q.status === 'rejected').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '待回复', color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', icon: AlertCircle };
      case 'replied':
        return { label: '已回复', color: 'bg-blue-500/15 border-blue-500/30 text-blue-400', icon: CheckCircle2 };
      case 'accepted':
        return { label: '已接受', color: 'bg-green-500/15 border-green-500/30 text-green-400', icon: CheckCircle2 };
      case 'rejected':
        return { label: '已拒绝', color: 'bg-red-500/15 border-red-500/30 text-red-400', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-500/15 border-gray-500/30 text-gray-400', icon: AlertCircle };
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.025) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/6" style={{ background: 'rgba(5,3,16,0.92)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/buyer-dashboard')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">我的报价</h1>
              <p className="text-sm text-gray-400 mt-1">管理和跟踪所有报价请求</p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: '总报价', value: stats.total, color: 'text-white' },
            { label: '待回复', value: stats.pending, color: 'text-yellow-400' },
            { label: '已回复', value: stats.replied, color: 'text-blue-400' },
            { label: '已接受', value: stats.accepted, color: 'text-green-400' },
            { label: '已拒绝', value: stats.rejected, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="搜索工厂名称、产品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-600"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'replied', 'accepted', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  statusFilter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {status === 'all' ? '全部' : status === 'pending' ? '待回复' : status === 'replied' ? '已回复' : status === 'accepted' ? '已接受' : '已拒绝'}
              </button>
            ))}

            {/* Sort */}
            <div className="ml-auto flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-gray-300 focus:border-purple-500/50 outline-none"
              >
                <option value="newest">最新</option>
                <option value="price">价格低→高</option>
                <option value="leadtime">交期短→长</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quotes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">暂无报价</p>
            <p className="text-gray-600 text-sm mt-1">
              {searchQuery ? '没有找到匹配的报价' : '您还没有收到任何报价'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredQuotes.map((quote: RfqQuoteWithDetails, idx: number) => {
                const statusBadge = getStatusBadge(quote.status);
                const StatusIcon = statusBadge.icon;
                const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date();

                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/30 transition-all overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">
                                {quote.factory?.name || `工厂 #${quote.factoryId}`}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {quote.inquiry?.productName || quote.demand?.productName || '产品名称'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${statusBadge.color} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusBadge.label}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive" className="text-xs">
                              已过期
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quote Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* 单价 */}
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            单价
                          </p>
                          <p className="font-bold text-white">
                            {quote.currency || 'USD'} {quote.unitPrice?.toFixed(2) || 'N/A'}
                          </p>
                        </div>

                        {/* MOQ */}
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            MOQ
                          </p>
                          <p className="font-bold text-white">
                            {quote.moq?.toLocaleString() || 'N/A'}
                          </p>
                        </div>

                        {/* 交期 */}
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            交期
                          </p>
                          <p className="font-bold text-white">
                            {quote.leadTimeDays ? `${quote.leadTimeDays} 天` : 'N/A'}
                          </p>
                        </div>

                        {/* 有效期 */}
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            有效期
                          </p>
                          <p className="font-bold text-white text-sm">
                            {quote.validUntil
                              ? new Date(quote.validUntil).toLocaleDateString('zh-CN')
                              : '无限期'}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(quote.sampleAvailable || quote.tierPricing) && (
                        <div className="flex flex-wrap gap-2">
                          {quote.sampleAvailable && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ 可提供样品
                              {quote.samplePrice && ` · ${quote.currency} ${quote.samplePrice}`}
                            </Badge>
                          )}
                          {quote.tierPricing && Array.isArray(quote.tierPricing) && quote.tierPricing.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              📊 {quote.tierPricing.length} 层阶梯报价
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {quote.factoryNotes && (
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-gray-500 mb-1">工厂备注</p>
                          <p className="text-sm text-gray-300 line-clamp-2">{quote.factoryNotes}</p>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <p className="text-xs text-gray-600">
                          {new Date(quote.createdAt).toLocaleDateString('zh-CN')}
                        </p>

                        <div className="flex items-center gap-2">
                          {quote.status === 'replied' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectMutation.mutate({ inquiryId: quote.inquiryId })}
                                disabled={rejectMutation.isPending}
                                className="text-xs h-8"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                拒绝
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => acceptMutation.mutate({ inquiryId: quote.inquiryId })}
                                disabled={acceptMutation.isPending}
                                className="text-xs h-8 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                接受
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLocation(`/sourcing-room/${quote.demandId}`)}
                            className="text-xs h-8"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看详情
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
