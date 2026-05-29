import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDatabase } from '../db/Database';
import { FacePipeline } from '../ml/FacePipeline';
import { getAllEmployees } from '../db/EmployeeRepository';
import { updateEmployeeCache } from '../hooks/useFacePipeline';

// Module-level reference so the pipeline instance persists beyond this screen
let _globalPipeline: FacePipeline | null = null;

type Props = StackScreenProps<RootStackParamList, 'Splash'>;

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface BootStep {
  key: string;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: BootStep[] = [
  { key: 'permissions', label: 'Requesting permissions...', status: 'pending' },
  { key: 'database', label: 'Initialising database...', status: 'pending' },
  { key: 'models', label: 'Loading AI models...', status: 'pending' },
  { key: 'employees', label: 'Loading employee data...', status: 'pending' },
  { key: 'ready', label: 'Ready!', status: 'pending' },
];

function statusIcon(status: StepStatus): string {
  switch (status) {
    case 'done':
      return '✓';
    case 'error':
      return '✗';
    case 'running':
      return '…';
    case 'pending':
    default:
      return '·';
  }
}

function statusColor(status: StepStatus): string {
  switch (status) {
    case 'done':
      return '#22C55E';
    case 'error':
      return '#EF4444';
    case 'running':
      return '#3B82F6';
    case 'pending':
    default:
      return '#475569';
  }
}

export default function SplashScreen({ navigation }: Props): React.JSX.Element {
  const [steps, setSteps] = useState<BootStep[]>(INITIAL_STEPS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [booting, setBooting] = useState(false);

  // Animated dots for the loading indicator
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const dotLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]),
    );
    dotLoop.current = loop;
    loop.start();
    return () => {
      loop.stop();
    };
  }, [dot1, dot2, dot3]);

  const updateStep = useCallback(
    (key: string, status: StepStatus) => {
      setSteps((prev) =>
        prev.map((s) => (s.key === key ? { ...s, status } : s)),
      );
    },
    [],
  );

  const runBoot = useCallback(async () => {
    setBooting(true);
    setErrorMessage(null);
    // Reset all steps to pending
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' })));

    // ── Step 1: Camera permission ────────────────────────────────────────────
    updateStep('permissions', 'running');
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;
      const result = await request(permission);
      if (result !== RESULTS.GRANTED) {
        updateStep('permissions', 'error');
        setErrorMessage(
          'Camera permission is required to use FaceGuard. Please grant it in Settings.',
        );
        setBooting(false);
        return;
      }
      updateStep('permissions', 'done');
    } catch (err: unknown) {
      updateStep('permissions', 'error');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Permission request failed: ${msg}`);
      setBooting(false);
      return;
    }

    // ── Step 2: Database ─────────────────────────────────────────────────────
    updateStep('database', 'running');
    try {
      await getDatabase();
      updateStep('database', 'done');
    } catch (err: unknown) {
      updateStep('database', 'error');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Database initialisation failed: ${msg}`);
      setBooting(false);
      return;
    }

    // ── Step 3: AI models ────────────────────────────────────────────────────
    updateStep('models', 'running');
    try {
      const pipeline = await FacePipeline.create();
      _globalPipeline = pipeline;
      updateStep('models', 'done');
    } catch (err: unknown) {
      updateStep('models', 'error');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Model loading failed: ${msg}`);
      setBooting(false);
      return;
    }

    // ── Step 4: Employee data ────────────────────────────────────────────────
    updateStep('employees', 'running');
    try {
      const employees = await getAllEmployees();
      updateEmployeeCache(employees);
      updateStep('employees', 'done');
    } catch (err: unknown) {
      updateStep('employees', 'error');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Employee data load failed: ${msg}`);
      setBooting(false);
      return;
    }

    // ── Step 5: Ready ────────────────────────────────────────────────────────
    updateStep('ready', 'done');

    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    navigation.replace('Home');
  }, [navigation, updateStep]);

  // Auto-start on mount
  useEffect(() => {
    runBoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasError = errorMessage !== null;

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoMain}>FaceGuard</Text>
        <Text style={styles.logoAccent}>Offline</Text>
      </View>

      {/* Animated loading dots (hidden on error) */}
      {!hasError && booting && (
        <View style={styles.dotsRow}>
          <Animated.Text style={[styles.dot, { opacity: dot1 }]}>•</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot2 }]}>•</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot3 }]}>•</Animated.Text>
        </View>
      )}

      {/* Boot steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <View key={step.key} style={styles.stepRow}>
            {step.status === 'running' ? (
              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={styles.stepSpinner}
              />
            ) : (
              <Text style={[styles.stepIcon, { color: statusColor(step.status) }]}>
                {statusIcon(step.status)}
              </Text>
            )}
            <Text
              style={[
                styles.stepLabel,
                step.status === 'done' && styles.stepLabelDone,
                step.status === 'error' && styles.stepLabelError,
                step.status === 'running' && styles.stepLabelRunning,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Error message */}
      {hasError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Startup Failed</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={runBoot} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Version footer */}
      <Text style={styles.version}>v1.0.0 · NHAI Hackathon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoMain: {
    fontSize: 42,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -1,
  },
  logoAccent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    color: '#3B82F6',
    fontSize: 24,
    lineHeight: 28,
  },
  stepsContainer: {
    width: '100%',
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepSpinner: {
    width: 20,
    height: 20,
  },
  stepIcon: {
    width: 20,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  stepLabelDone: {
    color: '#94A3B8',
  },
  stepLabelError: {
    color: '#EF4444',
  },
  stepLabelRunning: {
    color: '#F8FAFC',
  },
  errorBox: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF444440',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  version: {
    position: 'absolute',
    bottom: 32,
    color: '#334155',
    fontSize: 12,
  },
});
