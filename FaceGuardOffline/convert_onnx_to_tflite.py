import onnx2tf

# Convert ONNX directly to TFLite
onnx2tf.convert(
    input_onnx_file_path='./assets/models/best_model_quantized.onnx',
    output_folder_path='assets/models/',
    output_integer_quantized_tflite=False  # Keep float32 output or set True if needed
)
