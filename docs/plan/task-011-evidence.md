# Task 011 — Immutable Guide Publication Evidence

## Scope

Task 011 publishes a weekly guide only when the required Thesis, Trigger, Risk, and Invalidation fields are complete and the source data quality and G0-G4 gates pass.

Implemented in `src/lib/research/guide.ts`:

- Required Thesis, Trigger, Risk, and Invalidation validation.
- Fixed `snapshotId`, `asOf`, `strategyVersion`, `universeFilterVersion`, and `approvedAt` fields on each publication.
- Publication blocking for non-passed quality or failed G0-G4 gates.
- Deep immutability for the published guide and nested risk/gate data.
- Correction by new version with `supersedesId`; the original publication remains unchanged.
- Additional-buy validation requiring thesis maintenance and improved risk-reward.

## Verification

```text
npm run test:task-011
```

The test suite covers required-field blocking, immutable publication, correction versioning, quality/Gate blocking, and additional-buy conditions.
