import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { DetectedFace, PipelineStage } from '../types';

interface FaceOverlayProps {
  detectedFace: DetectedFace | null;
  stage: PipelineStage;
  cameraWidth: number;
  cameraHeight: number;
  containerWidth: number;
  containerHeight: number;
}

interface StageStyle {
  borderColor: string;
  animationType: 'none' | 'pulse' | 'shake';
}

function getStageStyle(stage: PipelineStage): StageStyle {
  switch (stage) {
    case 'FACE_DETECTED':
      return { borderColor: '#FACC15', animationType: 'none' };
    case 'LIVENESS_CHALLENGE':
      return { borderColor: '#3B82F6', animationType: 'none' };
    case 'RECOGNISING':
      return { borderColor: '#3B82F6', animationType: 'pulse' };
    case 'MATCH':
      return { borderColor: '#22C55E', animationType: 'pulse' };
    case 'LIVENESS_FAIL':
      return { borderColor: '#EF4444', animationType: 'shake' };
    case 'NO_MATCH':
      return { borderColor: '#EF4444', animationType: 'shake' };
    default:
      return { borderColor: 'transparent', animationType: 'none' };
  }
}

const LANDMARK_RADIUS = 4;

const FaceOverlay = memo<FaceOverlayProps>(({
  detectedFace,
  stage,
  cameraWidth,
  cameraHeight,
  containerWidth,
  containerHeight,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const shakeRef = useRef<Animated.CompositeAnimation | null>(null);

  const { borderColor, animationType } = getStageStyle(stage);

  // Stop all running animations
  const stopAll = () => {
    pulseRef.current?.stop();
    shakeRef.current?.stop();
    scaleAnim.setValue(1);
    translateXAnim.setValue(0);
  };

  useEffect(() => {
    stopAll();

    if (stage === 'NO_FACE') {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    if (animationType === 'pulse') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseRef.current = pulse;
      pulse.start();
    } else if (animationType === 'shake') {
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(translateXAnim, {
            toValue: 8,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(translateXAnim, {
            toValue: -8,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(translateXAnim, {
            toValue: 8,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(translateXAnim, {
            toValue: -8,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ]),
      );
      shakeRef.current = shake;
      shake.start();
    }

    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (!detectedFace || stage === 'NO_FACE') {
    return null;
  }

  const scaleX = containerWidth / cameraWidth;
  const scaleY = containerHeight / cameraHeight;

  const { boundingBox, landmarks } = detectedFace;

  const scaledX = boundingBox.x * scaleX;
  const scaledY = boundingBox.y * scaleY;
  const scaledW = boundingBox.width * scaleX;
  const scaledH = boundingBox.height * scaleY;

  // Build landmark points: leftEye[0], rightEye[0], noseTip, mouth[0], mouth[mouth.length-1]
  const landmarkDots: { x: number; y: number }[] = [];
  if (landmarks) {
    if (landmarks.leftEye.length > 0) {
      landmarkDots.push({
        x: landmarks.leftEye[0].x * scaleX,
        y: landmarks.leftEye[0].y * scaleY,
      });
    }
    if (landmarks.rightEye.length > 0) {
      landmarkDots.push({
        x: landmarks.rightEye[0].x * scaleX,
        y: landmarks.rightEye[0].y * scaleY,
      });
    }
    landmarkDots.push({
      x: landmarks.noseTip.x * scaleX,
      y: landmarks.noseTip.y * scaleY,
    });
    if (landmarks.mouth.length > 0) {
      landmarkDots.push({
        x: landmarks.mouth[0].x * scaleX,
        y: landmarks.mouth[0].y * scaleY,
      });
      if (landmarks.mouth.length > 1) {
        landmarkDots.push({
          x: landmarks.mouth[landmarks.mouth.length - 1].x * scaleX,
          y: landmarks.mouth[landmarks.mouth.length - 1].y * scaleY,
        });
      }
    }
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: translateXAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {/* Bounding box */}
      <Animated.View
        style={[
          styles.boundingBox,
          {
            left: scaledX,
            top: scaledY,
            width: scaledW,
            height: scaledH,
            borderColor,
          },
        ]}
      />

      {/* Corner accents */}
      <View
        style={[
          styles.cornerTL,
          { left: scaledX - 2, top: scaledY - 2, borderColor },
        ]}
      />
      <View
        style={[
          styles.cornerTR,
          { left: scaledX + scaledW - 18, top: scaledY - 2, borderColor },
        ]}
      />
      <View
        style={[
          styles.cornerBL,
          { left: scaledX - 2, top: scaledY + scaledH - 18, borderColor },
        ]}
      />
      <View
        style={[
          styles.cornerBR,
          {
            left: scaledX + scaledW - 18,
            top: scaledY + scaledH - 18,
            borderColor,
          },
        ]}
      />

      {/* Landmark dots */}
      {landmarkDots.map((dot, idx) => (
        <View
          key={idx}
          style={[
            styles.landmark,
            {
              left: dot.x - LANDMARK_RADIUS,
              top: dot.y - LANDMARK_RADIUS,
              backgroundColor: borderColor,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
});

FaceOverlay.displayName = 'FaceOverlay';

export default FaceOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  cornerTL: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  cornerTR: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  cornerBL: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  cornerBR: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  landmark: {
    position: 'absolute',
    width: LANDMARK_RADIUS * 2,
    height: LANDMARK_RADIUS * 2,
    borderRadius: LANDMARK_RADIUS,
  },
});
