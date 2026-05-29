export const APP_CONFIG = Object.freeze({
  S3: {
    BUCKET_NAME: process.env.S3_BUCKET_NAME ?? 'faceguard-attendance',
    REGION: process.env.AWS_REGION ?? 'ap-south-1',
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? '',
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  SYNC: {
    BACKGROUND_FETCH_INTERVAL_MINUTES: 15,
    BATCH_SIZE: 100,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY_MS: 1000,
    PURGE_AFTER_MS: 24 * 60 * 60 * 1000,
  },
  DB: {
    NAME: 'faceguard.db',
    VERSION: 1,
  },
  RECOGNITION: {
    RESULT_DISPLAY_MS: 3000,
    LIVENESS_FAIL_DISPLAY_MS: 2000,
    NO_MATCH_DISPLAY_MS: 2000,
    DUPLICATE_CHECK_THRESHOLD: 0.75,
  },
  CAMERA: {
    FPS: 30,
    FRAME_SKIP: 2,
  },
} as const);
