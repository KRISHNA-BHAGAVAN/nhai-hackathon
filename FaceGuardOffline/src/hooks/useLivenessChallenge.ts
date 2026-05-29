import { useEffect, useState, useCallback, useRef } from 'react';
import { PipelineResult, ChallengeType } from '../types';
import { LIVENESS_CONFIG } from '../constants/ModelConfig';

export interface LivenessChallengeState {
  activeChallenges: ChallengeType[];
  currentIndex: number;
  progress: number;
  timeLeft: number;
  isComplete: boolean;
  failed: boolean;
  reset: () => void;
}

interface State {
  activeChallenges: ChallengeType[];
  currentIndex: number;
  progress: number;
  timeLeft: number;
  isComplete: boolean;
  failed: boolean;
}

const INITIAL_STATE: State = {
  activeChallenges: [],
  currentIndex: 0,
  progress: 0,
  timeLeft: LIVENESS_CONFIG.CHALLENGE_TIMEOUT_MS,
  isComplete: false,
  failed: false,
};

export function useLivenessChallenge(pipelineResult: PipelineResult): LivenessChallengeState {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengeStartRef = useRef<number>(0);
  const lastChallengeRef = useRef<ChallengeType | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    lastChallengeRef.current = null;
    setState(INITIAL_STATE);
  }, [clearTimer]);

  useEffect(() => {
    const { stage, currentChallenge, challengeProgress } = pipelineResult;

    if (stage === 'LIVENESS_FAIL') {
      clearTimer();
      setState((prev) => ({ ...prev, failed: true }));
      return;
    }

    if (stage === 'MATCH' || stage === 'NO_MATCH') {
      clearTimer();
      setState((prev) => ({ ...prev, isComplete: true }));
      return;
    }

    if (stage !== 'LIVENESS_CHALLENGE' || !currentChallenge) return;

    // New challenge started
    if (lastChallengeRef.current !== currentChallenge) {
      lastChallengeRef.current = currentChallenge;
      clearTimer();
      challengeStartRef.current = Date.now();

      setState((prev) => {
        const newChallenges = [...prev.activeChallenges, currentChallenge];
        return {
          ...prev,
          activeChallenges: newChallenges,
          currentIndex: newChallenges.length - 1,
          timeLeft: LIVENESS_CONFIG.CHALLENGE_TIMEOUT_MS,
          progress: 0,
        };
      });

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - challengeStartRef.current;
        const remaining = Math.max(0, LIVENESS_CONFIG.CHALLENGE_TIMEOUT_MS - elapsed);
        setState((prev) => ({ ...prev, timeLeft: remaining }));
        if (remaining === 0) clearTimer();
      }, 100);
    }

    setState((prev) => ({ ...prev, progress: challengeProgress }));
  }, [pipelineResult, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { ...state, reset };
}
