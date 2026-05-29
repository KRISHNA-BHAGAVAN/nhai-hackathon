const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/vision-camera-resize-plugin/android/src/main/java/com/visioncameraresizeplugin/ResizePlugin.kt',
  'node_modules/vision-camera-resize-plugin/android/src/main/java/com/visioncameraresizeplugin/VisionCameraResizePluginPackage.kt',
];

for (const relativeFile of files) {
  const file = path.join(__dirname, '..', relativeFile);

  if (!fs.existsSync(file)) {
    continue;
  }

  const source = fs.readFileSync(file, 'utf8');
  const patched = source
    .replaceAll('com.mrousavy.camera.frameprocessorss', 'com.mrousavy.camera.frameprocessors')
    .replaceAll('com.mrousavy.camera.frameprocessor.', 'com.mrousavy.camera.frameprocessors.');

  if (patched !== source) {
    fs.writeFileSync(file, patched);
    console.log(`Patched ${relativeFile}`);
  }
}
