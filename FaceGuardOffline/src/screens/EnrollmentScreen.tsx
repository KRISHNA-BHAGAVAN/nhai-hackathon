import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { StackScreenProps } from '@react-navigation/stack';
import uuid from 'react-native-uuid';

import { RootStackParamList } from '../navigation/AppNavigator';
import { BoundingBox, DetectedFace, Employee } from '../types';
import { FaceDetector } from '../ml/FaceDetector';
import { prepareFaceForMobileFaceNet } from '../ml/Preprocessor';
import { l2Normalize, cosineSimilarity } from '../utils/embedding';
import { sha256Hash } from '../utils/imageUtils';
import { getAllEmployees, insertEmployee } from '../db/EmployeeRepository';
import { updateEmployeeCache } from '../hooks/useFacePipeline';
import { MODELS } from '../constants/ModelConfig';
import { APP_CONFIG } from '../constants/AppConfig';
import FaceOverlay from '../components/FaceOverlay';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<RootStackParamList, 'Enrollment'>;

interface FrameCapture {
  pixels: Uint8Array;
  width: number;
  height: number;
  bbox: BoundingBox;
  confidence: number;
}

// ─── Module-level detector + recogniser model (avoids recreating on re-render) ─

let _enrollDetector: FaceDetector | null = null;
let _embedModel: TensorflowModel | null = null;

// Latest frame data updated every detection cycle — written on JS thread
let _latestCapture: FrameCapture | null = null;

// ─── Pure helper: run MobileFaceNet embedding on raw pixel data ───────────────

async function embedFromBuffer(
  pixels: Uint8Array,
  bbox: BoundingBox,
  width: number,
  height: number,
): Promise<Float32Array> {
  if (_embedModel === null) {
    _embedModel = await loadTensorflowModel(MODELS.MOBILEFACENET.path, 'default');
  }
  const prepared = prepareFaceForMobileFaceNet(pixels, bbox, width, height);
  const outputs = _embedModel.runSync([prepared]);
  const rawVector = outputs[0] as Float32Array;
  return l2Normalize(rawVector);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EnrollmentScreen({ navigation }: Props): React.JSX.Element {
  const device = useCameraDevice('back');

  const [name, setName] = useState<string>('');
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [isModelsReady, setIsModelsReady] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  // ── Load models on mount ─────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    Promise.all([
      FaceDetector.create(),
      loadTensorflowModel(MODELS.MOBILEFACENET.path, 'default'),
    ])
      .then(([detector, embedModel]) => {
        if (!mounted) return;
        _enrollDetector = detector;
        _embedModel = embedModel;
        setIsModelsReady(true);
      })
      .catch((err: unknown) => {
        if (mounted) {
          Alert.alert('Initialisation Error', 'Failed to load models: ' + String(err));
        }
      });

    return () => {
      mounted = false;
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // ── Frame processor callback (runs on JS thread) ──────────────────────────

  const processEnrollmentFrameJS = useCallback(
    (frame: Frame) => {
      if (_enrollDetector === null || processingRef.current) {
        frame.decrementRefCount();
        return;
      }
      processingRef.current = true;

      try {
        const buffer = frame.toArrayBuffer();
        const bytes = new Uint8Array(buffer);
        const w = frame.width;
        const h = frame.height;
        const rgb = new Uint8Array(w * h * 3);
        for (let i = 0; i < w * h; i++) {
          rgb[i * 3] = bytes[i * 4];
          rgb[i * 3 + 1] = bytes[i * 4 + 1];
          rgb[i * 3 + 2] = bytes[i * 4 + 2];
        }

        const faces = _enrollDetector.detect(frame);
        const topFace = faces.length > 0 ? faces[0] : null;

        setDetectedFace(topFace);
        if (topFace !== null) {
          _latestCapture = {
            pixels: rgb,
            width: w,
            height: h,
            bbox: topFace.boundingBox,
            confidence: topFace.confidence,
          };
        } else {
          _latestCapture = null;
        }
      } catch (err) {
        if (__DEV__) {
          console.error('processEnrollmentFrameJS error:', err);
        }
      } finally {
        processingRef.current = false;
        frame.decrementRefCount();
      }
    },
    [],
  );

  const runProcessEnrollmentFrameJS = Worklets.createRunOnJS(processEnrollmentFrameJS);

  // ── Frame processor (worklet) ────────────────────────────────────────────────

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (_enrollDetector === null) return;
      frame.incrementRefCount();
      runProcessEnrollmentFrameJS(frame);
    },
    [runProcessEnrollmentFrameJS],
  );

  // ── Capture + enroll ─────────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedCode = employeeCode.trim().toUpperCase();

    if (trimmedName.length === 0 || trimmedCode.length === 0) {
      Alert.alert('Missing Info', 'Please enter both Full Name and Employee Code.');
      return;
    }

    const capture = _latestCapture;

    if (capture === null) {
      Alert.alert('No Face Detected', 'Position your face clearly in the camera frame.');
      return;
    }

    if (capture.confidence < 0.8) {
      Alert.alert(
        'Low Confidence',
        `Face detection confidence is ${(capture.confidence * 100).toFixed(0)}%. Try better lighting or move closer.`,
      );
      return;
    }

    setIsCapturing(true);

    try {
      const embedding = await embedFromBuffer(
        capture.pixels,
        capture.bbox,
        capture.width,
        capture.height,
      );

      const existingEmployees = await getAllEmployees();

      // Duplicate face check
      let duplicateEmployee: Employee | null = null;
      let highestSim = 0;
      for (const emp of existingEmployees) {
        const sim = cosineSimilarity(embedding, emp.embedding);
        if (sim > highestSim) {
          highestSim = sim;
          if (sim > APP_CONFIG.RECOGNITION.DUPLICATE_CHECK_THRESHOLD) {
            duplicateEmployee = emp;
          }
        }
      }

      if (duplicateEmployee !== null) {
        const simPct = (highestSim * 100).toFixed(0);
        setIsCapturing(false);
        Alert.alert(
          'Possible Duplicate',
          `This face matches ${duplicateEmployee.name} (${simPct}% similarity). Continue enrolling anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enroll Anyway',
              onPress: () => {
                setIsCapturing(true);
                performInsert(trimmedName, trimmedCode, embedding, capture.pixels, existingEmployees)
                  .catch((err: unknown) => {
                    Alert.alert('Enrollment Error', String(err));
                  })
                  .finally(() => setIsCapturing(false));
              },
            },
          ],
        );
        return;
      }

      await performInsert(trimmedName, trimmedCode, embedding, capture.pixels, existingEmployees);
    } catch (err: unknown) {
      Alert.alert('Enrollment Failed', 'An error occurred: ' + String(err));
    } finally {
      setIsCapturing(false);
    }
  }, [name, employeeCode]);

  const performInsert = useCallback(
    async (
      trimmedName: string,
      trimmedCode: string,
      embedding: Float32Array,
      pixelSnapshot: Uint8Array,
      existingEmployees: Employee[],
    ): Promise<void> => {
      const thumbnailHash = sha256Hash(pixelSnapshot);
      const newEmployee: Employee = {
        id: String(uuid.v4()),
        name: trimmedName,
        employeeCode: trimmedCode,
        embedding,
        enrolledAt: Date.now(),
        thumbnailHash,
      };

      await insertEmployee(newEmployee);
      updateEmployeeCache([...existingEmployees, newEmployee]);

      setName('');
      setEmployeeCode('');
      setDetectedFace(null);
      _latestCapture = null;

      setSuccessMessage(`${trimmedName} enrolled successfully!`);
      successTimerRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    [],
  );

  // ── Layout ────────────────────────────────────────────────────────────────

  const handleCameraLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────

  const formFilled = name.trim().length > 0 && employeeCode.trim().length > 0;
  const canCapture =
    formFilled &&
    !isCapturing &&
    detectedFace !== null &&
    detectedFace.confidence > 0.8;

  const confidencePct =
    detectedFace !== null ? (detectedFace.confidence * 100).toFixed(0) : null;

  // ── Render ────────────────────────────────────────────────────────────────

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
        <Text style={styles.headerTitle}>Enroll Employee</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Form fields ───────────────────────────────────────────────────── */}
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Employee Details</Text>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ravi Kumar"
            placeholderTextColor="#475569"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Employee Code</Text>
          <TextInput
            style={styles.input}
            value={employeeCode}
            onChangeText={setEmployeeCode}
            placeholder="e.g. EMP-0042"
            placeholderTextColor="#475569"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>

        {/* ── Camera section (only when form is filled) ─────────────────────── */}
        {formFilled ? (
          <View style={styles.cameraSection}>
            <Text style={styles.sectionLabel}>Face Capture</Text>

            {!isModelsReady ? (
              <View style={styles.cameraPlaceholder}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.cameraPlaceholderText}>Loading models…</Text>
              </View>
            ) : device === undefined ? (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraPlaceholderText}>Camera unavailable</Text>
              </View>
            ) : (
              <View style={styles.cameraContainer} onLayout={handleCameraLayout}>
                <Camera
                  style={StyleSheet.absoluteFillObject}
                  device={device}
                  isActive={true}
                  frameProcessor={frameProcessor}
                  pixelFormat="rgb"
                  enableFpsGraph={false}
                />
                <FaceOverlay
                  detectedFace={detectedFace}
                  stage={detectedFace !== null ? 'FACE_DETECTED' : 'NO_FACE'}
                  cameraWidth={640}
                  cameraHeight={480}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                />
                {/* Detection status chip */}
                <View style={styles.detectionChip}>
                  {detectedFace !== null ? (
                    <Text style={styles.detectionChipText}>
                      Face detected · {confidencePct}%
                    </Text>
                  ) : (
                    <Text style={[styles.detectionChipText, styles.detectionChipNone]}>
                      No face detected
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* ── Capture button ──────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.captureButton, !canCapture && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={!canCapture}
              activeOpacity={0.8}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.captureButtonText}>Capture &amp; Enroll</Text>
              )}
            </TouchableOpacity>

            {!canCapture && isModelsReady && !isCapturing && (
              <Text style={styles.captureHint}>
                {detectedFace === null
                  ? 'Position your face in the camera to enable capture.'
                  : detectedFace.confidence <= 0.8
                  ? 'Move closer or improve lighting for a confident reading.'
                  : ''}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.cameraLockNotice}>
            <Text style={styles.cameraLockIcon}>↑</Text>
            <Text style={styles.cameraLockText}>
              Fill in Name and Employee Code above to enable the camera.
            </Text>
          </View>
        )}

        {/* ── Success banner ─────────────────────────────────────────────────── */}
        {successMessage !== null && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CAMERA_HEIGHT = 320;

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
    paddingBottom: 40,
    gap: 20,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputLabelSpaced: {
    marginTop: 14,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // ── Camera section ────────────────────────────────────────────────────────
  cameraSection: {
    gap: 14,
  },
  cameraContainer: {
    height: CAMERA_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    height: CAMERA_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraPlaceholderText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Detection chip ───────────────────────────────────────────────────────
  detectionChip: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  detectionChipText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detectionChipNone: {
    color: '#94A3B8',
  },

  // ── Lock notice ───────────────────────────────────────────────────────────
  cameraLockNotice: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  cameraLockIcon: {
    color: '#334155',
    fontSize: 32,
  },
  cameraLockText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Capture button ────────────────────────────────────────────────────────
  captureButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  captureButtonDisabled: {
    backgroundColor: '#1E3A5F',
    opacity: 0.6,
  },
  captureButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  captureHint: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 18,
  },

  // ── Success banner ────────────────────────────────────────────────────────
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  successIcon: {
    color: '#22C55E',
    fontSize: 20,
    fontWeight: '700',
  },
  successText: {
    color: '#86EFAC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
