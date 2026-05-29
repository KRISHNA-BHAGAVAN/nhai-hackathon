import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { MODELS, LIVENESS_CONFIG } from '../constants/ModelConfig';
import { APP_CONFIG } from '../constants/AppConfig';
import { getAllEmployees, deleteEmployee } from '../db/EmployeeRepository';
import { getRecentRecords, getPendingRecords } from '../db/AttendanceRepository';
import { getDatabase } from '../db/Database';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

// ─── App version (static — update manually on release) ───────────────────────

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Info row (label + value) ─────────────────────────────────────────────────

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider(): React.JSX.Element {
  return <View style={styles.divider} />;
}

// ─── Danger button ────────────────────────────────────────────────────────────

function DangerButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.dangerButton, disabled === true && styles.dangerButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={styles.dangerButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Neutral button ───────────────────────────────────────────────────────────

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.actionButton, disabled === true && styles.actionButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Threshold display row ────────────────────────────────────────────────────

function ThresholdDisplay({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}): React.JSX.Element {
  return (
    <View style={styles.thresholdRow}>
      <View style={styles.thresholdHeader}>
        <Text style={styles.thresholdLabel}>{label}</Text>
        <View style={styles.thresholdBadge}>
          <Text style={styles.thresholdBadgeText}>{value.toFixed(2)}</Text>
        </View>
      </View>
      <Text style={styles.thresholdDescription}>{description}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // ── Flush all data ────────────────────────────────────────────────────────

  const handleFlushAll = useCallback(() => {
    Alert.alert(
      'Flush All Data',
      'This will permanently delete ALL enrolled employees and ALL attendance records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            setIsFlushing(true);

            (async () => {
              try {
                const employees = await getAllEmployees();
                await Promise.all(employees.map((emp) => deleteEmployee(emp.id)));

                const db = await getDatabase();
                await db.executeSql('DELETE FROM attendance_log;');

                Alert.alert(
                  'Data Flushed',
                  `Deleted ${employees.length} employee(s) and all attendance records.`,
                );
              } catch (err: unknown) {
                Alert.alert('Error', 'Failed to flush data: ' + String(err));
              } finally {
                setIsFlushing(false);
              }
            })();
          },
        },
      ],
    );
  }, []);

  // ── Export logs (dev only) ────────────────────────────────────────────────

  const handleExportLogs = useCallback(async () => {
    if (!__DEV__) return;

    setIsExporting(true);
    try {
      const pending = await getPendingRecords(1000);
      const all = await getRecentRecords(1000);
      console.log(
        '[FaceGuard Export] Pending records:',
        pending.length,
        '| Total recent:',
        all.length,
      );
      console.log('[FaceGuard Export] Pending sample:', JSON.stringify(pending.slice(0, 5), null, 2));
      Alert.alert(
        'Exported',
        `Logged ${pending.length} pending record(s) and ${all.length} total record(s) to the console.`,
      );
    } catch (err: unknown) {
      Alert.alert('Export Error', String(err));
    } finally {
      setIsExporting(false);
    }
  }, []);

  // ── Clear model cache ─────────────────────────────────────────────────────

  const handleClearModelCache = useCallback(() => {
    Alert.alert(
      'Clear Model Cache',
      'TFLite models are bundled with the app and load fresh each launch. Clearing the cache requires a full app restart to take effect.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart App',
          onPress: () => {
            Alert.alert(
              'Restart Required',
              'Please close and relaunch the app to clear the model cache.',
            );
          },
        },
      ],
    );
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent />

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Thresholds (read-only) ─────────────────────────────────────────── */}
        <Section title="Model Thresholds">
          <ThresholdDisplay
            label="Similarity Threshold"
            value={MODELS.MOBILEFACENET.similarityThreshold}
            description="Minimum cosine similarity for a face to be recognised as a known employee. Higher values require a closer match."
          />
          <Divider />
          <ThresholdDisplay
            label="Liveness Threshold"
            value={MODELS.MINIFASNET.livenessThreshold}
            description="Minimum MiniFASNet score to pass the passive liveness check. Increase to reject more spoofs."
          />
          <Divider />
          <ThresholdDisplay
            label="Detection Score Threshold"
            value={MODELS.BLAZEFACE.scoreThreshold}
            description="Minimum BlazeFace confidence to consider a detected face valid."
          />
          <Divider />
          <View style={styles.rebuildNotice}>
            <Text style={styles.rebuildNoticeText}>
              Threshold changes require updating constants and rebuilding the app.
            </Text>
          </View>
        </Section>

        {/* ── Model info ────────────────────────────────────────────────────── */}
        <Section title="Bundled Models">
          <InfoRow
            label="BlazeFace (detector)"
            value={`${MODELS.BLAZEFACE.inputWidth}x${MODELS.BLAZEFACE.inputHeight} · ~1 MB`}
          />
          <Divider />
          <InfoRow
            label="MobileFaceNet (embedder)"
            value={`${MODELS.MOBILEFACENET.inputWidth}x${MODELS.MOBILEFACENET.inputHeight} · ~2 MB`}
          />
          <Divider />
          <InfoRow
            label="MiniFASNet (liveness)"
            value={`${MODELS.MINIFASNET.inputWidth}x${MODELS.MINIFASNET.inputHeight} · ~1.5 MB`}
          />
          <Divider />
          <InfoRow label="Embedding Dimension" value={`${MODELS.MOBILEFACENET.embeddingDim}D`} />
          <Divider />
          <ActionButton label="Clear Model Cache" onPress={handleClearModelCache} />
        </Section>

        {/* ── Liveness config ────────────────────────────────────────────────── */}
        <Section title="Liveness Challenge Config">
          <InfoRow
            label="Challenges Required"
            value={String(LIVENESS_CONFIG.CHALLENGES_REQUIRED)}
          />
          <Divider />
          <InfoRow
            label="Challenge Timeout"
            value={`${LIVENESS_CONFIG.CHALLENGE_TIMEOUT_MS} ms`}
          />
          <Divider />
          <InfoRow
            label="Blink EAR Threshold"
            value={LIVENESS_CONFIG.EAR_BLINK_THRESHOLD.toFixed(2)}
          />
          <Divider />
          <InfoRow
            label="Smile Threshold"
            value={LIVENESS_CONFIG.SMILE_THRESHOLD.toFixed(2)}
          />
          <Divider />
          <InfoRow
            label="Head Turn Degrees"
            value={`${LIVENESS_CONFIG.HEAD_TURN_DEGREES}°`}
          />
          <Divider />
          <InfoRow label="Nod Degrees" value={`${LIVENESS_CONFIG.NOD_DEGREES}°`} />
        </Section>

        {/* ── Recognition config ────────────────────────────────────────────── */}
        <Section title="Recognition Config">
          <InfoRow
            label="Result Display"
            value={`${APP_CONFIG.RECOGNITION.RESULT_DISPLAY_MS} ms`}
          />
          <Divider />
          <InfoRow
            label="No-Match Display"
            value={`${APP_CONFIG.RECOGNITION.NO_MATCH_DISPLAY_MS} ms`}
          />
          <Divider />
          <InfoRow
            label="Duplicate Check Threshold"
            value={APP_CONFIG.RECOGNITION.DUPLICATE_CHECK_THRESHOLD.toFixed(2)}
          />
          <Divider />
          <InfoRow label="Camera Target FPS" value={String(APP_CONFIG.CAMERA.FPS)} />
          <Divider />
          <InfoRow label="Frame Skip" value={String(APP_CONFIG.CAMERA.FRAME_SKIP)} />
        </Section>

        {/* ── Sync config ───────────────────────────────────────────────────── */}
        <Section title="Sync Config">
          <InfoRow
            label="Background Fetch Interval"
            value={`${APP_CONFIG.SYNC.BACKGROUND_FETCH_INTERVAL_MINUTES} min`}
          />
          <Divider />
          <InfoRow label="Batch Size" value={String(APP_CONFIG.SYNC.BATCH_SIZE)} />
          <Divider />
          <InfoRow
            label="Max Retry Attempts"
            value={String(APP_CONFIG.SYNC.MAX_RETRY_ATTEMPTS)}
          />
          <Divider />
          <InfoRow
            label="Purge Synced Records After"
            value={`${APP_CONFIG.SYNC.PURGE_AFTER_MS / (60 * 60 * 1000)} hours`}
          />
          <Divider />
          <InfoRow label="S3 Region" value={APP_CONFIG.S3.REGION} />
          <Divider />
          <InfoRow label="S3 Bucket" value={APP_CONFIG.S3.BUCKET_NAME} />
        </Section>

        {/* ── App info ──────────────────────────────────────────────────────── */}
        <Section title="App Info">
          <InfoRow label="Version" value={APP_VERSION} />
          <Divider />
          <InfoRow label="Build" value={BUILD_NUMBER} />
          <Divider />
          <InfoRow label="Platform" value={Platform.OS === 'android' ? 'Android' : 'iOS'} />
          <Divider />
          <InfoRow label="DB Name" value={APP_CONFIG.DB.NAME} />
          <Divider />
          <InfoRow label="DB Version" value={String(APP_CONFIG.DB.VERSION)} />
        </Section>

        {/* ── Developer tools ───────────────────────────────────────────────── */}
        {__DEV__ && (
          <Section title="Developer Tools">
            <Text style={styles.devWarning}>These options are only visible in debug builds.</Text>
            <Divider />
            <ActionButton
              label={isExporting ? 'Exporting…' : 'Export Logs to Console'}
              onPress={handleExportLogs}
              disabled={isExporting}
            />
          </Section>
        )}

        {/* ── Danger zone ───────────────────────────────────────────────────── */}
        <Section title="Danger Zone">
          <Text style={styles.dangerZoneWarning}>
            These actions are permanent and cannot be reversed.
          </Text>
          <Divider />
          <DangerButton
            label={isFlushing ? 'Deleting…' : 'Flush All Data'}
            onPress={handleFlushAll}
            disabled={isFlushing}
          />
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FaceGuard Offline · v{APP_VERSION}</Text>
          <Text style={styles.footerSubText}>
            All biometric data stays on-device. Attendance is synced encrypted.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
    minWidth: 64,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    minWidth: 64,
  },

  // ── Scroll content ────────────────────────────────────────────────────────
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 24,
  },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 4,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#0F172A',
    marginHorizontal: 0,
  },

  // ── Info row ─────────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    maxWidth: '50%',
  },

  // ── Threshold display ─────────────────────────────────────────────────────
  thresholdRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  thresholdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thresholdLabel: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  thresholdBadge: {
    backgroundColor: '#3B82F622',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  thresholdBadgeText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  thresholdDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  rebuildNotice: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rebuildNoticeText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // ── Action button ─────────────────────────────────────────────────────────
  actionButton: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Danger button ─────────────────────────────────────────────────────────
  dangerButton: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dangerButtonDisabled: {
    opacity: 0.5,
  },
  dangerButtonText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Danger zone warning ───────────────────────────────────────────────────
  dangerZoneWarning: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── Dev warning ───────────────────────────────────────────────────────────
  devWarning: {
    color: '#FBBF24',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 6,
  },
  footerText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  footerSubText: {
    color: '#1E293B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
