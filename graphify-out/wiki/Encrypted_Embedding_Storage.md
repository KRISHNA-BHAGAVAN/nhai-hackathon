# Encrypted Embedding Storage

> 10 nodes · cohesion 0.27

## Key Concepts

- **crypto.ts** (7 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **encryptAndStore()** (3 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **storeEmbedding()** (3 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **Dual Embedding Storage (SQLite BLOB + EncryptedStorage — redundant secure backup)** (2 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **deleteEmbedding()** (2 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **deleteEncrypted()** (2 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **retrieveAndDecrypt()** (2 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **retrieveEmbedding()** (2 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **clearAllEmbeddings()** (1 connections) — `FaceGuardOffline/src/utils/crypto.ts`
- **react-native-encrypted-storage (OS keychain/keystore backend)** (1 connections) — `FaceGuardOffline/src/utils/crypto.ts`

## Relationships

- [[Architectural Flows & Concepts]] (1 shared connections)

## Source Files

- `FaceGuardOffline/src/db/EmployeeRepository.ts`
- `FaceGuardOffline/src/utils/crypto.ts`

## Audit Trail

- EXTRACTED: 22 (88%)
- INFERRED: 3 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*