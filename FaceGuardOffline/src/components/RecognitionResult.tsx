import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { RecognitionResult } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_HEIGHT = 280;
const HIDDEN_Y = CARD_HEIGHT + 40;

interface RecognitionResultProps {
  result: RecognitionResult | null;
  visible: boolean;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const RecognitionResultCard = memo<RecognitionResultProps>(({ result, visible }) => {
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : HIDDEN_Y,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!result && !visible) {
    return null;
  }

  const isMatch = result?.matched ?? false;
  const accentColor = isMatch ? '#22C55E' : '#EF4444';
  const matchLabel = isMatch ? 'MATCH ✓' : 'NO MATCH ✗';

  const employeeName = result?.employee?.name ?? 'Face Not Recognised';
  const employeeCode = result?.employee?.employeeCode ?? '—';
  const confidence = result != null ? (result.similarity * 100).toFixed(1) : '—';
  const liveness = result != null ? (result.livenessScore * 100).toFixed(0) : '—';
  const timestamp = result != null ? formatTimestamp(Date.now()) : '—';

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      {/* Top accent strip */}
      <View style={[styles.accentStrip, { backgroundColor: accentColor }]}>
        <Text style={styles.matchLabel}>{matchLabel}</Text>
      </View>

      {/* Card body */}
      <View style={styles.body}>
        {/* Employee name */}
        <Text
          style={[styles.employeeName, !isMatch && styles.noMatchName]}
          numberOfLines={2}
        >
          {employeeName}
        </Text>

        {/* Employee code */}
        {isMatch && result?.employee?.employeeCode != null && (
          <Text style={styles.employeeCode}>{employeeCode}</Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCell label="Confidence" value={`${confidence}%`} color={accentColor} />
          <View style={styles.statDivider} />
          <StatCell label="Liveness" value={`${liveness}%`} color="#3B82F6" />
          <View style={styles.statDivider} />
          <StatCell label="Time" value={timestamp} color="#94A3B8" />
        </View>
      </View>
    </Animated.View>
  );
});

RecognitionResultCard.displayName = 'RecognitionResultCard';

export default RecognitionResultCard;

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCellProps {
  label: string;
  value: string;
  color: string;
}

const StatCell = memo<StatCellProps>(({ label, value, color }) => (
  <View style={styles.statCell}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

StatCell.displayName = 'StatCell';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  accentStrip: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  employeeName: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  noMatchName: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  employeeCode: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#1E293B',
  },
});
