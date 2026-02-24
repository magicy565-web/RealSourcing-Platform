import { Router } from 'express';
import multer from 'multer';
import { ossUploadBuffer, isOSSError } from './ossStorageService';
import { authenticateUser } from './sdk';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

/**
 * POST /api/upload
 * 前端文件上传接口，支持 PDF, Images, Drawings 等
 */
router.post('/', async (req, res) => {
  // 1. 鉴权
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. 处理文件
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // 3. 上传到 OSS
      const result = await ossUploadBuffer(
        req.file.buffer,
        req.file.originalname,
        'uploads',
        req.file.mimetype
      );

      if (isOSSError(result)) {
        return res.status(500).json(result);
      }

      console.log(`✅ [Upload] User ${user.id} uploaded ${req.file.originalname} -> ${result.url}`);
      
      return res.json({
        url: result.url,
        key: result.key,
        size: result.size,
        mimetype: req.file.mimetype
      });
    } catch (uploadErr) {
      console.error('❌ [Upload] Critical failure:', uploadErr);
      return res.status(500).json({ error: 'Internal server error during upload' });
    }
  });
});

export default router;
