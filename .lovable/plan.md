# Use the public CivicX logo everywhere

## Changes
- Point the shared CivicX logo component to `/logo.png`, preserving every existing placement and style.
- Update the browser icon reference to `/logo.png` so deployed branding uses the same public asset.
- Remove the obsolete managed-logo reference after confirming nothing else imports it.

## Verification
- Check all source references for stale or broken logo paths.
- Verify the home, authentication, and dashboard branding at desktop and mobile sizes.
- Confirm the logo and browser icon return successfully and the app builds without errors.
