import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SyncStatus } from '../types';

interface SyncStatusBadgeProps {
  syncStatus: SyncStatus;
}

function formatSyncTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getBadgeColor(syncStatus: SyncStatus): string {
  if (syncStatus.lastError != null) {
    return '#EF4444'; // red – error
  }
  if (syncStatus.pending > 0) {
    return '#F97316'; // orange – items waiting
  }
  return '#22C55E'; // green – all clear
}

const SyncStatusBadge = memo<SyncStatusBadgeProps>(({ syncStatus }) => {
  // Animated dots for "Syncing..."
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  const dotLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Scale pulse when state changes
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Brief pop on any status change
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.12,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [syncStatus.pending, syncStatus.lastError, syncStatus.isSyncing]);

  useEffect(() => {
    if (syncStatus.isSyncing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(dot1Opacity, { toValue: 0.3, duration: 280, useNativeDriver: true }),
            Animated.timing(dot2Opacity, { toValue: 0.3, duration: 280, useNativeDriver: true }),
            Animated.timing(dot3Opacity, { toValue: 0.3, duration: 280, useNativeDriver: true }),
          ]),
        ]),
      );
      dotLoopRef.current = loop;
      loop.start();
    } else {
      dotLoopRef.current?.stop();
      dotLoopRef.current = null;
      dot1Opacity.setValue(0.3);
      dot2Opacity.setValue(0.3);
      dot3Opacity.setValue(0.3);
    }

    return () => {
      dotLoopRef.current?.stop();
    };
  }, [syncStatus.isSyncing]);

  const badgeColor = getBadgeColor(syncStatus);

  const renderContent = () => {
    if (syncStatus.isSyncing) {
      return (
        <View style={styles.row}>
          <Text style={styles.icon}>☁</Text>
          <Text style={styles.label}>Syncing</Text>
          <Animated.Text style={[styles.dot, { opacity: dot1Opacity }]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot2Opacity }]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot3Opacity }]}>.</Animated.Text>
        </View>
      );
    }

    if (syncStatus.lastError != null) {
      return (
        <View style={styles.row}>
          <Text style={styles.icon}>☁</Text>
          <Text style={styles.label} numberOfLines={1}>
            Sync error
          </Text>
        </View>
      );
    }

    if (syncStatus.pending > 0) {
      return (
        <View style={styles.row}>
          <Text style={styles.icon}>⬆</Text>
          <Text style={styles.label}>{syncStatus.pending} pending</Text>
        </View>
      );
    }

    // All clear
    if (syncStatus.lastSyncAt != null) {
      return (
        <View style={styles.row}>
          <Text style={styles.icon}>✓</Text>
          <Text style={styles.label}>{formatSyncTime(syncStatus.lastSyncAt)}</Text>
        </View>
      );
    }

    return (
      <View style={styles.row}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.label}>Synced</Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: `${badgeColor}22`, borderColor: badgeColor, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {renderContent()}
    </Animated.View>
  );
});

SyncStatusBadge.displayName = 'SyncStatusBadge';

export default SyncStatusBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 12,
    color: '#F1F5F9',
  },
  label: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dot: {
    color: '#F1F5F9',
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
  },
});
