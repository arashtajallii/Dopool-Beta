# Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity Isolation (`UserVault`)**: A user document at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`, with `request.auth.token.email_verified == true` and `incoming().ownerId == request.auth.uid`.
2. **Relational Master Gate (`RunActivityDoc` & `CashoutDoc`)**: Subcollection documents under `/users/{userId}/activities/{activityId}` and `/users/{userId}/cashouts/{cashoutId}` require the parent `/users/{userId}` document to exist and have `ownerId == request.auth.uid`.
3. **Immutable Audit Trail**: `RunActivityDoc` and `CashoutDoc` records are append-only audit logs (`allow update, delete: if false;`), and `createdAt` + `ownerId` on `UserVault` are strictly immutable.
4. **Numeric & Volumetric Bounds**: `lockedPoolBalance` must be within `[0, 1000000]`, `totalKm` within `[0, 500000]`, `distanceKm` within `[0, 250]`, and all strings must enforce strict `.size()` limits matching `firebase-blueprint.json`.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection**: Adding `"isAdmin": true` to `/users/{userId}` -> Rejected by `hasOnly()`.
2. **Cross-User PII Read**: Authenticated user `uid_B` reading `/users/uid_A` -> Rejected by `isOwner(userId)`.
3. **Owner Spoofing on Create**: User `uid_A` creating `/users/uid_A` with `ownerId: "uid_B"` -> Rejected by `data.ownerId == request.auth.uid`.
4. **Unverified Email Write**: User with `email_verified: false` writing to `/users/{userId}` -> Rejected by `isVerifiedUser()`.
5. **Negative Balance Injection**: Setting `lockedPoolBalance: -500` -> Rejected by `data.lockedPoolBalance >= 0`.
6. **Million-Coin Overflow**: Setting `lockedPoolBalance: 999999999` -> Rejected by `data.lockedPoolBalance <= 1000000`.
7. **Timestamp Forgery**: Passing client timestamp instead of `request.time` for `createdAt` or `updatedAt` -> Rejected by `incoming().createdAt == request.time`.
8. **Immutable Field Mutation**: Changing `createdAt` or `ownerId` during `UserVault` update -> Rejected by immutability check.
9. **ID Poisoning**: Creating `/users/{userId}/activities/{200_char_id}` -> Rejected by `isValidId(activityId)`.
10. **Orphaned Subcollection Write**: Creating `/users/nonexistent/activities/act_1` without parent user doc -> Rejected by Master Gate `exists()` check.
11. **Audit Log Tampering**: Updating or deleting an existing `/users/{userId}/activities/{activityId}` or `cashouts/{cashoutId}` -> Rejected by `allow update, delete: if false`.
12. **Unauthorized List Scraping**: Listing `/users` collection -> Rejected (`allow list: if false` on `/users/{userId}`).
