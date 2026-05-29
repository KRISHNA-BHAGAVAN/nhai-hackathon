import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  CameraDevice,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';

interface CameraViewProps {
  device: CameraDevice;
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  isActive: boolean;
}

const CameraView = React.memo<CameraViewProps>(({ device, frameProcessor, isActive }) => {
  const cameraRef = useRef<Camera>(null);

  const format = useCameraFormat(device, [
    { fps: 30 },
    { videoResolution: { width: 640, height: 480 } },
  ]);

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        format={format}
        pixelFormat="rgb"
        enableFpsGraph={false}
      />
    </View>
  );
});

CameraView.displayName = 'CameraView';

export default CameraView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
