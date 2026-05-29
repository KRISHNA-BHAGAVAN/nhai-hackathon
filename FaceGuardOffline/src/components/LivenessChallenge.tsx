import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ChallengeType } from '../types';

interface LivenessChallengeProps {
  challenge: ChallengeType;
  progress: number; // 0..1
  timeLeft: number; // ms
}

interface ChallengeDisplay {
  emoji: string;
  instruction: string;
}

function getChallengeDisplay(challenge: ChallengeType): ChallengeDisplay {
  switch (challenge) {
    case 'BLINK':
      return { emoji: '👁', instruction: 'Please blink' };
    case 'SMILE':
      return { emoji: '😊', instruction: 'Please smile' };
    case 'TURN_LEFT':
      return { emoji: '⬅', instruction: 'Turn head left' };
    case 'TURN_RIGHT':
      return { emoji: '➡', instruction: 'Turn head right' };
    case 'NOD':
      return { emoji: '⬇', instruction: 'Nod your head' };
    default: {
      const _exhaustive: never = challenge;
      return { emoji: '👁', instruction: '' };
    }
  }
}

const RING_SIZE = 120;
const RING_RADIUS = RING_SIZE / 2;
const RING_BORDER = 4;

const LivenessChallenge = memo<LivenessChallengeProps>(({
  challenge,
  progress,
  timeLeft,
}) => {
  // Entry animation: slide up + fade in
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Arc rotation for progress ring (0deg = empty, 360deg = full)
  const arcRotation = useRef(new Animated.Value(0)).current;

  // Dots animation for "thinking" style display
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  // Animate entry whenever challenge changes
  useEffect(() => {
    translateY.setValue(40);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [challenge]);

  // Animate progress ring
  useEffect(() => {
    Animated.timing(arcRotation, {
      toValue: progress,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  // Animate dots sequentially
  useEffect(() => {
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]),
    );
    dotLoop.start();
    return () => dotLoop.stop();
  }, []);

  const { emoji, instruction } = getChallengeDisplay(challenge);
  const secondsLeft = Math.ceil(timeLeft / 1000);

  // Arc fill: we rotate a half-circle overlay to simulate a progress ring.
  // We use two half-circle clips and rotate them for 0-50% and 50-100% separately.
  const progressDeg = progress * 360;
  const firstHalfDeg = Math.min(progressDeg, 180);
  const secondHalfDeg = Math.max(progressDeg - 180, 0);

  const firstHalfRotate = arcRotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });

  const secondHalfRotate = arcRotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  const secondHalfOpacity = arcRotation.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.card}>
        {/* Progress ring */}
        <View style={styles.ringWrapper}>
          {/* Background track */}
          <View style={styles.ringTrack} />

          {/* Right half (fills first 0–180 deg) */}
          <View style={[styles.halfCircleContainer, styles.rightHalfContainer]}>
            <Animated.View
              style={[
                styles.halfCircle,
                styles.rightHalf,
                { transform: [{ rotate: firstHalfRotate }] },
              ]}
            />
          </View>

          {/* Left half (fills 180–360 deg) */}
          <Animated.View
            style={[
              styles.halfCircleContainer,
              styles.leftHalfContainer,
              { opacity: secondHalfOpacity },
            ]}
          >
            <Animated.View
              style={[
                styles.halfCircle,
                styles.leftHalf,
                { transform: [{ rotate: secondHalfRotate }] },
              ]}
            />
          </Animated.View>

          {/* Inner circle (mask) */}
          <View style={styles.innerCircle}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        </View>

        {/* Countdown */}
        <Text style={styles.countdown}>{secondsLeft}s</Text>

        {/* Instruction */}
        <Text style={styles.instruction}>{instruction}</Text>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          <Animated.Text style={[styles.dot, { opacity: dot1Opacity }]}>●</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot2Opacity }]}>●</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot3Opacity }]}>●</Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
});

LivenessChallenge.displayName = 'LivenessChallenge';

export default LivenessChallenge;

const INNER_SIZE = RING_SIZE - RING_BORDER * 2 - 8;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 200,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_RADIUS,
    borderWidth: RING_BORDER,
    borderColor: '#334155',
  },
  halfCircleContainer: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  rightHalfContainer: {
    left: RING_RADIUS,
  },
  leftHalfContainer: {
    right: RING_RADIUS,
  },
  halfCircle: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_RADIUS,
    borderWidth: RING_BORDER,
    borderColor: '#3B82F6',
    backgroundColor: 'transparent',
  },
  rightHalf: {
    right: 0,
    transformOrigin: 'left center',
  },
  leftHalf: {
    left: 0,
    transformOrigin: 'right center',
  },
  innerCircle: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emoji: {
    fontSize: 36,
  },
  countdown: {
    color: '#94A3B8',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
  },
  instruction: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    color: '#3B82F6',
    fontSize: 8,
  },
});
