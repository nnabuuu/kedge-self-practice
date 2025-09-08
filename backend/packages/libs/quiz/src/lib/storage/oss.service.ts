import { Injectable, Logger } from '@nestjs/common';
import OSS = require('ali-oss');
import { env } from '../../env';

export interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint?: string;
  internal?: boolean;
  cdnDomain?: string;
  pathPrefix?: string;
  publicRead?: boolean;
}

export interface OSSUploadResult {
  url: string;
  path: string;
  etag: string;
}

@Injectable()
export class AliyunOSSService {
  private readonly logger = new Logger(AliyunOSSService.name);
  private client: OSS | null = null;
  private config: OSSConfig | null = null;

  constructor() {
    this.initializeOSS();
  }

  /**
   * Initialize OSS client if configuration is provided
   */
  private initializeOSS(): void {
    const envConfig = env();
    
    // Check if OSS is configured
    if (!envConfig.ALIYUN_OSS_ACCESS_KEY_ID || !envConfig.ALIYUN_OSS_BUCKET) {
      this.logger.log('Aliyun OSS not configured, falling back to filesystem storage');
      return;
    }

    this.config = {
      accessKeyId: envConfig.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: envConfig.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
      bucket: envConfig.ALIYUN_OSS_BUCKET,
      region: envConfig.ALIYUN_OSS_REGION || '',
      endpoint: envConfig.ALIYUN_OSS_ENDPOINT,
      cdnDomain: envConfig.ALIYUN_OSS_CDN_DOMAIN,
      pathPrefix: envConfig.ALIYUN_OSS_PATH_PREFIX || 'quiz-attachments',
      publicRead: envConfig.ALIYUN_OSS_PUBLIC_READ === 'true',
    };

    // Use internal endpoint if specified and running in production
    const endpoint = envConfig.ALIYUN_OSS_INTERNAL_ENDPOINT && envConfig.NODE_ENV === 'production'
      ? envConfig.ALIYUN_OSS_INTERNAL_ENDPOINT
      : envConfig.ALIYUN_OSS_ENDPOINT;

    try {
      this.client = new OSS({
        accessKeyId: this.config!.accessKeyId,
        accessKeySecret: this.config!.accessKeySecret,
        bucket: this.config!.bucket,
        region: this.config!.region,
        endpoint: endpoint,
        secure: true,
        timeout: 60000, // 60 seconds timeout
      });

      this.logger.log(`Aliyun OSS initialized: bucket=${this.config!.bucket}, region=${this.config!.region}`);
    } catch (error) {
      this.logger.error('Failed to initialize Aliyun OSS client', error);
      this.client = null;
      this.config = null;
    }
  }

  /**
   * Check if OSS is configured and available
   */
  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Upload file to OSS
   * @returns Upload result or null if OSS is not configured/fails
   */
  async uploadFile(
    relativePath: string,
    buffer: Buffer,
    options?: {
      mimetype?: string;
      headers?: Record<string, string>;
    }
  ): Promise<OSSUploadResult | null> {
    if (!this.isConfigured() || !this.client || !this.config) {
      return null;
    }

    try {
      // Construct full path with prefix
      const fullPath = this.config.pathPrefix 
        ? `${this.config.pathPrefix}/${relativePath}`
        : relativePath;

      // Prepare upload options
      const uploadOptions: any = {
        headers: {
          ...options?.headers,
        },
      };

      if (options?.mimetype) {
        uploadOptions.mime = options.mimetype;
      }

      // Set ACL if public read is enabled
      if (this.config.publicRead) {
        uploadOptions.headers['x-oss-object-acl'] = 'public-read';
      }

      // Upload to OSS
      const result = await this.client.put(fullPath, buffer, uploadOptions);

      // Generate public URL
      let url: string;
      if (this.config.cdnDomain) {
        // Use CDN domain if configured
        url = `https://${this.config.cdnDomain}/${fullPath}`;
      } else if (this.config.publicRead) {
        // Use OSS public URL
        url = result.url;
      } else {
        // Generate signed URL for private objects (valid for 1 hour)
        url = this.client.signatureUrl(fullPath, { expires: 3600 });
      }

      this.logger.debug(`Successfully uploaded to OSS: ${fullPath}`);

      return {
        url,
        path: fullPath,
        etag: (result.res.headers as any).etag,
      };
    } catch (error) {
      this.logger.error(`Failed to upload to OSS: ${relativePath}`, error);
      return null;
    }
  }

  /**
   * Download file from OSS
   * @returns File buffer or null if OSS is not configured/fails
   */
  async downloadFile(relativePath: string): Promise<Buffer | null> {
    if (!this.isConfigured() || !this.client || !this.config) {
      return null;
    }

    try {
      // Construct full path with prefix
      const fullPath = this.config.pathPrefix 
        ? `${this.config.pathPrefix}/${relativePath}`
        : relativePath;

      const result = await this.client.get(fullPath);
      
      this.logger.debug(`Successfully downloaded from OSS: ${fullPath}`);
      
      return result.content as Buffer;
    } catch (error) {
      this.logger.error(`Failed to download from OSS: ${relativePath}`, error);
      return null;
    }
  }

  /**
   * Delete file from OSS
   * @returns true if successful, false otherwise
   */
  async deleteFile(relativePath: string): Promise<boolean> {
    if (!this.isConfigured() || !this.client || !this.config) {
      return false;
    }

    try {
      const fullPath = this.config.pathPrefix 
        ? `${this.config.pathPrefix}/${relativePath}`
        : relativePath;

      await this.client.delete(fullPath);
      
      this.logger.debug(`Successfully deleted from OSS: ${fullPath}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete from OSS: ${relativePath}`, error);
      return false;
    }
  }

  /**
   * Check if file exists in OSS
   */
  async fileExists(relativePath: string): Promise<boolean> {
    if (!this.isConfigured() || !this.client || !this.config) {
      return false;
    }

    try {
      const fullPath = this.config.pathPrefix 
        ? `${this.config.pathPrefix}/${relativePath}`
        : relativePath;

      await this.client.head(fullPath);
      return true;
    } catch (error) {
      if ((error as any).code === 'NoSuchKey') {
        return false;
      }
      this.logger.error(`Failed to check file existence in OSS: ${relativePath}`, error);
      return false;
    }
  }

  /**
   * Get signed URL for private object
   */
  getSignedUrl(relativePath: string, expiresInSeconds: number = 3600): string | null {
    if (!this.isConfigured() || !this.client || !this.config) {
      return null;
    }

    try {
      const fullPath = this.config.pathPrefix 
        ? `${this.config.pathPrefix}/${relativePath}`
        : relativePath;

      return this.client.signatureUrl(fullPath, { expires: expiresInSeconds });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${relativePath}`, error);
      return null;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix: string, maxResults: number = 100): Promise<string[]> {
    if (!this.isConfigured() || !this.client || !this.config) {
      return [];
    }

    try {
      const fullPrefix = this.config.pathPrefix 
        ? `${this.config.pathPrefix}/${prefix}`
        : prefix;

      const result = await this.client.list({
        prefix: fullPrefix,
        'max-keys': maxResults,
      }, {});

      return result.objects?.map((obj: any) => obj.name) || [];
    } catch (error) {
      this.logger.error(`Failed to list files in OSS: ${prefix}`, error);
      return [];
    }
  }
}