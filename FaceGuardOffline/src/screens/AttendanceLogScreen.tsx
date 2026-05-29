import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AttendanceRecord } from '../types';
import {
  getRecentRecords,
  getTodayRecords,
  getPendingRecords,
  getPendingCount,
  getTodayCount,
} from '../db/AttendanceRepository';
import { useNetworkSync } from '../hooks/useNetworkSync';
import ConfidenceBar from '../components/ConfidenceBar';
import SyncStatusBadge from '../components/SyncStatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<RootStackParamList, 'AttendanceLog'>;

type FilterTab = 'All' | 'Today' | 'Pending';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${min}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SyncDotProps {
  synced: boolean;
}

function SyncDot({ synced }: SyncDotProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.syncDot,
        { backgroundColor: synced ? '#22C55E' : '#F97316' },
      ]}
    >
      <Text style={styles.syncDotText}>{synced ? '✓' : '●'}</Text>
    </View>
  );
}

interface RecordRowProps {
  record: AttendanceRecord;
}

const RecordRow = React.memo<RecordRowProps>(({ record }) => (
  <View style={styles.row}>
    {/* Left column — name, code, time */}
    <View style={styles.rowLeft}>
      <Text style={styles.rowName} numberOfLines={1}>
        {record.employeeName}
      </Text>
      <Text style={styles.rowCode}>{record.employeeId.slice(0, 8).toUpperCase()}</Text>
      <Text style={styles.rowTime}>{formatTimestamp(record.timestamp)}</Text>
    </View>

    {/* Right column — confidence bar, liveness, sync badge */}
    <View style={styles.rowRight}>
      <ConfidenceBar value={record.confidence} label="Match" />
      <View style={styles.livenessRow}>
        <Text style={styles.livenessLabel}>Liveness</Text>
        <Text style={styles.livenessValue}>
          {(record.livenessScore * 100).toFixed(0)}%
        </Text>
      </View>
      <View style={styles.syncRow}>
        <SyncDot synced={record.synced} />
        <Text style={[styles.syncLabel, { color: record.synced ? '#22C55E' : '#F97316' }]}>
          {record.synced ? 'Synced' : 'Pending'}
        </Text>
      </View>
    </View>
  </View>
));

RecordRow.displayName = 'RecordRow';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }): React.JSX.Element {
  const message =
    tab === 'Today'
      ? 'No attendance recorded today.'
      : tab === 'Pending'
      ? 'All records synced — nothing pending.'
      : 'No attendance records yet.';

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AttendanceLogScreen({ navigation }: Props): React.JSX.Element {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncingManual, setIsSyncingManual] = useState<boolean>(false);

  const { syncStatus, triggerSync } = useNetworkSync();

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadRecords = useCallback(
    async (tab: FilterTab): Promise<void> => {
      const [fetched, todayCnt, pendingCnt] = await Promise.all([
        tab === 'All'
          ? getRecentRecords(200)
          : tab === 'Today'
          ? getTodayRecords()
          : getPendingRecords(200),
        getTodayCount(),
        getPendingCount(),
      ]);
      setRecords(fetched);
      setTodayCount(todayCnt);
      setPendingCount(pendingCnt);
    },
    [],
  );

  // Reload whenever screen gains focus or tab changes
  useFocusEffect(
    useCallback(() => {
      loadRecords(activeTab).catch((err: unknown) => {
        if (__DEV__) {
          console.error('AttendanceLogScreen: loadRecords failed:', err);
        }
      });
    }, [activeTab, loadRecords]),
  );

  // ── Pull-to-refresh ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRecords(activeTab);
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('AttendanceLogScreen: refresh failed:', err);
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, loadRecords]);

  // ── Tab change ────────────────────────────────────────────────────────────

  const handleTabChange = useCallback(
    (tab: FilterTab) => {
      setActiveTab(tab);
      // loadRecords is triggered by the useFocusEffect dependency on activeTab
    },
    [],
  );

  // ── Manual sync ───────────────────────────────────────────────────────────

  const handleSyncNow = useCallback(async () => {
    setIsSyncingManual(true);
    try {
      await triggerSync();
      await loadRecords(activeTab);
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('AttendanceLogScreen: sync failed:', err);
      }
    } finally {
      setIsSyncingManual(false);
    }
  }, [triggerSync, loadRecords, activeTab]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: AttendanceRecord }) => <RecordRow record={item} />,
    [],
  );

  const keyExtractor = useCallback((item: AttendanceRecord) => item.id, []);

  const TABS: FilterTab[] = ['All', 'Today', 'Pending'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Log</Text>
        <SyncStatusBadge syncStatus={syncStatus} />
      </View>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, pendingCount > 0 && styles.statValuePending]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending Sync</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={[styles.syncNowButton, isSyncingManual && styles.syncNowButtonDisabled]}
          onPress={handleSyncNow}
          disabled={isSyncingManual}
          activeOpacity={0.75}
        >
          <Text style={styles.syncNowText}>
            {isSyncingManual ? 'Syncing…' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabChange(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Records list ─────────────────────────────────────────────────────── */}
      <FlatList<AttendanceRecord>
        data={records}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          records.length === 0 ? styles.listEmptyContainer : styles.listContent
        }
        ListEmptyComponent={<EmptyState tab={activeTab} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
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

  // ── Stats bar ────────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statValuePending: {
    color: '#F97316',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  syncNowButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  syncNowButtonDisabled: {
    backgroundColor: '#1E3A5F',
    opacity: 0.6,
  },
  syncNowText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  listEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  separator: {
    height: 10,
  },

  // ── Row ──────────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  rowLeft: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  rowName: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
  },
  rowCode: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowTime: {
    color: '#94A3B8',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  rowRight: {
    flex: 1.2,
    gap: 8,
    justifyContent: 'center',
  },
  livenessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livenessLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  livenessValue: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncDotText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  syncLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
