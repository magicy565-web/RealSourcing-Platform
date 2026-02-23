/**
 * RealSourcing - Aliyun OSS Storage Service
 * 阿里云 OSS 存储服务
 *
 * 用于 Phase 3 Agentic AI 工作流中的媒体资产存储：
 * - 用户上传的视频/PDF 文件
 * - AI 生成的产品渲染图
 * - 采购需求的视觉参考图片
 * - 技术图纸
 *
 * Bucket: demand-os-discord
 * Region: oss-cn-hangzhou
 */

import OSS from 'ali-oss';
import { ENV } from './env';
import { createHash } from 'crypto';

// ── OSS 客户端单例 ─────────────────────────────────────────────────────────────

let ossClient: OSS | null = null;

function getOSSClient(): OSS {
  if (!ossClient) {
    if (!ENV.ossAccessKeyId || !ENV.ossAccessKeySecret) {
      throw new Error('OSS credentials not configured. Set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET.');
    }
    ossClient = new OSS({
      region: ENV.ossRegion,
      accessKeyId: ENV.ossAccessKeyId,
      accessKeySecret: ENV.ossAccessKeySecret,
      bucket: ENV.ossBucket,
      endpoint: ENV.ossEndpoint,
      secure: true,
    });
  }
  return ossClient;
}

// ── 工具函数 ───────────────────────────────────────────────────────────────────

function generateObjectKey(prefix: string, originalName: string): string {
  const timestamp = Date.now();
  const hash = createHash('md5').update(`${timestamp}-${originalName}`).digest('hex').slice(0, 8);
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  return `${prefix}/${timestamp}-${hash}.${ext}`;
}

function getPublicUrl(objectKey: string): string {
  return `https://${ENV.ossBucket}.${ENV.ossEndpoint}/${objectKey}`;
}

// ── 上传接口 ───────────────────────────────────────────────────────────────────

export interface OSSUploadResult {
  key: string;
  url: string;
  size: number;
}

export interface OSSUploadError {
  error: string;
  code: string;
  details?: string;
}

/**
 * 上传 Buffer 数据到 OSS
 */
export async function ossUploadBuffer(
  buffer: Buffer,
  originalName: string,
  prefix: 'demands' | 'renders' | 'references' | 'drawings' | 'uploads' = 'uploads',
  contentType = 'application/octet-stream'
): Promise<OSSUploadResult | OSSUploadError> {
  try {
    const client = getOSSClient();
    const objectKey = generateObjectKey(prefix, originalName);

    const result = await client.put(objectKey, buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

    const url = getPublicUrl(objectKey);
    console.log(`📦 [OSS] Uploaded: ${objectKey} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return {
      key: objectKey,
      url,
      size: buffer.length,
    };
  } catch (err) {
    console.error(`❌ [OSS] Upload failed:`, err);
    return {
      error: 'OSS upload failed',
      code: 'OSS_UPLOAD_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 通过 URL 下载文件并上传到 OSS（用于转存外部图片/视频）
 */
export async function ossUploadFromUrl(
  sourceUrl: string,
  prefix: 'demands' | 'renders' | 'references' | 'drawings' | 'uploads' = 'references',
  maxSizeMB = 50
): Promise<OSSUploadResult | OSSUploadError> {
  try {
    // 下载源文件
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      return {
        error: `Failed to fetch source URL: ${response.status}`,
        code: 'SOURCE_FETCH_ERROR',
      };
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 检查文件大小
    if (buffer.length > maxSizeMB * 1024 * 1024) {
      return {
        error: `File exceeds maximum size of ${maxSizeMB}MB`,
        code: 'FILE_TOO_LARGE',
      };
    }

    // 从 URL 提取文件名
    const urlPath = new URL(sourceUrl).pathname;
    const originalName = urlPath.split('/').pop() ?? 'file';

    return ossUploadBuffer(buffer, originalName, prefix, contentType);
  } catch (err) {
    return {
      error: 'URL to OSS upload failed',
      code: 'URL_UPLOAD_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 生成带签名的临时访问 URL（用于私有文件的临时访问）
 */
export async function ossGetSignedUrl(
  objectKey: string,
  expiresSeconds = 3600
): Promise<string | null> {
  try {
    const client = getOSSClient();
    const url = client.signatureUrl(objectKey, { expires: expiresSeconds });
    return url;
  } catch (err) {
    console.error(`❌ [OSS] Failed to generate signed URL:`, err);
    return null;
  }
}

/**
 * 删除 OSS 对象
 */
export async function ossDelete(objectKey: string): Promise<boolean> {
  try {
    const client = getOSSClient();
    await client.delete(objectKey);
    console.log(`🗑️ [OSS] Deleted: ${objectKey}`);
    return true;
  } catch (err) {
    console.error(`❌ [OSS] Delete failed:`, err);
    return false;
  }
}

/**
 * 检查 OSS 连接是否正常
 */
export async function ossHealthCheck(): Promise<{ ok: boolean; bucket: string; region: string; error?: string }> {
  try {
    const client = getOSSClient();
    await client.getBucketInfo(ENV.ossBucket);
    return { ok: true, bucket: ENV.ossBucket, region: ENV.ossRegion };
  } catch (err) {
    return {
      ok: false,
      bucket: ENV.ossBucket,
      region: ENV.ossRegion,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function isOSSError(result: OSSUploadResult | OSSUploadError): result is OSSUploadError {
  return 'error' in result;
}
