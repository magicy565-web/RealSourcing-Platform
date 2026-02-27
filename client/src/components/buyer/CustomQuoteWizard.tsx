/**
 * CustomQuoteWizard
 * 4.3 定制报价 — 设计稿上传与 AI 解析向导
 *
 * 流程：
 * Step 1: 上传设计稿（图片/PDF/CAD截图）
 * Step 2: AI 解析设计稿，提取产品规格
 * Step 3: 买家确认/修改规格
 * Step 4: 生成定制 RFQ，发送给匹配工厂
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import {
  Upload, FileImage, FileText, X, CheckCircle2, Loader2,
  Sparkles, ChevronRight, ChevronLeft, Send, AlertCircle,
  Ruler, Package, Clock, DollarSign, Layers, Tag
} from 'lucide-react';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface ParsedSpec {
  productName: string;
  category: string;
  material?: string;
  dimensions?: string;
  color?: string;
  quantity?: number;
  specialRequirements?: string;
  estimatedComplexity?: 'simple' | 'medium' | 'complex';
  suggestedLeadTime?: number;
  suggestedBudgetRange?: { min: number; max: number; currency: string };
  confidence: number; // 0-100
  rawNotes?: string;
}

interface CustomQuoteWizardProps {
  demandId?: number;
  onComplete?: (rfqId: number) => void;
  onClose?: () => void;
}

// ── 步骤指示器 ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: '上传设计稿' },
  { id: 2, label: 'AI 解析' },
  { id: 3, label: '确认规格' },
  { id: 4, label: '发送询价' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all
            ${current === step.id ? 'bg-blue-500 text-white ring-4 ring-blue-100' :
              current > step.id ? 'bg-green-500 text-white' :
              'bg-gray-100 text-gray-400'}`}>
            {current > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
          </div>
          <span className={`ml-1.5 text-xs font-medium hidden sm:block
            ${current === step.id ? 'text-blue-600' :
              current > step.id ? 'text-green-600' : 'text-gray-400'}`}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-2 ${current > step.id ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: 文件上传 ──────────────────────────────────────────────────────────

function UploadStep({
  onUploaded,
}: {
  onUploaded: (files: UploadedFile[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      // 验证文件类型
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        setError(`不支持的文件类型：${file.name}。请上传 JPG、PNG、WebP 或 PDF。`);
        continue;
      }
      // 验证文件大小（最大 20MB）
      if (file.size > 20 * 1024 * 1024) {
        setError(`文件过大：${file.name}（最大 20MB）`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          setError(`上传失败：${err.error ?? '未知错误'}`);
          continue;
        }

        const data = await res.json();

        // 生成预览
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        newFiles.push({
          url: data.url,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
        });
      } catch (e: any) {
        setError(`上传出错：${e.message}`);
      }
    }

    setUploading(false);
    if (newFiles.length > 0) {
      const all = [...uploadedFiles, ...newFiles];
      setUploadedFiles(all);
    }
  }, [uploadedFiles]);

  const removeFile = (idx: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx);
    setUploadedFiles(updated);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">上传设计稿或参考图</h3>
        <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、WebP、PDF，最多 5 个文件，每个最大 20MB</p>
      </div>

      {/* 拖拽区域 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm text-blue-600">上传中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">拖拽文件到此处，或点击选择</p>
            <p className="text-xs text-gray-400">设计稿、效果图、参考样品图均可</p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" />
              ) : (
                <FileText className="w-10 h-10 text-red-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* 继续按钮 */}
      <button
        disabled={uploadedFiles.length === 0}
        onClick={() => onUploaded(uploadedFiles)}
        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-sm
          hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all
          flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI 解析设计稿
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 2: AI 解析 ───────────────────────────────────────────────────────────

function ParseStep({
  files,
  onParsed,
}: {
  files: UploadedFile[];
  onParsed: (spec: ParsedSpec) => void;
}) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const parseDesign = trpc.rfq.parseDesignFile.useMutation({
    onSuccess: (data: any) => {
      setParsing(false);
      onParsed(data);
    },
    onError: (e: any) => {
      setParsing(false);
      setError(e.message);
    },
  });

  const startParsing = () => {
    setStarted(true);
    setParsing(true);
    setError(null);
    parseDesign.mutate({
      fileUrls: files.map(f => f.url),
      fileTypes: files.map(f => f.type),
    });
  };

  if (!started) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">AI 解析设计稿</h3>
          <p className="text-sm text-gray-500 mt-2">
            AI 将自动识别设计稿中的产品规格、材质、尺寸等信息，
            <br />帮您快速生成定制报价请求。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">
              {f.type.startsWith('image/') ? <FileImage className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {f.name}
            </div>
          ))}
        </div>
        <button
          onClick={startParsing}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium text-sm
            hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          开始 AI 解析
        </button>
      </div>
    );
  }

  if (parsing) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">AI 正在解析...</h3>
          <p className="text-sm text-gray-500 mt-1">识别产品规格、材质、尺寸等信息</p>
        </div>
        <div className="space-y-2 text-left max-w-xs mx-auto">
          {['识别产品类型...', '提取尺寸规格...', '分析材质要求...', '估算复杂度...'].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.8 }}
              className="flex items-center gap-2 text-xs text-gray-500"
            >
              <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              {step}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-800">解析失败</h3>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={startParsing}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    );
  }

  return null;
}

// ── Step 3: 确认规格 ──────────────────────────────────────────────────────────

function SpecConfirmStep({
  spec,
  onConfirmed,
  onBack,
}: {
  spec: ParsedSpec;
  onConfirmed: (spec: ParsedSpec) => void;
  onBack: () => void;
}) {
  const [editedSpec, setEditedSpec] = useState<ParsedSpec>(spec);

  const update = (key: keyof ParsedSpec, value: any) => {
    setEditedSpec(prev => ({ ...prev, [key]: value }));
  };

  const complexityLabels = { simple: '简单', medium: '中等', complex: '复杂' };
  const complexityColors = { simple: 'text-green-600 bg-green-50', medium: 'text-yellow-600 bg-yellow-50', complex: 'text-red-600 bg-red-50' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">确认产品规格</h3>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${complexityColors[editedSpec.estimatedComplexity ?? 'medium']}`}>
          {complexityLabels[editedSpec.estimatedComplexity ?? 'medium']}复杂度
        </div>
      </div>

      {/* AI 置信度 */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
        <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-blue-700 font-medium">AI 解析置信度</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-blue-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${editedSpec.confidence}%` }}
              />
            </div>
            <span className="text-xs text-blue-600 font-semibold">{editedSpec.confidence}%</span>
          </div>
        </div>
        <p className="text-xs text-blue-600">请检查并修正以下信息</p>
      </div>

      {/* 规格表单 */}
      <div className="grid grid-cols-1 gap-4">
        {/* 产品名称 */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            <Tag className="w-3.5 h-3.5" />产品名称 *
          </label>
          <input
            value={editedSpec.productName}
            onChange={(e) => update('productName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="例：定制棉质 T 恤"
          />
        </div>

        {/* 产品类别 */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            <Layers className="w-3.5 h-3.5" />产品类别
          </label>
          <input
            value={editedSpec.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="例：Apparel / Electronics / Furniture"
          />
        </div>

        {/* 材质 & 尺寸 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <Package className="w-3.5 h-3.5" />材质
            </label>
            <input
              value={editedSpec.material ?? ''}
              onChange={(e) => update('material', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="例：100% 棉"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <Ruler className="w-3.5 h-3.5" />尺寸规格
            </label>
            <input
              value={editedSpec.dimensions ?? ''}
              onChange={(e) => update('dimensions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="例：S/M/L/XL"
            />
          </div>
        </div>

        {/* 数量 & 预算 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <Package className="w-3.5 h-3.5" />预计数量
            </label>
            <input
              type="number"
              value={editedSpec.quantity ?? ''}
              onChange={(e) => update('quantity', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="例：500"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <Clock className="w-3.5 h-3.5" />期望交期（天）
            </label>
            <input
              type="number"
              value={editedSpec.suggestedLeadTime ?? ''}
              onChange={(e) => update('suggestedLeadTime', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="例：30"
            />
          </div>
        </div>

        {/* 预算范围 */}
        {editedSpec.suggestedBudgetRange && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <DollarSign className="w-3.5 h-3.5" />预算范围（{editedSpec.suggestedBudgetRange.currency}/件）
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editedSpec.suggestedBudgetRange.min}
                onChange={(e) => update('suggestedBudgetRange', {
                  ...editedSpec.suggestedBudgetRange!,
                  min: parseFloat(e.target.value) || 0,
                })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="最低"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                value={editedSpec.suggestedBudgetRange.max}
                onChange={(e) => update('suggestedBudgetRange', {
                  ...editedSpec.suggestedBudgetRange!,
                  max: parseFloat(e.target.value) || 0,
                })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="最高"
              />
            </div>
          </div>
        )}

        {/* 特殊要求 */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            特殊要求 / 备注
          </label>
          <textarea
            value={editedSpec.specialRequirements ?? ''}
            onChange={(e) => update('specialRequirements', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            placeholder="例：需要环保认证、特殊包装要求、颜色 Pantone 编号等"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium
            hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />重新上传
        </button>
        <button
          onClick={() => onConfirmed(editedSpec)}
          disabled={!editedSpec.productName}
          className="flex-2 flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium
            hover:bg-blue-600 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
        >
          确认规格
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 4: 发送询价 ──────────────────────────────────────────────────────────

function SendStep({
  spec,
  files,
  demandId,
  onComplete,
  onBack,
}: {
  spec: ParsedSpec;
  files: UploadedFile[];
  demandId?: number;
  onComplete?: (rfqId: number) => void;
  onBack: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [rfqId, setRfqId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCustomRfq = trpc.rfq.createCustomRfq.useMutation({
    onSuccess: (data: any) => {
      setSending(false);
      setSent(true);
      setRfqId(data.rfqId);
      onComplete?.(data.rfqId);
    },
    onError: (e: any) => {
      setSending(false);
      setError(e.message);
    },
  });

  const handleSend = () => {
    setSending(true);
    setError(null);
    createCustomRfq.mutate({
      demandId,
      productName: spec.productName,
      category: spec.category,
      material: spec.material,
      dimensions: spec.dimensions,
      color: spec.color,
      quantity: spec.quantity,
      specialRequirements: spec.specialRequirements,
      estimatedComplexity: spec.estimatedComplexity,
      suggestedLeadTime: spec.suggestedLeadTime,
      budgetMin: spec.suggestedBudgetRange?.min,
      budgetMax: spec.suggestedBudgetRange?.max,
      budgetCurrency: spec.suggestedBudgetRange?.currency ?? 'USD',
      designFileUrls: files.map(f => f.url),
    });
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-6"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">定制询价已发送！</h3>
        <p className="text-sm text-gray-500">
          我们已将您的定制需求发送给匹配的工厂，
          <br />通常在 30 分钟内收到报价。
        </p>
        {rfqId && (
          <p className="text-xs text-gray-400">询价单号：RFQ-{rfqId}</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">确认发送定制询价</h3>

      {/* 规格摘要 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">产品名称</span>
          <span className="font-medium text-gray-800">{spec.productName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">类别</span>
          <span className="font-medium text-gray-800">{spec.category}</span>
        </div>
        {spec.material && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">材质</span>
            <span className="font-medium text-gray-800">{spec.material}</span>
          </div>
        )}
        {spec.dimensions && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">尺寸</span>
            <span className="font-medium text-gray-800">{spec.dimensions}</span>
          </div>
        )}
        {spec.quantity && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">数量</span>
            <span className="font-medium text-gray-800">{spec.quantity} 件</span>
          </div>
        )}
        {spec.suggestedLeadTime && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">期望交期</span>
            <span className="font-medium text-gray-800">{spec.suggestedLeadTime} 天</span>
          </div>
        )}
        {spec.suggestedBudgetRange && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">预算范围</span>
            <span className="font-medium text-gray-800">
              {spec.suggestedBudgetRange.currency} {spec.suggestedBudgetRange.min}–{spec.suggestedBudgetRange.max}/件
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">设计稿</span>
          <span className="font-medium text-gray-800">{files.length} 个文件</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={sending}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium
            hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />修改规格
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium
            hover:from-blue-600 hover:to-purple-600 disabled:opacity-40 transition-all
            flex items-center justify-center gap-1.5"
        >
          {sending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />发送中...</>
          ) : (
            <><Send className="w-4 h-4" />发送询价</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function CustomQuoteWizard({ demandId, onComplete, onClose }: CustomQuoteWizardProps) {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parsedSpec, setParsedSpec] = useState<ParsedSpec | null>(null);
  const [confirmedSpec, setConfirmedSpec] = useState<ParsedSpec | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-semibold text-base">定制报价向导</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <StepIndicator current={step} />
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <UploadStep
                onUploaded={(files) => {
                  setUploadedFiles(files);
                  setStep(2);
                }}
              />
            )}
            {step === 2 && (
              <ParseStep
                files={uploadedFiles}
                onParsed={(spec) => {
                  setParsedSpec(spec);
                  setStep(3);
                }}
              />
            )}
            {step === 3 && parsedSpec && (
              <SpecConfirmStep
                spec={parsedSpec}
                onConfirmed={(spec) => {
                  setConfirmedSpec(spec);
                  setStep(4);
                }}
                onBack={() => setStep(1)}
              />
            )}
            {step === 4 && confirmedSpec && (
              <SendStep
                spec={confirmedSpec}
                files={uploadedFiles}
                demandId={demandId}
                onComplete={onComplete}
                onBack={() => setStep(3)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
