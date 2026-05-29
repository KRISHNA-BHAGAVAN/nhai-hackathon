import S3 from 'aws-sdk/clients/s3';
import { AttendanceRecord } from '../types';
import { APP_CONFIG } from '../constants/AppConfig';
import uuid from 'react-native-uuid';

interface UploadPayload {
  uploadId: string;
  deviceId: string;
  uploadedAt: number;
  records: AttendanceRecord[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class S3Uploader {
  private s3: S3;
  private bucket: string;
  private deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.bucket = APP_CONFIG.S3.BUCKET_NAME;
    this.s3 = new S3({
      region: APP_CONFIG.S3.REGION,
      accessKeyId: APP_CONFIG.S3.ACCESS_KEY_ID,
      secretAccessKey: APP_CONFIG.S3.SECRET_ACCESS_KEY,
      httpOptions: { timeout: 30000 },
    });
  }

  private getS3Key(uploadId: string): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `attendance/${dateStr}/${this.deviceId}/${uploadId}.json`;
  }

  async uploadBatch(records: AttendanceRecord[]): Promise<string[]> {
    if (records.length === 0) return [];

    const uploadId = String(uuid.v4());
    const payload: UploadPayload = {
      uploadId,
      deviceId: this.deviceId,
      uploadedAt: Date.now(),
      records,
    };

    const body = JSON.stringify(payload);
    const key = this.getS3Key(uploadId);

    const maxAttempts = APP_CONFIG.SYNC.MAX_RETRY_ATTEMPTS;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.s3
          .putObject({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: 'application/json',
            Metadata: {
              uploadId,
              deviceId: this.deviceId,
              recordCount: String(records.length),
            },
          })
          .promise();

        return records.map((r) => r.id);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (__DEV__) {
          console.error(
            `S3Uploader: attempt ${attempt + 1} failed:`,
            lastError.message,
          );
        }
        if (attempt < maxAttempts - 1) {
          const delay =
            APP_CONFIG.SYNC.RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    throw new Error(
      `S3 upload failed after ${maxAttempts} attempts: ${lastError?.message ?? 'unknown'}`,
    );
  }
}
