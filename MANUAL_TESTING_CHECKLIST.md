# BSR Quality Checker - Manual Testing Checklist

**Version:** 1.0
**Last Updated:** 2026-03-03
**Purpose:** Comprehensive manual testing checklist for all interactive elements in the BSR Quality Checker portal

## How to Use This Checklist

1. **Priority**: Focus on P0 (Critical) items first
2. **Tester**: Assign your name when claiming a test
3. **Date**: Record the date of testing
4. **Pass/Fail**: Mark ✅ for pass, ❌ for fail
5. **Notes**: Record any issues, bugs, or observations

---

## P0 (Critical) Tests - Test These First

### 1. SignIn.tsx - Authentication

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Email input | Enter valid email | P0 | Email accepted, no validation errors | | | | | |
| Email input | Enter invalid email format | P0 | Show validation error "Invalid email" | | | | | |
| Password input | Enter password | P0 | Password masked with dots | | | | | |
| Password input | Click show/hide password toggle | P0 | Password visibility toggles | | | | | |
| Sign In button | Click with empty fields | P0 | Show validation errors | | | | | |
| Sign In button | Click with invalid credentials | P0 | Show error "Invalid credentials" | | | | | |
| Sign In button | Click with valid credentials | P0 | Redirect to /dashboard or /packs | | | | | |
| Google OAuth button (if enabled) | Click Google sign-in | P0 | Open Google auth popup | | | | | |
| Microsoft OAuth button (if enabled) | Click Microsoft sign-in | P0 | Open Microsoft auth popup | | | | | |
| Forgot password link | Click forgot password | P0 | Navigate to password reset page | | | | | |
| Page load | Navigate to /sign-in | P0 | Page loads within 2 seconds | | | | | |

---

### 2. Upload.tsx - Document Upload

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Drag-and-drop zone | Drag PDF file over zone | P0 | Zone highlights/changes appearance | | | | | |
| Drag-and-drop zone | Drop PDF file | P0 | File added to upload list | | | | | |
| Drag-and-drop zone | Drop non-PDF file | P0 | Show error "Only PDF files accepted" | | | | | |
| Browse button | Click browse | P0 | Open file picker dialog | | | | | |
| File picker | Select single PDF | P0 | File added to list | | | | | |
| File picker | Select multiple PDFs | P0 | All files added to list | | | | | |
| File picker | Select file > 50MB | P0 | Show error "File exceeds 50MB limit" | | | | | |
| File list | View uploaded files | P0 | Show filename, size, type | | | | | |
| Remove file button | Click remove on file | P0 | File removed from list | | | | | |
| Metadata form - Field 1 | Fill first metadata field | P0 | Text accepted | | | | | |
| Metadata form - Field 2 | Fill second metadata field | P0 | Text accepted | | | | | |
| Metadata form - Field 3 | Fill third metadata field | P0 | Text accepted | | | | | |
| Metadata form - Field 4 | Fill fourth metadata field | P0 | Text accepted | | | | | |
| Metadata form - Field 5 | Fill fifth metadata field | P0 | Text accepted | | | | | |
| Upload button | Click with no files | P0 | Show error "Please select files" | | | | | |
| Upload button | Click with files + metadata | P0 | Upload starts, show progress bar | | | | | |
| Upload progress | Monitor upload | P0 | Progress bar updates 0-100% | | | | | |
| Upload success | Complete upload | P0 | Show success message, create new version | | | | | |
| Upload error | Simulate network error | P0 | Show error message, retry option | | | | | |

---

### 3. Results.tsx - AI Assessment Workflow (MOST CRITICAL - 1,324 lines)

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Page load - Pending status | Navigate to results page | P0 | Show "Pending" status badge | | | | | |
| Run Assessment button | Click button (Pending status) | P0 | Change to "Running" status | | | | | |
| Loading indicator | Assessment running | P0 | Show spinner/progress indicator | | | | | |
| Status polling | Wait during assessment | P0 | Poll status every 3 seconds | | | | | |
| Status update | Assessment completes | P0 | Change to "Completed" status | | | | | |
| Carousel display | Assessment completes | P0 | Carousel auto-displays with first criterion | | | | | |
| Criterion card | View criterion | P0 | Show title, description, compliance status | | | | | |
| Accept button | Click Accept | P0 | Move to next criterion, mark as accepted | | | | | |
| Reject button | Click Reject | P0 | Move to next criterion, mark as rejected | | | | | |
| Skip button | Click Skip | P0 | Move to next criterion, leave undecided | | | | | |
| Carousel navigation | Navigate through all criteria | P0 | Can progress through all items | | | | | |
| Carousel completion | Accept/Reject last criterion | P0 | Show completion message | | | | | |
| Document generation trigger | Complete carousel | P0 | Trigger document generation API call | | | | | |
| Expand criterion button | Click expand | P0 | Show detailed evidence/reasoning | | | | | |
| Collapse criterion button | Click collapse | P0 | Hide detailed information | | | | | |
| Show all criteria toggle | Click "Show All" | P0 | Expand all criteria details | | | | | |
| Hide all criteria toggle | Click "Hide All" | P0 | Collapse all criteria details | | | | | |
| Download MD button | Click Markdown download | P0 | Download .md file | | | | | |
| Download PDF button | Click PDF download | P0 | Download .pdf file | | | | | |
| Download JSON button | Click JSON download | P0 | Download .json file | | | | | |
| Download error | Click download before completion | P0 | Show error "Assessment not complete" | | | | | |
| Error state | Simulate API failure | P0 | Show error message with retry option | | | | | |
| Refresh during running | Refresh page mid-assessment | P0 | Resume showing "Running" status | | | | | |

---

### 4. PacksList.tsx - Pack Creation & Management

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Page load | Navigate to /packs | P0 | Show list of packs or empty state | | | | | |
| New Pack button | Click New Pack | P0 | Open pack creation modal | | | | | |
| Modal - Pack name input | Leave name empty | P0 | Show validation "Name required" | | | | | |
| Modal - Pack name input | Enter valid name | P0 | Accept text input | | | | | |
| Modal - Client dropdown | Click dropdown | P0 | Show list of available clients | | | | | |
| Modal - Client dropdown | Select client | P0 | Client selected, displayed in field | | | | | |
| Modal - Service package dropdown | Click dropdown | P0 | Show service package options | | | | | |
| Modal - Service package dropdown | Select "Gateway 2" | P0 | Gateway 2 selected | | | | | |
| Modal - Template dropdown | Click dropdown | P0 | Show available templates | | | | | |
| Modal - Template dropdown | Hover template option | P0 | Show template description | | | | | |
| Modal - Template dropdown | Select template | P0 | Template selected | | | | | |
| Modal - Auto-apply checkbox | Check checkbox | P0 | Checkbox checked | | | | | |
| Modal - Auto-apply checkbox | Uncheck checkbox | P0 | Checkbox unchecked | | | | | |
| Create Pack button | Click with valid data | P0 | Modal closes, pack created | | | | | |
| Create Pack button | Click with template + auto-apply | P0 | Pack created with tasks auto-generated | | | | | |
| Cancel button | Click Cancel | P0 | Modal closes, no pack created | | | | | |
| Pack list item | Click pack name | P0 | Navigate to pack detail page | | | | | |
| Upload button (on pack) | Click Upload | P0 | Navigate to upload page | | | | | |
| Delete button (on pack) | Click Delete | P0 | Show confirmation dialog | | | | | |
| Delete confirmation | Confirm delete | P0 | Pack deleted from list | | | | | |
| Delete confirmation | Cancel delete | P0 | Pack remains in list | | | | | |
| Client filter dropdown | Select client | P0 | Filter packs by selected client | | | | | |
| Client filter dropdown | Select "All Clients" | P0 | Show all packs | | | | | |
| Empty state | Delete all packs | P0 | Show empty state message | | | | | |

---

### 5. PackStatusChangeModal.tsx - Status Workflow

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Modal open | Click "Change Status" | P0 | Modal opens | | | | | |
| Current status display | View modal | P0 | Shows current pack status | | | | | |
| Status radio buttons | View options | P0 | Only show valid transitions | | | | | |
| Status radio button | Click option | P0 | Radio button selected | | | | | |
| Notes field | Enter text | P0 | Text accepted (optional field) | | | | | |
| Notes field | Leave empty | P0 | No validation error | | | | | |
| Change Status button | Click with status selected | P0 | Submit status change via API | | | | | |
| Change Status button | Click without selection | P0 | Show error "Please select status" | | | | | |
| Success state | Status change succeeds | P0 | Modal closes, success message shown | | | | | |
| Error state | Status change fails (API error) | P0 | Show error message, modal stays open | | | | | |
| Cancel button | Click Cancel | P0 | Modal closes, status unchanged | | | | | |
| Workflow enforcement | Try invalid transition | P0 | Option not available/disabled | | | | | |

---

## P1 (High Priority) Tests

### 6. ClientsList.tsx - Client Management

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Page load | Navigate to /clients | P1 | Show list of clients | | | | | |
| Add Client button | Click Add Client | P1 | Open client creation modal | | | | | |
| Modal - Name input | Leave empty | P1 | Show validation "Name required" | | | | | |
| Modal - Email input | Enter invalid email | P1 | Show validation "Invalid email format" | | | | | |
| Modal - Email input | Enter valid email | P1 | Accept email | | | | | |
| Create button | Click with valid data | P1 | Client created, modal closes | | | | | |
| Edit button (on client) | Click Edit | P1 | Open edit modal with pre-filled data | | | | | |
| Edit modal | Change name | P1 | Update client name | | | | | |
| Save button | Click Save | P1 | Client updated, modal closes | | | | | |
| Delete button | Click Delete | P1 | Show confirmation dialog | | | | | |
| Delete confirmation | Confirm | P1 | Client deleted from list | | | | | |
| View Packs button | Click on client | P1 | Navigate to packs filtered by client | | | | | |

---

### 7. TaskChecklist.tsx - Task Management

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Page load | Navigate to pack tasks | P1 | Show task checklist | | | | | |
| Add Task button | Click Add Task | P1 | Show task creation form | | | | | |
| Task form | Fill required fields | P1 | Accept input | | | | | |
| Create Task button | Click with valid data | P1 | Task created, added to list | | | | | |
| Task checkbox | Click to complete | P1 | Task marked complete | | | | | |
| Task item | Click task title | P1 | Open task detail modal | | | | | |
| Delete task button | Click delete | P1 | Show confirmation | | | | | |
| Delete confirmation | Confirm | P1 | Task deleted | | | | | |
| Filter - Status | Select "Pending" | P1 | Show only pending tasks | | | | | |
| Filter - Priority | Select "High" | P1 | Show only high priority tasks | | | | | |
| Filter - Overdue | Check overdue checkbox | P1 | Show only overdue tasks | | | | | |
| Sort dropdown | Select "Due Date" | P1 | Sort tasks by due date | | | | | |
| Progress bar | Complete tasks | P1 | Progress bar updates (e.g., 3/10) | | | | | |

---

### 8. TaskDetailModal.tsx - Task Details

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Modal open | Click task | P1 | Open modal with task details | | | | | |
| Title field | Edit title | P1 | Title updates | | | | | |
| Description field | Edit description | P1 | Description updates | | | | | |
| Status dropdown | Change status | P1 | Status updates | | | | | |
| Priority dropdown | Change priority | P1 | Priority updates | | | | | |
| Due date picker | Select date | P1 | Date selected | | | | | |
| Category dropdown | Select category | P1 | Category updates | | | | | |
| Estimated hours input | Enter number | P1 | Hours accepted | | | | | |
| Assignee dropdown | Select assignee | P1 | Assignee updates | | | | | |
| Dependencies dropdown | Select dependency | P1 | Dependency added | | | | | |
| Tags input | Add tag | P1 | Tag added to task | | | | | |
| Save Changes button | Click with updates | P1 | Task saved via API | | | | | |
| Comment input | Enter comment | P1 | Comment text accepted | | | | | |
| Add Comment button | Click | P1 | Comment added to task | | | | | |
| Delete comment button | Click delete | P1 | Comment removed | | | | | |
| Cancel button | Click Cancel | P1 | Modal closes without saving | | | | | |

---

## P2 (Medium Priority) Tests

### 9. AI Regeneration Features

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Regenerate button | Click on criterion | P2 | Re-run AI assessment for criterion | | | | | |
| Regeneration progress | Wait for completion | P2 | Show loading, update criterion | | | | | |

---

### 10. Comment Functionality (General)

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Comment thread | View comments | P2 | Show all comments chronologically | | | | | |
| Comment timestamps | Check time | P2 | Show relative time (e.g., "2 hours ago") | | | | | |

---

### 11. Template Management

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Template selector | View templates | P2 | Show available templates | | | | | |
| Template description | Hover template | P2 | Show description tooltip | | | | | |

---

## P3 (Low Priority) Tests

### 12. UI Toggles & Preferences

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| Dark mode toggle (if exists) | Click toggle | P3 | Switch to dark theme | | | | | |
| Sidebar collapse | Click collapse | P3 | Sidebar minimizes | | | | | |

---

### 13. Empty States

| Element | Test Scenario | Priority | Expected Behavior | Actual Behavior | Pass/Fail | Notes | Tester | Date |
|---------|--------------|----------|-------------------|-----------------|-----------|-------|--------|------|
| No packs | Delete all packs | P3 | Show empty state message | | | | | |
| No tasks | Delete all tasks | P3 | Show empty state message | | | | | |
| No clients | Delete all clients | P3 | Show empty state message | | | | | |

---

## Cross-Browser Testing

Test P0 features across browsers:

| Browser | Version | Tester | Date | Status | Notes |
|---------|---------|--------|------|--------|-------|
| Chrome | Latest | | | | |
| Firefox | Latest | | | | |
| Safari | Latest | | | | |
| Edge | Latest | | | | |

---

## Mobile Responsive Testing

Test P0 features on mobile viewports:

| Device | Viewport | Tester | Date | Status | Notes |
|--------|----------|--------|------|--------|-------|
| iPhone 12 | 390x844 | | | | |
| iPad | 768x1024 | | | | |
| Android (Pixel 5) | 393x851 | | | | |

---

## Performance Testing

| Test | Target | Actual | Pass/Fail | Notes |
|------|--------|--------|-----------|-------|
| Page load time (dashboard) | < 2s | | | |
| Assessment start response | < 1s | | | |
| File upload (10MB PDF) | < 5s | | | |
| Status polling interval | 3s | | | |
| Document download | < 3s | | | |

---

## Accessibility Testing

| Test | Expected | Actual | Pass/Fail | Notes |
|------|----------|--------|-----------|-------|
| Keyboard navigation | All buttons reachable via Tab | | | |
| Screen reader (VoiceOver) | All elements announced | | | |
| Color contrast | WCAG AA compliance | | | |
| Focus indicators | Visible on all interactive elements | | | |

---

## Bug Report Template

When you find a bug, create an issue with this format:

```
**Title:** [Component] Brief description

**Priority:** P0/P1/P2/P3

**Steps to Reproduce:**
1. Navigate to...
2. Click...
3. Enter...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Environment:**
- Browser: Chrome 120
- OS: macOS 14.2
- User: test@example.com
```

---

## Testing Sign-Off

### P0 Tests

- [ ] All P0 tests completed
- [ ] All critical bugs resolved or documented
- [ ] Cross-browser testing completed
- [ ] Performance targets met

### Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Product Owner | | | |
| Technical Lead | | | |

---

## Notes

- This checklist should be updated as new features are added
- Critical bugs (P0) must be resolved before release
- High priority bugs (P1) should be resolved or have mitigation plan
- All tests should be re-run after major updates

