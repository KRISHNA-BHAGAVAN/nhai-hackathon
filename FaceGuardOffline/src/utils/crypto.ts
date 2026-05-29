import EncryptedStorage from 'react-native-encrypted-storage';

const STORAGE_KEY_PREFIX = 'faceguard_';

export async function encryptAndStore(key: string, value: string): Promise<void> {
  try {
    await EncryptedStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, value);
  } catch (error) {
    throw new Error(`Failed to encrypt and store key "${key}": ${String(error)}`);
  }
}

export async function retrieveAndDecrypt(key: string): Promise<string | null> {
  try {
    const value = await EncryptedStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return value ?? null;
  } catch (error) {
    throw new Error(`Failed to retrieve key "${key}": ${String(error)}`);
  }
}

export async function deleteEncrypted(key: string): Promise<void> {
  try {
    await EncryptedStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
  } catch (error) {
    throw new Error(`Failed to delete key "${key}": ${String(error)}`);
  }
}

export async function storeEmbedding(employeeId: string, embeddingBase64: string): Promise<void> {
  await encryptAndStore(`embedding_${employeeId}`, embeddingBase64);
}

export async function retrieveEmbedding(employeeId: string): Promise<string | null> {
  return retrieveAndDecrypt(`embedding_${employeeId}`);
}

export async function deleteEmbedding(employeeId: string): Promise<void> {
  await deleteEncrypted(`embedding_${employeeId}`);
}

export async function clearAllEmbeddings(): Promise<void> {
  try {
    await EncryptedStorage.clear();
  } catch (error) {
    throw new Error(`Failed to clear encrypted storage: ${String(error)}`);
  }
}
