import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { Frame } from 'react-native-vision-camera';
import { Employee, PipelineResult } from '../types';
import { FacePipeline } from '../ml/FacePipeline';

// Module-level cache so it's accessible inside worklet without serialisation
let _pipeline: FacePipeline | null = null;
let _employees: Employee[] = [];

export function updateEmployeeCache(employees: Employee[]): void {
  _employees = employees;
}

const INITIAL_RESULT: PipelineResult = {
  stage: 'NO_FACE',
  challengeProgress: 0,
};

export function useFacePipeline(employees: Employee[]): {
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  pipelineResult: PipelineResult;
  isReady: boolean;
  reset: () => void;
} {
  const [pipelineResult, setPipelineResult] = useState<PipelineResult>(INITIAL_RESULT);
  const [isReady, setIsReady] = useState(false);
  const processingRef = useRef(false);

  // Keep module-level cache in sync
  useEffect(() => {
    _employees = employees;
  }, [employees]);

  // Warm up the pipeline on mount
  useEffect(() => {
    let mounted = true;

    FacePipeline.create()
      .then((pipeline) => {
        if (mounted) {
          _pipeline = pipeline;
          setIsReady(true);
        }
      })
      .catch((err: unknown) => {
        if (__DEV__) {
          console.error('useFacePipeline: init failed:', err);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const processFrameOnJS = useCallback((frame: Frame) => {
    if (!_pipeline || processingRef.current) {
      frame.decrementRefCount();
      return;
    }
    processingRef.current = true;
    _pipeline
      .processFrame(frame, _employees)
      .then((result) => {
        setPipelineResult(result);
      })
      .catch((err) => {
        if (__DEV__) {
          console.error('processFrameOnJS error:', err);
        }
      })
      .finally(() => {
        processingRef.current = false;
        frame.decrementRefCount();
      });
  }, []);

  const reset = useCallback(() => {
    _pipeline?.reset();
    setPipelineResult(INITIAL_RESULT);
    processingRef.current = false;
  }, []);

  // createRunOnJS dispatches back to the JS thread from VisionCamera's worklet runtime
  const runProcessFrameOnJS = Worklets.createRunOnJS(processFrameOnJS);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    frame.incrementRefCount();
    runProcessFrameOnJS(frame);
  }, [runProcessFrameOnJS]);

  return { frameProcessor, pipelineResult, isReady, reset };
}
