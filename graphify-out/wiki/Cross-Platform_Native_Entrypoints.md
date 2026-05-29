# Cross-Platform Native Entrypoints

> 4 nodes · cohesion 0.67

## Key Concepts

- **MainActivity (Android, mainComponentName=FaceGuardOffline)** (3 connections) — `FaceGuardOffline/android/app/src/main/java/com/faceguardoffline/MainActivity.kt`
- **Cross-platform module name: FaceGuardOffline (Android + iOS)** (2 connections) — `FaceGuardOffline/app.json`
- **AppDelegate.swift (moduleName=FaceGuardOffline)** (2 connections) — `FaceGuardOffline/ios/FaceGuardOffline/AppDelegate.swift`
- **MainApplication (PackageList autolinking, SoLoader, New Architecture)** (1 connections) — `FaceGuardOffline/android/app/src/main/java/com/faceguardoffline/MainApplication.kt`

## Relationships

- No strong cross-community connections detected

## Source Files

- `FaceGuardOffline/android/app/src/main/java/com/faceguardoffline/MainActivity.kt`
- `FaceGuardOffline/android/app/src/main/java/com/faceguardoffline/MainApplication.kt`
- `FaceGuardOffline/app.json`
- `FaceGuardOffline/ios/FaceGuardOffline/AppDelegate.swift`

## Audit Trail

- EXTRACTED: 4 (50%)
- INFERRED: 4 (50%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*