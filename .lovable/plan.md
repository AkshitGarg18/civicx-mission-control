# CivicX demo data reset

Only records get removed. No table, column, policy, function, trigger, bucket, route, or feature is touched.

## What is in the database right now

| Data | Records |
| --- | --- |
| Sign-in accounts | 16 |
| People/organisation profiles | 11 |
| Reported challenges | 15 |
| Challenge status timeline entries | 62 |
| Evidence file records | 0 |
| Duplicate relationships | 0 |
| Teams | 6 |
| Team members | 12 |
| Solution proposals | 3 |
| AI feasibility reviews | 3 |
| Industry collaborations | 2 |
| Uploaded evidence files in storage | 0 |

Everything above is old test data, so all of it is cleared.

## Deletion order (children before parents)

1. AI feasibility reviews
2. Industry collaborations
3. Solution proposals
4. Team members
5. Teams
6. Duplicate relationships
7. Challenge status timeline entries
8. Evidence records
9. Challenges (canonical links inside this table are cleared first so nothing blocks)
10. Profiles
11. Sign-in accounts

Storage has no evidence files, so nothing to clean there; the bucket and its rules stay as they are.

## Notes

- Trigger-driven status syncing is unaffected: parents are removed last, so no half-deleted state.
- Nothing is created in place of the deleted data — a genuine clean slate.
- Sign-up, role selection, and all permission rules stay exactly as they are.

## Verification after the reset

Build/typecheck, then a real signed-up run through: new account and role choice, challenge submission with AI analysis, university discovery and matching, team formation, proposal + AI review, industry opportunities, emergency flow, map, and the AI assistant. Permission checks confirmed as part of that run.
