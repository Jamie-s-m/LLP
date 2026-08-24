# Role QA Matrix

| Role | Route | Action | Expected | Actual | Pass/Fail | Evidence |
| ---- | ----- | ------ | -------- | ------ | -------- | -------- |
| Student | `/dashboard` | View learner dashboard | Limited to own learning data | Not validated on live deployment | Pending | Not yet executed against the deployed environment |
| Teen Student | `/dashboard` | Access youth-safe workspace | Restricted to age-appropriate content | Not validated | Pending | No remote role test executed |
| Parent | `/parent-dashboard` | View child progress and billing | Access only linked child data | Not validated | Pending | No remote role test executed |
| Tutor | `/tutors` / `/tutor/profile` | Manage own profile and bookings | Own profile only | Not validated | Pending | No remote role test executed |
| Teacher | `/teacher/*` | Create/manage permitted content | Own/assigned content only | Not validated | Pending | No remote role test executed |
| Content Creator | `/content/*` | Manage content drafts | Allowed only within permission set | Not validated | Pending | No remote role test executed |
| Moderator | `/moderation` | Review flagged activity | Moderation permissions only | Not validated | Pending | No remote role test executed |
| Customer Support | `/support` | Handle tickets and user cases | Support scope only | Not validated | Pending | No remote role test executed |
| Sales | `/sales` | Manage leads and CRM records | Sales-only boundaries | Not validated | Pending | No remote role test executed |
| Corporate Admin | `/company-admin` | Manage organization access | Organization boundaries only | Not validated | Pending | No remote role test executed |
| Super Admin | `/admin` | Full administrative control | Full access with audit constraints | Not validated | Pending | No remote role test executed |

## Current status

The role matrix remains YELLOW because the deployed environment has not yet been checked for real authorization boundaries, data isolation, or workspace switching under production settings.
