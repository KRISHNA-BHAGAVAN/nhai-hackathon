import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useCameraDevice } from 'react-native-vision-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import uuid from 'react-native-uuid';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useFacePipeline } from '../hooks/useFacePipeline';
import { useLivenessChallenge } from '../hooks/useLivenessChallenge';
import { useNetworkSync } from '../hooks/useNetworkSync';

import CameraView from '../components/CameraView';
import FaceOverlay from '../components/FaceOverlay';
import LivenessChallenge from '../components/LivenessChallenge';
import RecognitionResult from '../components/RecognitionResult';
import SyncStatusBadge from '../components/SyncStatusBadge';

import { insertAttendanceRecord } from '../db/AttendanceRepository';
import { getAllEmployees } from '../db/EmployeeRepository';
import { APP_CONFIG } from '../constants/AppConfig';
import { AttendanceRecord, Employee, RecognitionResult as RecognitionResultType } from '../types';

// ─── Navigation prop ──────────────────────────────────────────────────────────

type Props = StackScreenProps<RootStackParamList, 'Recognition'>;

// ─── State machine types ───────────────────────────────────────────────────────

type RecognitionState =
  | { screen: 'IDLE' }
  | { screen: 'DETECTING' }
  | { screen: 'PASSIVE_LIVENESS' }
  | { screen: 'ACTIVE_CHALLENGE' }
  | { screen: 'RECOGNISING' }
  | { screen: 'MATCHED'; result: RecognitionResultType }
  | { screen: 'NO_MATCH'; result: RecognitionResultType }
  | { screen: 'LIVENESS_FAIL' };

type RecognitionAction =
  | { type: 'FACE_DETECTED' }
  | { type: 'PASSIVE_CHECK' }
  | { type: 'CHALLENGE_START' }
  | { type: 'RECOGNISING' }
  | { type: 'MATCH'; result: RecognitionResultType }
  | { type: 'NO_MATCH'; result: RecognitionResultType }
  | { type: 'LIVENESS_FAIL' }
  | { type: 'RESET' };

const INITIAL_STATE: RecognitionState = { screen: 'IDLE' };

function recognitionReducer(
  state: RecognitionState,
  action: RecognitionAction,
): RecognitionState {
  switch (action.type) {
    case 'FACE_DETECTED':
      if (state.screen === 'IDLE') {
        return { screen: 'DETECTING' };
      }
      return state;

    case 'PASSIVE_CHECK':
      if (state.screen === 'DETECTING') {
        return { screen: 'PASSIVE_LIVENESS' };
      }
      return state;

    case 'CHALLENGE_START':
      if (state.screen === 'PASSIVE_LIVENESS') {
        return { screen: 'ACTIVE_CHALLENGE' };
      }
      return state;

    case 'RECOGNISING':
      if (state.screen === 'ACTIVE_CHALLENGE') {
        return { screen: 'RECOGNISING' };
      }
      return state;

    case 'MATCH':
      if (state.screen === 'RECOGNISING') {
        return { screen: 'MATCHED', result: action.result };
      }
      return state;

    case 'NO_MATCH':
      if (state.screen === 'RECOGNISING') {
        return { screen: 'NO_MATCH', result: action.result };
      }
      return state;

    case 'LIVENESS_FAIL':
      if (
        state.screen === 'PASSIVE_LIVENESS' ||
        state.screen === 'ACTIVE_CHALLENGE'
      ) {
        return { screen: 'LIVENESS_FAIL' };
      }
      return state;

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

// ─── Status text helper ────────────────────────────────────────────────────────

function getStatusText(screen: RecognitionState['screen']): string {
  switch (screen) {
    case 'IDLE':
      return 'Position your face in the camera';
    case 'DETECTING':
      return 'Face detected...';
    case 'PASSIVE_LIVENESS':
      return 'Checking liveness...';
    case 'ACTIVE_CHALLENGE':
      return 'Complete the challenge';
    case 'RECOGNISING':
      return 'Identifying...';
    case 'MATCHED':
      return 'Welcome!';
    case 'NO_MATCH':
      return 'Face not recognised';
    case 'LIVENESS_FAIL':
      return 'Liveness check failed';
    default: {
      const _exhaustive: never = screen;
      return '';
    }
  }
}

// ─── Geolocation helper (fire-and-forget) ────────────────────────────────────

async function requestLocationPermission(): Promise<void> {
  const permission =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

  const status = await check(permission);
  if (status === RESULTS.DENIED) {
    await request(permission);
  }
}

function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  // React Native polyfills navigator.geolocation.
  // If the polyfill is absent at runtime, we resolve null gracefully.
  if (
    typeof navigator === 'undefined' ||
    navigator.geolocation == null
  ) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // GPS unavailable — resolve without coordinates
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 },
    );
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecognitionScreen({ navigation }: Props): React.JSX.Element {
  // Camera device (vision-camera v4 API)
  const device = useCameraDevice('back');

  // Container layout for overlay coordinate mapping
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  }, []);

  // Employees loaded on mount
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getAllEmployees()
      .then(setEmployees)
      .catch((err: unknown) => {
        if (__DEV__) {
          console.error('RecognitionScreen: getAllEmployees failed:', err);
        }
      });
  }, []);

  // Hooks
  const { frameProcessor, pipelineResult, isReady, reset: resetPipeline } =
    useFacePipeline(employees);
  const livenessState = useLivenessChallenge(pipelineResult);
  const { syncStatus } = useNetworkSync();

  // State machine
  const [screenState, dispatch] = useReducer(recognitionReducer, INITIAL_STATE);

  // Timeout refs for cleanup
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const scheduleReset = useCallback(
    (delayMs: number) => {
      clearResetTimer();
      resetTimerRef.current = setTimeout(() => {
        dispatch({ type: 'RESET' });
        resetPipeline();
        livenessState.reset();
      }, delayMs);
    },
    [clearResetTimer, resetPipeline, livenessState],
  );

  // ── State-machine transitions driven by pipelineResult ────────────────────
  useEffect(() => {
    const { stage, recognitionResult } = pipelineResult;

    switch (stage) {
      case 'FACE_DETECTED':
        if (screenState.screen === 'IDLE') {
          dispatch({ type: 'FACE_DETECTED' });
        } else if (screenState.screen === 'DETECTING') {
          dispatch({ type: 'PASSIVE_CHECK' });
        }
        break;

      case 'LIVENESS_CHALLENGE':
        if (screenState.screen === 'PASSIVE_LIVENESS') {
          dispatch({ type: 'CHALLENGE_START' });
        }
        break;

      case 'LIVENESS_FAIL':
        if (
          screenState.screen === 'PASSIVE_LIVENESS' ||
          screenState.screen === 'ACTIVE_CHALLENGE'
        ) {
          dispatch({ type: 'LIVENESS_FAIL' });
        }
        break;

      case 'RECOGNISING':
        if (screenState.screen === 'ACTIVE_CHALLENGE') {
          dispatch({ type: 'RECOGNISING' });
        }
        break;

      case 'MATCH':
        if (
          screenState.screen === 'RECOGNISING' &&
          recognitionResult !== undefined
        ) {
          dispatch({ type: 'MATCH', result: recognitionResult });
        }
        break;

      case 'NO_MATCH':
        if (
          screenState.screen === 'RECOGNISING' &&
          recognitionResult !== undefined
        ) {
          dispatch({ type: 'NO_MATCH', result: recognitionResult });
        }
        break;

      case 'NO_FACE':
        // If we lose the face before recognition is complete, quietly reset
        if (
          screenState.screen === 'DETECTING' ||
          screenState.screen === 'PASSIVE_LIVENESS' ||
          screenState.screen === 'ACTIVE_CHALLENGE'
        ) {
          dispatch({ type: 'RESET' });
          resetPipeline();
          livenessState.reset();
        }
        break;

      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineResult.stage]);

  // ── Handle liveness failure from challenge hook ────────────────────────────
  useEffect(() => {
    if (
      livenessState.failed &&
      (screenState.screen === 'PASSIVE_LIVENESS' ||
        screenState.screen === 'ACTIVE_CHALLENGE')
    ) {
      dispatch({ type: 'LIVENESS_FAIL' });
    }
  }, [livenessState.failed, screenState.screen]);

  // ── Handle MATCHED — insert attendance record ──────────────────────────────
  useEffect(() => {
    if (screenState.screen !== 'MATCHED') return;

    const result = screenState.result;

    // Request GPS and insert record (fire-and-forget)
    (async () => {
      try {
        await requestLocationPermission();
        const coords = await getCurrentPosition();

        const record: AttendanceRecord = {
          id: uuid.v4() as string,
          employeeId: result.employee?.id ?? 'unknown',
          employeeName: result.employee?.name ?? 'Unknown',
          timestamp: Date.now(),
          confidence: result.similarity,
          livenessScore: result.livenessScore,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          synced: false,
          syncAttempts: 0,
        };

        await insertAttendanceRecord(record);
      } catch (err: unknown) {
        if (__DEV__) {
          console.error('RecognitionScreen: insertAttendanceRecord failed:', err);
        }
      }
    })();

    scheduleReset(APP_CONFIG.RECOGNITION.RESULT_DISPLAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState.screen]);

  // ── Handle NO_MATCH ────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState.screen !== 'NO_MATCH') return;
    scheduleReset(APP_CONFIG.RECOGNITION.NO_MATCH_DISPLAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState.screen]);

  // ── Handle LIVENESS_FAIL ───────────────────────────────────────────────────
  useEffect(() => {
    if (screenState.screen !== 'LIVENESS_FAIL') return;
    scheduleReset(APP_CONFIG.RECOGNITION.LIVENESS_FAIL_DISPLAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState.screen]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearResetTimer();
    };
  }, [clearResetTimer]);

  // ── Derive result for RecognitionResult component (type-narrowed) ──────────
  const resultForCard: RecognitionResultType | null =
    screenState.screen === 'MATCHED' || screenState.screen === 'NO_MATCH'
      ? screenState.result
      : null;

  const resultVisible =
    screenState.screen === 'MATCHED' || screenState.screen === 'NO_MATCH';

  // ── Derive current challenge for LivenessChallenge component ───────────────
  const activeChallenge =
    screenState.screen === 'ACTIVE_CHALLENGE'
      ? pipelineResult.currentChallenge ?? null
      : null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* ── Camera feed ─────────────────────────────────────────────────── */}
      {device !== undefined && isReady && (
        <CameraView
          device={device}
          frameProcessor={frameProcessor}
          isActive={true}
        />
      )}

      {/* ── Face bounding-box overlay ────────────────────────────────────── */}
      <FaceOverlay
        detectedFace={pipelineResult.detectedFace ?? null}
        stage={pipelineResult.stage}
        cameraWidth={640}
        cameraHeight={480}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />

      {/* ── Liveness challenge card ──────────────────────────────────────── */}
      {activeChallenge !== null && (
        <LivenessChallenge
          challenge={activeChallenge}
          progress={livenessState.progress}
          timeLeft={livenessState.timeLeft}
        />
      )}

      {/* ── Recognition result sheet ─────────────────────────────────────── */}
      <RecognitionResult result={resultForCard} visible={resultVisible} />

      {/* ── Liveness fail overlay ────────────────────────────────────────── */}
      {screenState.screen === 'LIVENESS_FAIL' && (
        <View style={styles.failOverlay}>
          <Text style={styles.failText}>Liveness check failed</Text>
          <Text style={styles.failSubText}>Please try again</Text>
        </View>
      )}

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Face Recognition</Text>

        <SyncStatusBadge syncStatus={syncStatus} />
      </View>

      {/* ── Status bar at bottom ─────────────────────────────────────────── */}
      <View style={styles.statusBar} pointerEvents="none">
        <Text style={styles.statusText}>
          {getStatusText(screenState.screen)}
        </Text>
      </View>

      {/* ── Loading overlay (models initialising) ───────────────────────── */}
      {!isReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading models...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 30,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 64,
  },
  backButtonText: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },

  // ── Status bar (bottom) ───────────────────────────────────────────────────
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    zIndex: 10,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Liveness fail overlay ─────────────────────────────────────────────────
  failOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  failText: {
    color: '#FEF2F2',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  failSubText: {
    color: '#FECACA',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Loading overlay ───────────────────────────────────────────────────────
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    gap: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
