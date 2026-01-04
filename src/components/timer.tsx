import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Button } from '@/components/ui';

interface TimerProps {
  maxSeconds?: number;
}

const RADIUS = 80;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Color gradients for each minute
const MINUTE_COLORS = [
  ['#9c27b0', '#8b5cf6'], // Purple
];

const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isAutoRestart, setIsAutoRestart] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && !isCountingDown) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (isCountingDown) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 0) {
            setIsCountingDown(false);
            if (isAutoRestart) {
              setIsRunning(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isCountingDown, isAutoRestart]);

  const start = useCallback(() => {
    if (!isRunning && !isCountingDown) {
      setIsRunning(true);
    }
  }, [isRunning, isCountingDown]);

  const stop = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (seconds > 0) {
        setIsCountingDown(true);
      }
    }
  }, [isRunning, seconds]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsCountingDown(false);
    setSeconds(0);
  }, []);

  const toggleAutoRestart = useCallback(() => {
    setIsAutoRestart((prev) => !prev);
  }, []);

  return {
    seconds,
    isRunning,
    isCountingDown,
    isAutoRestart,
    start,
    stop,
    reset,
    toggleAutoRestart,
  };
};

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const TimerDisplay: React.FC<{
  seconds: number;
  isRunning: boolean;
  isCountingDown: boolean;
  // eslint-disable-next-line max-lines-per-function
}> = ({ seconds, isRunning, isCountingDown }) => {
  const animatedProgress = useSharedValue(0);
  const prevMinuteRef = useRef(0);

  const currentMinute = Math.floor(seconds / 60);
  const secondsInMinute = seconds % 60;
  const targetProgress = (secondsInMinute / 60) * CIRCUMFERENCE;

  const colorIndex = currentMinute % MINUTE_COLORS.length;
  const [startColor, endColor] = isCountingDown
    ? ['#ff6b6b', '#ff8a8a']
    : MINUTE_COLORS[colorIndex];

  useEffect(() => {
    // Check if we've crossed into a new minute
    if (currentMinute !== prevMinuteRef.current && !isCountingDown) {
      // Instantly reset to 0 without animation, then animate to target
      animatedProgress.value = 0;
      prevMinuteRef.current = currentMinute;
    }

    animatedProgress.value = withTiming(targetProgress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [
    seconds,
    targetProgress,
    animatedProgress,
    currentMinute,
    isCountingDown,
  ]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE - animatedProgress.value,
  }));

  const getStatusText = () => {
    if (isCountingDown) return 'Counting Down';
    if (isRunning) return 'Running';
    if (seconds === 0) return 'Ready';
    return 'Stopped';
  };

  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient
          id="progressGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor={startColor} />
          <Stop offset="100%" stopColor={endColor} />
        </LinearGradient>
      </Defs>
      <Circle
        cx="100"
        cy="100"
        r={RADIUS}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={STROKE_WIDTH}
      />
      <AnimatedCircle
        cx="100"
        cy="100"
        r={RADIUS}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE}`}
        animatedProps={animatedProps}
        rotation={-90}
        origin="100, 100"
      />
      <SvgText
        x="100"
        y="100"
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="36"
        fill="#888"
      >
        {formatTime(seconds)}
      </SvgText>
      <SvgText
        x="100"
        y="130"
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="12"
        fill="#888"
      >
        {getStatusText()}
      </SvgText>
    </Svg>
  );
};

interface TimerButtonProps {
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: string;
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
}

const TimerButton: React.FC<TimerButtonProps> = ({
  onPress,
  disabled = false,
  label,
  variant,
}) => (
  <Button
    onPress={onPress}
    disabled={disabled}
    variant={variant}
    label={label}
  />
);

const Timer: React.FC<TimerProps> = () => {
  const {
    seconds,
    isRunning,
    isCountingDown,
    isAutoRestart,
    start,
    stop,
    reset,
    toggleAutoRestart,
  } = useTimer();

  return (
    <View style={styles.container}>
      <TimerDisplay
        seconds={seconds}
        isRunning={isRunning}
        isCountingDown={isCountingDown}
      />
      <View style={styles.buttonContainer}>
        <TimerButton
          onPress={isRunning ? stop : start}
          label={isRunning ? 'Stop' : 'Start'}
          variant={isRunning ? 'destructive' : 'default'}
        />
        <TimerButton onPress={reset} variant="outline" label="Reset" />
        <TimerButton
          onPress={toggleAutoRestart}
          label="Auto"
          variant={isAutoRestart ? 'secondary' : 'outline'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 20,
  },
});

export default Timer;
