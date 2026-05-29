jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => ({
    executeSql: jest.fn(),
    transaction: jest.fn(),
  })),
  enablePromise: jest.fn(),
}));

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(() => Promise.resolve({
    run: jest.fn(),
    inputs: [],
    outputs: [],
  })),
  useTensorflowModel: jest.fn(() => ({ model: null, state: 'loading' })),
}));

jest.mock('react-native-vision-camera', () => ({
  useCameraDevices: jest.fn(() => ({})),
  Camera: 'Camera',
  useFrameProcessor: jest.fn((fn) => fn),
}));
