# Graph Report - .  (2026-05-28)

## Corpus Check
- Corpus is ~49,544 words - fits in a single context window. You may not need a graph.

## Summary
- 492 nodes · 854 edges · 37 communities (25 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.89)
- Token cost: 3,200 input · 1,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Overlay & Stage Display|UI Overlay & Stage Display]]
- [[_COMMUNITY_Database & App Configuration|Database & App Configuration]]
- [[_COMMUNITY_Camera & Frame Processing|Camera & Frame Processing]]
- [[_COMMUNITY_Dev Build Dependencies|Dev Build Dependencies]]
- [[_COMMUNITY_Architectural Flows & Concepts|Architectural Flows & Concepts]]
- [[_COMMUNITY_Android Build Configuration|Android Build Configuration]]
- [[_COMMUNITY_TypeScript Config & Paths|TypeScript Config & Paths]]
- [[_COMMUNITY_Image Preprocessing Pipeline|Image Preprocessing Pipeline]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Documentation & Architecture Docs|Documentation & Architecture Docs]]
- [[_COMMUNITY_Embedding & Similarity Utilities|Embedding & Similarity Utilities]]
- [[_COMMUNITY_Model Quantization Metadata|Model Quantization Metadata]]
- [[_COMMUNITY_Encrypted Embedding Storage|Encrypted Embedding Storage]]
- [[_COMMUNITY_Recognition Result UI|Recognition Result UI]]
- [[_COMMUNITY_Recognition State Machine|Recognition State Machine]]
- [[_COMMUNITY_iOS AppDelegate|iOS AppDelegate]]
- [[_COMMUNITY_Android MainApplication|Android MainApplication]]
- [[_COMMUNITY_Confidence Bar Component|Confidence Bar Component]]
- [[_COMMUNITY_Active Liveness Gesture Detection|Active Liveness Gesture Detection]]
- [[_COMMUNITY_Android MainActivity|Android MainActivity]]
- [[_COMMUNITY_Cross-Platform Native Entrypoints|Cross-Platform Native Entrypoints]]
- [[_COMMUNITY_App Entry & Display Name|App Entry & Display Name]]
- [[_COMMUNITY_Metro Bundler Config|Metro Bundler Config]]
- [[_COMMUNITY_INT8 Quantization Pipeline|INT8 Quantization Pipeline]]
- [[_COMMUNITY_Sync & S3 Upload Service|Sync & S3 Upload Service]]
- [[_COMMUNITY_App Config Files|App Config Files]]
- [[_COMMUNITY_Babel & TypeScript Config|Babel & TypeScript Config]]
- [[_COMMUNITY_Challenge Generator|Challenge Generator]]
- [[_COMMUNITY_Four-Stage Pipeline Concept|Four-Stage Pipeline Concept]]
- [[_COMMUNITY_Pipeline Result State|Pipeline Result State]]
- [[_COMMUNITY_Liveness Challenge State|Liveness Challenge State]]
- [[_COMMUNITY_Screen Navigation Graph|Screen Navigation Graph]]

## God Nodes (most connected - your core abstractions)
1. `getDatabase()` - 22 edges
2. `LivenessDetector` - 16 edges
3. `FacePipeline` - 16 edges
4. `RecognitionScreen()` - 15 edges
5. `paths` - 12 edges
6. `FaceDetector` - 12 edges
7. `Employee` - 10 edges
8. `AttendanceRecord` - 10 edges
9. `MODELS` - 10 edges
10. `APP_CONFIG` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Android Launcher Icon Design` --references--> `FaceGuard Offline System`  [INFERRED]
  FaceGuardOffline/android/app/src/main/res/mipmap-mdpi/ic_launcher.png → FaceGuardOffline/README.md
- `Employee` --shares_data_with--> `SQLite employees table (id, name, employee_code, embedding BLOB, thumbnail_hash)`  [INFERRED]
  FaceGuardOffline/src/types/index.ts → FaceGuardOffline/src/db/Database.ts
- `RecognitionScreen()` --references--> `RecognitionResultCard`  [EXTRACTED]
  FaceGuardOffline/src/screens/RecognitionScreen.tsx → FaceGuardOffline/src/components/RecognitionResult.tsx
- `SyncStatusBadgeProps` --references--> `SyncStatus`  [EXTRACTED]
  FaceGuardOffline/src/components/SyncStatusBadge.tsx → FaceGuardOffline/src/types/index.ts
- `AttendanceRecord` --shares_data_with--> `SQLite attendance_log table (id, employee_id FK, confidence, liveness_score, synced)`  [INFERRED]
  FaceGuardOffline/src/types/index.ts → FaceGuardOffline/src/db/Database.ts

## Hyperedges (group relationships)
- **Four-Stage Biometric Pipeline Models** — faceguardoffline_readme_stage1_blazeface, faceguardoffline_readme_stage2_minifasnet, faceguardoffline_readme_stage3_active_liveness, faceguardoffline_readme_stage4_mobilefacenet, faceguardoffline_readme_face_landmarker [EXTRACTED 1.00]
- **Privacy Architecture Components** — faceguardoffline_readme_privacy_architecture, faceguardoffline_readme_sqlite_local_storage, faceguardoffline_readme_s3_sync_design, faceguardoffline_readme_stage2_minifasnet, faceguardoffline_readme_stage3_active_liveness [INFERRED 0.95]
- **Offline-First System Components** — faceguardoffline_readme_offline_first_design, faceguardoffline_readme_sqlite_local_storage, faceguardoffline_readme_s3_sync_design, faceguardoffline_readme_react_native_fast_tflite, faceguardoffline_readme_staged_gating_pipeline [INFERRED 0.95]
- **4-Stage Face Processing Pipeline** — ml_facepipeline_processframe, ml_facedetector_facedetector, ml_livenessdetector_passivecheck, ml_facepipeline_evaluatechallenge, ml_facerecogniser_embed, ml_facerecogniser_findbestmatch [EXTRACTED 1.00]
- **Embedding Serialization Pipeline (Float32Array → base64 → BLOB → SQLite)** — ml_facerecogniser_embed, utils_embedding_l2normalize, utils_imageutils_float32arraytob64, db_employeerepository_float32arraytoblob, db_employeerepository_insertemployee, db_database_schema_employees [INFERRED 0.95]
- **SQLite Database Schema (employees + attendance_log with FK, WAL, indexes)** — db_database_getdatabase, db_database_schema_employees, db_database_schema_attendance_log, db_employeerepository_insertemployee, db_attendancerepository_insertattendancerecord [EXTRACTED 1.00]
- **Three Model-Specific Normalization Functions** — ml_preprocessor_normalizeforblazface, ml_preprocessor_normalizeformobilefacenet, ml_preprocessor_normalizeforminifasnet [EXTRACTED 1.00]
- **Dual Embedding Storage (SQLite BLOB + EncryptedStorage)** — db_employeerepository_insertemployee, db_database_schema_employees, utils_crypto_storeembedding, utils_crypto_encrypted_storage_backend, concept_dual_embedding_store [INFERRED 0.85]
- **Alternative Embedding Similarity Metrics** — utils_embedding_cosinesimilarity, utils_embedding_dotproduct, utils_embedding_euclideandistance, utils_embedding_l2normalize [EXTRACTED 1.00]
- **User Journey: Splash → Home → (Recognition | Enrollment | AttendanceLog | Settings)** — screens_splashscreen_splashscreen, screens_homescreen_homescreen, screens_recognitionscreen_recognitionscreen, screens_enrollmentscreen_enrollmentscreen, screens_attendancelogscreen_attendancelogscreen, screens_settingsscreen_settingsscreen, navigation_appnavigator_appnavigator [EXTRACTED 1.00]
- **Recognition State Machine: IDLE→DETECTING→PASSIVE_LIVENESS→ACTIVE_CHALLENGE→RECOGNISING→MATCHED/NO_MATCH/LIVENESS_FAIL** — screens_recognitionscreen_recognition_state_idle, screens_recognitionscreen_recognition_state_detecting, screens_recognitionscreen_recognition_state_passive_liveness, screens_recognitionscreen_recognition_state_active_challenge, screens_recognitionscreen_recognition_state_recognising, screens_recognitionscreen_recognition_state_matched, screens_recognitionscreen_recognition_state_no_match, screens_recognitionscreen_recognition_state_liveness_fail, screens_recognitionscreen_recognitionreducer [EXTRACTED 1.00]
- **Recognition Pipeline Data Flow: FacePipeline → useFacePipeline → useLivenessChallenge → LivenessChallenge + FaceOverlay + RecognitionResultCard** — hooks_usefacepipeline_usefacepipeline, hooks_uselivenessechallenge_uselivenessechallenge, components_cameraview_cameraview, components_faceoverlay_faceoverlay, components_livenesschallenge_livenesschallenge, components_recognitionresult_recognitionresultcard, screens_recognitionscreen_recognitionscreen [EXTRACTED 1.00]
- **Liveness Challenge Flow: pipeline assigns challenge → useLivenessChallenge tracks timer/progress → LivenessChallenge renders → pass dispatches RECOGNISING / fail dispatches LIVENESS_FAIL** — hooks_usefacepipeline_usefacepipeline, hooks_uselivenessechallenge_uselivenessechallenge, components_livenesschallenge_livenesschallenge, components_livenesschallenge_getchallengedisplay, screens_recognitionscreen_recognition_state_active_challenge, screens_recognitionscreen_recognition_state_liveness_fail, screens_recognitionscreen_recognition_state_recognising [EXTRACTED 1.00]
- **Enrollment Flow: FaceDetector → embedFromBuffer → cosine dup check → insertEmployee → updateEmployeeCache** — screens_enrollmentscreen_enrollmentscreen, screens_enrollmentscreen_handlecapture, screens_enrollmentscreen_performinsert, hooks_usefacepipeline_updateemployeecache, components_faceoverlay_faceoverlay [EXTRACTED 1.00]
- **Sync Status UI: useNetworkSync → SyncStatus → SyncStatusBadge (used in HomeScreen, RecognitionScreen, AttendanceLogScreen)** — hooks_usenetworksync_usenetworksync, components_syncstatusbadge_syncstatusbadge, components_syncstatusbadge_getbadgecolor, screens_homescreen_homescreen, screens_recognitionscreen_recognitionscreen, screens_attendancelogscreen_attendancelogscreen [EXTRACTED 1.00]
- **Boot Sequence: SplashScreen → permissions → DB → FacePipeline.create → getAllEmployees → updateEmployeeCache → navigate Home** — screens_splashscreen_splashscreen, screens_splashscreen_runboot, hooks_usefacepipeline_updateemployeecache, screens_homescreen_homescreen [EXTRACTED 1.00]
- **Sync pipeline: startListening → triggerSync → uploadBatch → markSynced/purgeSynced** — sync_syncservice_startlistening, sync_syncservice_triggersync, sync_s3uploader_uploadbatch, dep_netinfo, dep_background_fetch, dep_aws_sdk [EXTRACTED 1.00]
- **Android build pipeline: settings.gradle + build.gradle + app/build.gradle (NDK, TFLite, autolinking, aaptOptions, packagingOptions)** — android_settings_gradle, android_build_gradle, android_app_build_gradle, android_app_build_gradle_tflite, android_app_build_gradle_aapt, android_app_build_gradle_packaging, android_mainapplication, android_mainactivity [EXTRACTED 0.95]
- **Test coverage triad: attendanceRepository + embedding + preprocessor tests** — test_attendancerepository_test, test_embedding_test, test_preprocessor_test, config_jest_setup [INFERRED 0.95]
- **Cross-platform entrypoint: MainActivity (Android) ~ AppDelegate (iOS) ~ index.js ~ app.json share moduleName=FaceGuardOffline** — android_mainactivity, ios_appdelegate, config_index_js, config_app_json, concept_cross_platform_module_name [INFERRED 0.95]

## Communities (37 total, 12 thin omitted)

### Community 0 - "UI Overlay & Stage Display"
Cohesion: 0.06
Nodes (43): FaceOverlayProps, StageStyle, styles, ChallengeType, LIVENESS_CONFIG, MODELS, _employees, INITIAL_RESULT (+35 more)

### Community 1 - "Database & App Configuration"
Cohesion: 0.06
Nodes (39): APP_CONFIG, getPendingCount(), getPendingRecords(), getRecentRecords(), getTodayCount(), getTodayRecords(), insertAttendanceRecord(), markSynced() (+31 more)

### Community 2 - "Camera & Frame Processing"
Cohesion: 0.06
Nodes (44): CameraView, CameraViewProps, styles, FaceOverlay, getStageStyle (PipelineStage → border color + animation), ChallengeDisplay, getChallengeDisplay(), LivenessChallenge (+36 more)

### Community 3 - "Dev Build Dependencies"
Cohesion: 0.06
Nodes (35): devDependencies, @babel/core, babel-jest, babel-plugin-module-resolver, @babel/preset-env, @babel/runtime, eslint, jest (+27 more)

### Community 4 - "Architectural Flows & Concepts"
Cohesion: 0.08
Nodes (26): Boot Sequence (permissions → database → AI models → employees → navigate Home), Embedding Serialization Pipeline (Float32Array → base64 → SQLite BLOB), Enrollment Flow (capture → cosine dup check → insertEmployee → updateEmployeeCache), SQLite employees table (id, name, employee_code, embedding BLOB, thumbnail_hash), blobToFloat32Array(), float32ArrayToBlob(), getAllEmployees(), getEmployee() (+18 more)

### Community 5 - "Android Build Configuration"
Cohesion: 0.11
Nodes (24): android/app/build.gradle (TFLite 2.14.0, aaptOptions, packagingOptions), aaptOptions noCompress (.tflite/.task/.bin), packagingOptions pickFirst libc++_shared.so (all ABIs), TFLite 2.14.0 + GPU + Support deps, android/build.gradle (NDK 27.1.12297006, compileSdk 34), android/settings.gradle (autolinking via native_modules.gradle), jest.setup.js (mocks: sqlite, mmkv, tflite, vision-camera), metro.config.js (assetExts: tflite/task/bin) (+16 more)

### Community 6 - "TypeScript Config & Paths"
Cohesion: 0.09
Nodes (21): compilerOptions, baseUrl, noFallthroughCasesInSwitch, noImplicitAny, noImplicitReturns, paths, strict, strictNullChecks (+13 more)

### Community 7 - "Image Preprocessing Pipeline"
Cohesion: 0.19
Nodes (20): claheEqualize(), cropFace(), normalizeForBlazeFace(), normalizeForBlazeFace (÷127.5 − 1, range [-1,1]), normalizeForMiniFASNet(), normalizeForMobileFaceNet(), prepareFaceForBlazeFace(), prepareFaceForBlazeFace (crop→resize 128x128→normalize) (+12 more)

### Community 8 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (21): dependencies, aws-sdk, react, react-native, @react-native-async-storage/async-storage, react-native-background-fetch, @react-native-community/netinfo, react-native-encrypted-storage (+13 more)

### Community 9 - "Documentation & Architecture Docs"
Cohesion: 0.13
Nodes (21): Android Launcher Icon Design, CLAHE Preprocessing, Cosine Similarity Search, Employee Enrollment Flow, MediaPipe Face Landmarker Model, FaceGuard Offline System, iOS Xcode Project Setup, On-Device Model Size Budget (+13 more)

### Community 10 - "Embedding & Similarity Utilities"
Cohesion: 0.15
Nodes (15): a, b, base, neg, norm, normA, normalised, normB (+7 more)

### Community 11 - "Model Quantization Metadata"
Cohesion: 0.17
Nodes (11): lineage_events, records, schema_version, summary, direct_count, inferred_count, lineage_event_count, missing_count (+3 more)

### Community 12 - "Encrypted Embedding Storage"
Cohesion: 0.27
Nodes (8): Dual Embedding Storage (SQLite BLOB + EncryptedStorage — redundant secure backup), deleteEmbedding(), deleteEncrypted(), encryptAndStore(), react-native-encrypted-storage (OS keychain/keystore backend), retrieveAndDecrypt(), retrieveEmbedding(), storeEmbedding()

### Community 13 - "Recognition Result UI"
Cohesion: 0.25
Nodes (7): { height: SCREEN_HEIGHT }, RecognitionResultCard, RecognitionResultProps, StatCell, StatCellProps, styles, RecognitionResult

### Community 14 - "Recognition State Machine"
Cohesion: 0.29
Nodes (8): RecognitionState: ACTIVE_CHALLENGE, RecognitionState: DETECTING, RecognitionState: IDLE, RecognitionState: LIVENESS_FAIL, RecognitionState: MATCHED, RecognitionState: NO_MATCH, RecognitionState: PASSIVE_LIVENESS, RecognitionState: RECOGNISING

### Community 17 - "Confidence Bar Component"
Cohesion: 0.50
Nodes (4): computeColor(), ConfidenceBar, ConfidenceBarProps, styles

### Community 18 - "Active Liveness Gesture Detection"
Cohesion: 0.40
Nodes (5): evaluateChallenge (dispatch BLINK/SMILE/NOD/TURN to LivenessDetector), detectBlink (EAR history dip detection), detectHeadTurn (yaw delta LEFT/RIGHT), detectNod (pitch delta), detectSmile (mouth width/height ratio)

### Community 20 - "Cross-Platform Native Entrypoints"
Cohesion: 0.67
Nodes (4): MainActivity (Android, mainComponentName=FaceGuardOffline), MainApplication (PackageList autolinking, SoLoader, New Architecture), Cross-platform module name: FaceGuardOffline (Android + iOS), AppDelegate.swift (moduleName=FaceGuardOffline)

### Community 23 - "INT8 Quantization Pipeline"
Cohesion: 0.67
Nodes (3): INT8 quantization (ONNX→TFLite, 533 nodes, 525 direct + 4 rewritten), Conv/PRelu/BN tensor pruning (prune_unused_tensors lineage events), best_model_quantized tensor correspondence report (533 nodes, INT8, Conv/PRelu pruning)

### Community 24 - "Sync & S3 Upload Service"
Cohesion: 0.67
Nodes (3): S3Uploader class, SyncService class, syncService singleton export

## Knowledge Gaps
- **189 isolated node(s):** `name`, `version`, `private`, `android`, `ios` (+184 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `insertEmployee()` connect `Architectural Flows & Concepts` to `UI Overlay & Stage Display`, `Database & App Configuration`, `Encrypted Embedding Storage`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Dual Embedding Storage (SQLite BLOB + EncryptedStorage — redundant secure backup)` connect `Encrypted Embedding Storage` to `Architectural Flows & Concepts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Overlay & Stage Display` be split into smaller, more focused modules?**
  _Cohesion score 0.058941058941058944 - nodes in this community are weakly interconnected._
- **Should `Database & App Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.06321334503950835 - nodes in this community are weakly interconnected._
- **Should `Camera & Frame Processing` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `Dev Build Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._