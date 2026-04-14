# CareConnect MVP v0.1

## Target Users
- Aged-care nurses and care workers who need fast shift visibility.
- Care coordinators who triage risk and assign tasks.
- Facility managers who need confidence in resident safety workflows.

## Must-Have Flows (Ship Filter)
Only changes that improve these flows are in-scope for MVP v0.1.

1. List residents
- User opens resident list and sees up-to-date residents with room and status.

2. Filter by risk/severity
- User filters alerts and quickly identifies critical/high-priority residents.

3. View resident profile
- User opens one resident and sees identity, conditions, allergies, meds, and latest vitals context.

4. Record a clinical note / update resident status
- User updates resident status or notes and sees the update reflected immediately.

5. Create and track tasks
- User creates a care task and marks task progress without losing assignment context.

6. Review and acknowledge alerts
- User acknowledges an alert and the acknowledged state persists consistently.

7. Open and send secure message in conversation
- User opens a conversation thread, sends a message, and sees expected delivery/read behavior.

## Minimum Data That Must Be Correct
These fields are critical-path trust data for MVP decisions and patient safety.

- Resident identity: `id`, `name`, `room`
- Resident clinical state: `status`, `conditions`, `allergies`, `medications`
- Alert data: `id`, `resident_id`, `severity`, `status`, `created_at`
- Task data: `id`, `resident_id`, `title`, `status`, `assigned_to`
- Message data: `conversation_id`, `sender`, `content`, `created_at`
- Health checks: `/health` API status and DB connectivity status

## Milestone Decision
Selected milestone: **internal usability test**

Rationale:
- Current maturity supports realistic caregiver workflow validation.
- Requires stronger flow reliability and parity checks, but not full pilot-grade compliance.
- Best fit to reduce risk before a clinical pilot.

## Scope Rule for Next Changes
If a task does not move one of the seven must-have flows forward, move it to a later refactor cycle.
