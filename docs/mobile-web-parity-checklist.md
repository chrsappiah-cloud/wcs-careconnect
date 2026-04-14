# Mobile-Web Parity Checklist

Use this checklist before marking a feature complete.

## Surface Coverage
- Route/screen exists on iOS simulator and browser.
- Primary navigation path is identical in intent on both surfaces.

## API Behavior
- Same endpoint and request payload shape from mobile and web.
- Response contract is handled consistently (required fields, empty states).
- Loading, retry, and timeout behavior is equivalent.

## Error States
- User-visible error state appears on both surfaces.
- Validation errors are mapped to equivalent UI feedback.
- Offline/failed request fallback path is tested for both surfaces.

## Primary UI Actions
- Core action (create/update/acknowledge/send) works in simulator.
- Same core action works in browser.
- Success confirmation and data refresh behavior are consistent.

## Data Integrity Checks
- IDs and status transitions match backend contract.
- Timestamps and ordering are displayed consistently.

## Sign-off
- [ ] Simulator pass
- [ ] Browser pass
- [ ] API contract pass
- [ ] Happy-path e2e pass
