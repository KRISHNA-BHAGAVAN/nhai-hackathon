import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ConfidenceBarProps {
  value: number; // 0..1
  label?: string;
  color?: string;
}

function computeColor(value: number): string {
  if (value >= 0.7) {
    return '#22C55E'; // green
  }
  if (value >= 0.5) {
    return '#F97316'; // orange
  }
  return '#EF4444'; // red
}

const ConfidenceBar = memo<ConfidenceBarProps>(({ value, label, color }) => {
  const clampedValue = Math.min(1, Math.max(0, value));
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: clampedValue,
      tension: 60,
      friction: 10,
      useNativeDriver: false, // width must use JS driver
    }).start();
  }, [clampedValue]);

  const barColor = color ?? computeColor(clampedValue);
  const percentage = (clampedValue * 100).toFixed(1);

  const animatedWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {label != null && label.length > 0 && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.row}>
        <View style={styles.trackContainer}>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                {
                  width: animatedWidth,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.percentage, { color: barColor }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
});

ConfidenceBar.displayName = 'ConfidenceBar';

export default ConfidenceBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackContainer: {
    flex: 1,
  },
  track: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'right',
  },
});
