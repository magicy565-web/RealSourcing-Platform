import { Router } from 'express';
import multer from 'multer';
import { ossUploadBuffer, isOSSError } from './ossStorageService';
import { sdk } from './sdk';

const router = Router();

// ── MIME 类型白名单 ────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'text/plain',
  'text/csv',
]);

const FACTORY_FILE_TYPE_MAP: Record<string, string> = {
  'application/pdf': 'product_catalog',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'pricing_sheet',
  'application/vnd.ms-excel': 'pricing_sheet',
  'image/jpeg': 'factory_intro',
  'image/png': 'factory_intro',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

async function authenticate(req: any) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

/**
 * POST /api/upload
 * 单文件上传（通用），前端 FormData 字段名：file
 */
router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }

    try {
      const result = await ossUploadBuffer(
        req.file.buffer,
        req.file.originalname,
        'uploads',
        req.file.mimetype
      );

      if (isOSSError(result)) {
        return res.status(500).json(result);
      }

      console.log(`✅ [Upload] User ${user.id} uploaded "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)}KB) → ${result.url}`);

      return res.json({
        url: result.url,
        key: result.key,
        size: result.size,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
      });
    } catch (uploadErr) {
      console.error('❌ [Upload] Critical failure:', uploadErr);
      return res.status(500).json({ error: 'Internal server error during upload' });
    }
  });
});

/**
 * POST /api/upload/batch
 * 批量文件上传（最多 10 个），前端 FormData 字段名：files
 */
router.post('/batch', (req, res) => {
  upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded. Use field name "files".' });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await ossUploadBuffer(file.buffer, file.originalname, 'uploads', file.mimetype);
          if (isOSSError(result)) return { error: result.error, originalName: file.originalname };
          return { url: result.url, key: result.key, size: result.size, mimetype: file.mimetype, originalName: file.originalname };
        } catch {
          return { error: 'Upload failed', originalName: file.originalname };
        }
      })
    );

    const successCount = results.filter(r => !('error' in r)).length;
    console.log(`✅ [Upload/Batch] User ${user.id} uploaded ${successCount}/${files.length} files`);
    return res.json({ results, total: files.length, success: successCount });
  });
});

/**
 * POST /api/upload/factory
 * 工厂知识库文件上传，自动触发知识库摄入任务
 * FormData 字段：file（文件）、factoryId（必填）、fileType（可选）
 */
router.post('/factory', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const factoryId = parseInt(req.body?.factoryId);
    if (!factoryId || isNaN(factoryId)) {
      return res.status(400).json({ error: 'factoryId is required and must be a number.' });
    }

    const fileType = req.body?.fileType || FACTORY_FILE_TYPE_MAP[req.file.mimetype] || 'other';

    try {
      const result = await ossUploadBuffer(req.file.buffer, req.file.originalname, 'demands', req.file.mimetype);
      if (isOSSError(result)) return res.status(500).json(result);

      console.log(`✅ [Upload/Factory] User ${user.id} uploaded factory ${factoryId} file "${req.file.originalname}" → ${result.url}`);

      let ingestJobId: string | null = null;
      try {
        const { ingestFactoryKnowledge } = await import('./factoryKnowledgeIngestService');
        const ingestResult = await ingestFactoryKnowledge({
          factoryId,
          fileUrl: result.url,
          fileName: req.file.originalname,
          fileType: fileType as any,
          mimeType: req.file.mimetype,
        });
        ingestJobId = (ingestResult as any)?.jobId ?? null;
      } catch (ingestErr) {
        console.warn(`⚠️ [Upload/Factory] Ingest trigger failed for factory ${factoryId}:`, ingestErr);
      }

      return res.json({
        url: result.url,
        key: result.key,
        size: result.size,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        factoryId,
        fileType,
        ingestJobId,
      });
    } catch (uploadErr) {
      console.error('❌ [Upload/Factory] Critical failure:', uploadErr);
      return res.status(500).json({ error: 'Internal server error during upload' });
    }
  });
});

export default router;
