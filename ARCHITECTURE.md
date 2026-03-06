# BSR Quality Checker - Frontend Architecture

Complete architecture overview of Stages 1-5 implementation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ A11yProvider │  │  Responsive  │  │  SkipLinks   │      │
│  │              │  │  Container   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Router                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Upload    │  │   Results    │  │   Other      │      │
│  │    /upload   │  │   /results   │  │   Routes     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Upload Flow (Stage 3)

```
User arrives → UploadWizard
                    │
                    ├─ Step 1: ProjectContextForm
                    │           ├─ Smart validation
                    │           ├─ Auto-calculate HRB
                    │           └─ Context summary
                    │
                    ├─ Step 2: DocumentUploadZone
                    │           ├─ Drag & drop
                    │           ├─ File validation
                    │           ├─ Progress tracking
                    │           └─ Document detection
                    │
                    ├─ Step 3: DocumentValidationCard
                    │           ├─ Missing docs check
                    │           ├─ Quality validation
                    │           ├─ Completeness %
                    │           └─ Warnings
                    │
                    └─ Step 4: Submit
                                └─ POST to backend
                                    └─ Navigate to Results
```

## Results Dashboard (Stages 1, 2, 4, 4B)

### Desktop View

```
┌───────────────────────────────────────────────────────────────────┐
│                     ResultsDashboard                               │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         SubmissionGateCard (Stage 1)                     │   │
│  │  RED 🚨 / AMBER ⚠️ / GREEN ✅                            │   │
│  │  Blockers: X | High Priority: Y                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Assessment Summary (Stage 1)                     │   │
│  │  Score: 75/100 | Critical: 5 | Quick Wins: 12           │   │
│  │  [Export] [Action Tracker] [Doc Revisions] [Quick Wins] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    DocumentRevisionDashboard (Stage 4B) - IF VISIBLE     │   │
│  │  Fire Strategy: 8 changes (5 high, 2 medium, 1 review)  │   │
│  │  Structural: 3 changes (2 high, 1 review)                │   │
│  │  [Preview] [Generate DOCX]                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    ActionItemsTracker (Stage 4) - IF VISIBLE             │   │
│  │  Progress: 45% | Total: 20 | In Progress: 8 | Done: 9   │   │
│  │  [ ] Fix fire door widths (Critical)                     │   │
│  │  [ ] Update structural calcs (High)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    HumanReviewTable (Stage 4B) - IF VISIBLE              │   │
│  │  🔴 Human Review Required: 8 items                       │   │
│  │  Filters: [Document] [Status] [Urgency] [Search]        │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ FS-001 🔴 Fire door widths (Fire Strategy, Pg 45) │ │   │
│  │  │ Status: Pending | Reviewer: _____                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  [Export Human Review PDF]                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         QuickWinsSection (Stage 1)                        │   │
│  │  ⚡ 12 issues fixable in < 2 days                        │   │
│  │  [Accept All] [View Details]                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         SpecialistActionsCard (Stage 1)                   │   │
│  │  🔥 Fire Engineer (5 issues, 2-4 weeks)                  │   │
│  │  🏗️ Structural Engineer (3 issues, 1-2 weeks)            │   │
│  │  [Generate Brief] [View Issues]                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Issues Table (Stage 2)                            │   │
│  │  ┌──┬──────┬────────────┬─────────┬────────┬──────┐     │   │
│  │  │☐│ Prio │  ID        │ Title   │ Effort │ Type │     │   │
│  │  ├──┼──────┼────────────┼─────────┼────────┼──────┤     │   │
│  │  │☐│ 🔴  │ FS-001     │ Fire... │ Weeks  │ 🎯   │     │   │
│  │  │☐│ 🟡  │ ST-002     │ Stru... │ Days   │ 🎯   │     │   │
│  │  └──┴──────┴────────────┴─────────┴────────┴──────┘     │   │
│  │                                                            │   │
│  │  [Bulk Actions Toolbar] - IF ITEMS SELECTED              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────┐                                        │
│  │  IssueDetailPanel    │ ← Opens when row clicked              │
│  │  (Stage 2)           │                                        │
│  │  ─────────────────── │                                        │
│  │  FS-001 🔴 CRITICAL │                                        │
│  │  Fire door widths... │                                        │
│  │                      │                                        │
│  │  Reasoning: ...      │                                        │
│  │  Evidence: ...       │                                        │
│  │  Actions: ...        │                                        │
│  │  [← Prev] [Next →]  │                                        │
│  └──────────────────────┘                                        │
└───────────────────────────────────────────────────────────────────┘
```

### Mobile View (Stage 5)

```
┌──────────────────────────┐
│  MobileDashboardView     │
│  ─────────────────────── │
│  Assessment Results      │
│  Jan 15, 2024            │
├──────────────────────────┤
│                          │
│  ┌──────────────────┐   │
│  │ Submission Gate  │   │
│  │ 🚨 RED: Not Ready│   │
│  │ 5 Critical       │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │ Score: 75/100    │   │
│  │ Critical: 5      │   │
│  │ Quick Wins: 12   │   │
│  │ [Quick Actions]  │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │ ⚡ Quick Wins    │   │
│  │ 12 items < 2 days│   │
│  │ [View All →]     │   │
│  └──────────────────┘   │
│                          │
├──────────────────────────┤
│ Bottom Navigation        │
│ [📊 Overview] [📋 Issues]│
│ [✓ Actions]  [📄 Reports]│
└──────────────────────────┘
```

## Modal System

### Engagement Brief Modal (Stage 4)
```
Click "Generate Brief" → EngagementBriefGenerator (hidden)
                              ↓ generates brief
                         EngagementBriefModal (visible)
                              ├─ View/Edit mode
                              ├─ Copy to clipboard
                              ├─ Send email
                              └─ Export PDF
```

### Track Changes Viewer (Stage 4B)
```
Click "Preview Changes" → TrackChangesViewer
                              ├─ Original vs Proposed
                              ├─ Confidence indicator
                              ├─ Accept/Reject
                              ├─ Navigation (prev/next)
                              └─ Export with changes
                                     ↓
                              RevisionExporter
                                     └─ DOCX with track changes
```

### Export Options (Stage 4)
```
Click "Export" → ExportOptionsModal
                     ├─ Full Report (PDF)
                     ├─ Executive Summary (PDF)
                     ├─ Issues List (Excel/CSV)
                     ├─ Specialist Briefs (PDF Bundle)
                     ├─ Action Tracker (Excel)
                     └─ Client Presentation (PPT)
```

## State Management

### ResultsDashboard State
```typescript
// Filters & Views
activeFilter: 'all' | 'blockers' | 'quick_wins' | 'specialist'
showActionTracker: boolean
showRevisionDashboard: boolean

// Selection & Detail
selectedIssueIds: string[]
viewedIssue: AssessmentResult | null
showDetailPanel: boolean

// Modals
showExportModal: boolean
showBriefModal: boolean
showTrackChanges: boolean

// Data
acceptedQuickWins: Set<string>
currentBrief: EngagementBrief | null
```

## Data Flow

### 1. Load Assessment
```
Results.tsx → fetch(/api/.../assessment)
          └─> FullAssessment
              ├─> ResultsDashboard (desktop)
              └─> MobileDashboardView (mobile)
```

### 2. Generate Brief
```
User clicks "Generate Brief"
    ↓
SpecialistActionsCard.onGenerateBrief(specialist, issues)
    ↓
ResultsDashboard.handleGenerateBriefClick()
    ↓
EngagementBriefGenerator (generates content)
    ↓
EngagementBriefModal (displays, allows edit/send/export)
```

### 3. Accept Quick Win
```
User clicks "Accept" on quick win
    ↓
QuickWinsSection.handleAcceptSingle(issueId)
    ↓
ResultsDashboard state update: acceptedQuickWins.add(issueId)
    ↓
(Future) POST /api/quick-wins/accept { issueId }
```

### 4. Review Document Changes
```
User clicks "View Document Revisions"
    ↓
DocumentRevisionDashboard visible
    ↓
User clicks "Preview Changes"
    ↓
TrackChangesViewer opens
    ↓
User reviews each change (accept/reject)
    ↓
User clicks "Export DOCX"
    ↓
RevisionExporter modal
    ↓
(Future) POST /api/revisions/generate → DOCX download
```

## Responsive Behavior

### Breakpoints (Stage 5)
```
Mobile:  < 768px  → MobileDashboardView
Tablet:  768-1024px → Compact desktop view
Desktop: 1024-1440px → Full desktop view
Wide:    > 1440px → Full desktop view with wider spacing
```

### Component Adaptations
```
Desktop:
- ResultsDashboard (multi-column)
- IssuesTable (full table)
- IssueDetailPanel (side panel)
- All modals (centered overlay)

Mobile:
- MobileDashboardView (single column)
- MobileNavigationBar (bottom tabs)
- MobileActionMenu (slide-up drawer)
- MobileFilterPills (horizontal scroll)
- All modals (full screen)
```

## Accessibility Features (Stage 5)

### Keyboard Navigation
```
Tab/Shift+Tab → Navigate interactive elements
Enter/Space   → Activate buttons/links
Esc          → Close modals/drawers
↑/↓ or j/k   → Navigate lists
Home/End     → First/last item
?            → Show keyboard shortcuts help
```

### Screen Reader Support
```
- ARIA labels on all interactive elements
- ARIA live regions for announcements
- Proper heading hierarchy (h1 → h2 → h3)
- Landmark regions (main, nav, aside)
- Skip links for navigation
- Status messages announced
```

### Focus Management
```
- Focus trap in modals
- Focus restoration after modal close
- Visible focus indicators
- Logical tab order
- No keyboard traps
```

## Component Dependencies

```
ResultsDashboard
├── SubmissionGateCard
├── QuickWinsSection
├── SpecialistActionsCard
├── DocumentRevisionDashboard
│   ├── (shows documents with changes)
│   └── Opens: TrackChangesViewer
├── ActionItemsTracker
├── HumanReviewTable
│   └── Exports: Human Review PDF
├── IssuesTable
│   └── Opens: IssueDetailPanel
├── BulkActionsToolbar
├── EngagementBriefGenerator (hidden)
├── EngagementBriefModal
└── ExportOptionsModal

UploadWizard
├── ProjectContextForm
├── DocumentUploadZone
└── DocumentValidationCard

MobileDashboardView
├── MobileNavigationBar
├── MobileActionMenu
├── MobileFilterPills
└── TouchableCard

Providers (wrap entire app)
├── A11yProvider
└── ResponsiveContainer
```

## File Structure

```
packages/frontend/src/
├── components/
│   ├── Stage 1: Dashboard Intelligence
│   │   ├── ResultsDashboard.tsx
│   │   ├── SubmissionGateCard.tsx
│   │   ├── QuickWinsSection.tsx
│   │   └── SpecialistActionsCard.tsx
│   │
│   ├── Stage 2: Contextual Navigation
│   │   ├── IssuesTable.tsx
│   │   ├── IssueDetailPanel.tsx
│   │   └── BulkActionsToolbar.tsx
│   │
│   ├── Stage 3: Guided Upload
│   │   ├── UploadWizard.tsx
│   │   ├── ProjectContextForm.tsx
│   │   ├── DocumentUploadZone.tsx
│   │   └── DocumentValidationCard.tsx
│   │
│   ├── Stage 4: Action-Oriented Outputs
│   │   ├── EngagementBriefGenerator.tsx
│   │   ├── EngagementBriefModal.tsx
│   │   ├── ExportOptionsModal.tsx
│   │   └── ActionItemsTracker.tsx
│   │
│   ├── Stage 4B: Document Regeneration
│   │   ├── DocumentRevisionDashboard.tsx
│   │   ├── TrackChangesViewer.tsx
│   │   ├── RevisionExporter.tsx
│   │   └── HumanReviewTable.tsx
│   │
│   └── Stage 5: Mobile & Accessibility
│       ├── ResponsiveContainer.tsx
│       ├── MobileNavigationBar.tsx
│       ├── MobileDashboardView.tsx
│       └── AccessibilityEnhancements.tsx
│
├── pages/
│   ├── Upload.tsx (uses UploadWizard)
│   └── Results.tsx (uses ResultsDashboard or MobileDashboardView)
│
├── types/
│   └── assessment.ts (all TypeScript interfaces)
│
└── App.tsx (wraps with providers)
```

## Performance Considerations

### Optimization Strategies
```
1. Lazy Loading
   - Load DocumentRevisionDashboard only when needed
   - Load TrackChangesViewer only when opened
   - Load heavy modals on demand

2. Memoization
   - useMemo for filtered/sorted lists
   - React.memo for pure components
   - useCallback for event handlers

3. Virtualization
   - Use react-window for 100+ items in table
   - Render only visible rows
   - Reduce DOM nodes

4. Code Splitting
   - Split by route
   - Split by feature
   - Dynamic imports

5. Bundle Size
   - Tree shake unused code
   - Minimize dependencies
   - Use production builds
```

## Testing Strategy

### Unit Tests
```
✓ Component rendering
✓ User interactions
✓ State updates
✓ Hook logic
✓ Utility functions
```

### Integration Tests
```
✓ Upload wizard flow
✓ Dashboard interactions
✓ Modal workflows
✓ Brief generation
✓ Export functionality
```

### E2E Tests
```
✓ Complete upload → results flow
✓ Accept quick wins workflow
✓ Generate specialist brief
✓ Export report
✓ Mobile navigation
```

### Accessibility Tests
```
✓ Keyboard-only navigation
✓ Screen reader compatibility
✓ Color contrast ratios
✓ Focus management
✓ ARIA attributes
```

---

**This architecture supports:**
- ✅ Clear user flows from upload to action
- ✅ Mobile-first responsive design
- ✅ Full keyboard and screen reader accessibility
- ✅ Modular, maintainable components
- ✅ Optimized performance
- ✅ Comprehensive testing coverage
