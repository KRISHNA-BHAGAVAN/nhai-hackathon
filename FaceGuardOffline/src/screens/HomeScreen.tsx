import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTodayCount } from '../db/AttendanceRepository';
import { getAllEmployees } from '../db/EmployeeRepository';
import { useNetworkSync } from '../hooks/useNetworkSync';
import SyncStatusBadge from '../components/SyncStatusBadge';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

interface DashboardStats {
  todayCount: number;
  enrolledCount: number;
}

function formatLastSyncTime(ts: number | undefined): string {
  if (ts === undefined) return 'Never synced';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `Last sync: ${dd}/${mo} at ${hh}:${mm}`;
}

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats>({
    todayCount: 0,
    enrolledCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const { syncStatus, triggerSync } = useNetworkSync();

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [todayCount, employees] = await Promise.all([
        getTodayCount(),
        getAllEmployees(),
      ]);
      setStats({ todayCount, enrolledCount: employees.length });
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('HomeScreen: failed to load stats:', err);
      }
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Refresh stats every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>FaceGuard</Text>
            <Text style={styles.headerSubtitle}>Attendance Dashboard</Text>
          </View>
          <SyncStatusBadge syncStatus={syncStatus} />
        </View>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardLeft]}>
            <Text style={styles.statValue}>
              {loadingStats ? '—' : stats.todayCount}
            </Text>
            <Text style={styles.statLabel}>Today's{'\n'}Attendance</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRight]}>
            <Text style={styles.statValue}>
              {loadingStats ? '—' : stats.enrolledCount}
            </Text>
            <Text style={styles.statLabel}>Enrolled{'\n'}Employees</Text>
          </View>
        </View>

        {/* ── Navigation grid ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Actions</Text>
        <View style={styles.grid}>
          {/* Start Recognition — primary blue */}
          <TouchableOpacity
            style={[styles.gridButton, styles.gridButtonPrimary]}
            onPress={() => navigation.navigate('Recognition')}
            activeOpacity={0.85}
          >
            <Text style={styles.gridButtonIcon}>👁</Text>
            <Text style={[styles.gridButtonLabel, styles.gridButtonLabelPrimary]}>
              Start Recognition
            </Text>
            <Text style={styles.gridButtonSubLabel}>Scan &amp; verify face</Text>
          </TouchableOpacity>

          {/* Enroll Employee */}
          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate('Enrollment')}
            activeOpacity={0.85}
          >
            <Text style={styles.gridButtonIcon}>➕</Text>
            <Text style={styles.gridButtonLabel}>Enroll Employee</Text>
            <Text style={styles.gridButtonSubLabel}>Register a new face</Text>
          </TouchableOpacity>

          {/* Attendance Log */}
          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate('AttendanceLog')}
            activeOpacity={0.85}
          >
            <Text style={styles.gridButtonIcon}>📋</Text>
            <Text style={styles.gridButtonLabel}>Attendance Log</Text>
            <Text style={styles.gridButtonSubLabel}>View past records</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.85}
          >
            <Text style={styles.gridButtonIcon}>⚙</Text>
            <Text style={styles.gridButtonLabel}>Settings</Text>
            <Text style={styles.gridButtonSubLabel}>Configure the app</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer: last sync + manual sync ────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {formatLastSyncTime(syncStatus.lastSyncAt)}
          </Text>
          {syncStatus.pending > 0 && !syncStatus.isSyncing && (
            <TouchableOpacity
              style={styles.syncNowButton}
              onPress={triggerSync}
              activeOpacity={0.8}
            >
              <Text style={styles.syncNowText}>Sync now ({syncStatus.pending})</Text>
            </TouchableOpacity>
          )}
          {syncStatus.lastError != null && (
            <Text style={styles.syncError}>{syncStatus.lastError}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statCardLeft: {
    borderColor: '#3B82F640',
  },
  statCardRight: {
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
    lineHeight: 44,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grid
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  gridButton: {
    width: '47.5%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  gridButtonPrimary: {
    backgroundColor: '#1D4ED8',
    borderColor: '#3B82F6',
  },
  gridButtonIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  gridButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 3,
  },
  gridButtonLabelPrimary: {
    color: '#FFFFFF',
  },
  gridButtonSubLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  syncNowButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  syncNowText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
  syncError: {
    fontSize: 11,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
