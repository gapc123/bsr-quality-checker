# Attlee UI Redesign Implementation Plan

**Objective:** Complete visual redesign of all frontend components using the Attlee design system while preserving all existing logic and functionality.

**Design Principles:**
- NO bold text (max font-weight: 400)
- NO rounded corners (border-radius: 0)
- Square edges everywhere
- Generous whitespace
- Flat, minimal, authoritative aesthetic
- Navy/Cream/Beige/Gold color palette

---

## Phase 1: Application Shell & Navigation
**Goal:** Update core layout, navigation, and routing structure

### Files to Update:
1. **packages/frontend/src/App.tsx**
   - Replace Tailwind classes with design system classes
   - Update navigation header with AttleeLogo component
   - Apply navy background, cream text
   - Square buttons for nav items
   - Remove all rounded corners, shadows, gradients

2. **packages/frontend/src/components/Layout.tsx** (if exists)
   - Update container styles
   - Apply generous padding/margins
   - Ensure consistent navy header, cream body

### Key Changes:
- Navigation background: `var(--navy)`
- Navigation text: `var(--cream)`
- Navigation buttons: `.btn-ghost` (square, no rounded corners)
- Logo placement: Top-left with proper spacing
- Active route indicator: Gold underline (not rounded pill)

### Testing Checkpoint:
- [ ] Navigation renders correctly
- [ ] All routes still accessible
- [ ] Logo displays properly
- [ ] No rounded corners visible
- [ ] Color palette consistent

---

## Phase 2: Assessment Flow (Critical Path)
**Goal:** Redesign assessment pages while maintaining full two-phase engine functionality

### Files to Update:

1. **packages/frontend/src/pages/QuickAssess.tsx**
   - Update file upload area styling
   - Replace Tailwind with design system classes
   - Square upload button with navy/gold
   - Remove rounded file preview cards
   - Update "Save to Client" dialog styling
   - Maintain all logic (upload, assessment call, temp data)

2. **packages/frontend/src/components/CriterionCarousel.tsx** (43KB - HIGH PRIORITY)
   - Update card styling (square, no shadows)
   - Navigation buttons: Square, navy/gold
   - Status badges: Square, flat colors
   - Evidence section: Clean, minimal borders
   - Regulatory reference: Subtle beige background
   - AI reasoning: Cream background, navy text
   - Progress indicator: Square segments (not dots)
   - **DO NOT CHANGE**: Navigation logic, data structure, callbacks

3. **packages/frontend/src/pages/Results.tsx**
   - Update summary cards (square, beige borders)
   - Table styling: Clean lines, no alternating row colors
   - Action buttons: Square, navy/gold
   - Maintain carousel integration
   - Maintain download functionality

4. **packages/frontend/src/components/FileUpload.tsx**
   - Square drop zone with navy dashed border
   - Hover state: Beige background (not rounded)
   - File list: Clean rows with square delete buttons
   - Upload progress: Square bar, gold fill

### Key Changes:
- Assessment cards: `border: 2px solid var(--beige)`, `border-radius: 0`
- Status badges: Square, flat colors (green/yellow/red with no gradients)
- Navigation: `<` and `>` arrows in square buttons
- Progress: Linear bar or square segments (not circular dots)
- Evidence quotes: Beige background with navy border-left
- Buttons: All use `.btn-primary`, `.btn-secondary`, `.btn-ghost`

### Testing Checkpoint:
- [ ] File upload works (drag/drop, click)
- [ ] Assessment runs (full two-phase)
- [ ] Carousel displays all 55+ criteria
- [ ] Navigation between criteria works
- [ ] Evidence, reasoning, references display correctly
- [ ] Save to Client creates client + pack
- [ ] No rounded corners anywhere
- [ ] No bold text (except perhaps matrix_title at 400 weight)

---

## Phase 3: Client & Pack Management
**Goal:** Update administrative pages with consistent design

### Files to Update:

1. **packages/frontend/src/pages/ClientsList.tsx**
   - Client cards: Square, beige borders
   - Add client button: Navy, square
   - Search bar: Square input with navy border
   - Client grid/list: Clean spacing

2. **packages/frontend/src/pages/ClientDetail.tsx**
   - Header: Navy background, cream text
   - Pack list: Square cards with beige borders
   - Action buttons: Square, navy/gold
   - Tabs (if any): Square, gold active indicator

3. **packages/frontend/src/pages/PacksList.tsx**
   - Pack cards: Square, beige borders
   - Status indicators: Square badges
   - Filter controls: Square buttons
   - Table view: Clean lines, beige borders

4. **packages/frontend/src/pages/PackDetail.tsx**
   - Document list: Clean rows with square icons
   - Assessment results link: Square button
   - Delete/edit: Square icon buttons
   - Metadata display: Clean, minimal

### Key Changes:
- All cards: `border: 2px solid var(--beige)`, no shadow
- List items: Beige bottom border, generous padding
- Forms: Square inputs, navy labels
- Action buttons: Consistent sizing, square
- Hover states: Subtle beige background (not shadow lift)

### Testing Checkpoint:
- [ ] Clients list displays correctly
- [ ] Create client works
- [ ] Client detail shows packs
- [ ] Pack detail shows documents
- [ ] All CRUD operations functional
- [ ] Navigation between pages works
- [ ] Consistent styling throughout

---

## Phase 4: Agentic Changes Flow
**Goal:** Style the AI amendable changes carousel

### Files to Update:

1. **packages/frontend/src/components/ActionableChanges.tsx**
   - Change cards: Square, beige borders
   - Accept/Reject buttons: Square, green/red flat colors
   - Before/After diff: Beige background sections
   - Rationale: Cream background, navy text
   - Risk flags: Square badges (LOW/MED/HIGH)
   - Navigation: Same as CriterionCarousel (square buttons)

2. **Integration in QuickAssess.tsx**
   - Add ActionableChanges carousel after main assessment
   - Square "Review Changes" button
   - Maintain sequential flow logic

### Key Changes:
- Change cards: Clean diff display with square containers
- Accept button: `background: #22c55e`, square
- Reject button: `background: #ef4444`, square
- Risk indicators: Square badges with flat colors
- Navigation: Consistent with criterion carousel

### Testing Checkpoint:
- [ ] Changes classified correctly (AI-amendable vs human judgement)
- [ ] Accept/Reject buttons functional
- [ ] Changes apply correctly to documents
- [ ] Carousel navigation works
- [ ] Visual consistency with main carousel

---

## Phase 5: Marketing & Landing Pages
**Goal:** Implement the exact design provided by user

### Files to Update:

1. **packages/frontend/src/pages/Landing.tsx**
   - Implement hero section: Navy background, cream text, gold underlines
   - Problem section: Beige background
   - Solution section: Cream background
   - Features grid: Square cards with beige borders
   - CTA section: Navy background with gold button
   - Footer: Navy with cream text
   - Use exact HTML/CSS structure from user specification

2. **packages/frontend/src/pages/Problem.tsx** (if exists)
   - Stats display: Large numbers, gold accents
   - Pain points list: Clean, minimal
   - Beige background sections

3. **packages/frontend/src/pages/System.tsx** (if exists)
   - Architecture diagram: Square components
   - Feature list: Clean, generous spacing
   - Code examples: Beige background blocks

4. **packages/frontend/src/pages/Approach.tsx** (if exists)
   - Methodology steps: Numbered, square containers
   - Process flow: Clean, minimal

5. **packages/frontend/src/pages/Security.tsx** (if exists)
   - Security features: Square icon cards
   - Compliance badges: Square, flat

### Key Changes:
- Hero: Large headline (DM Sans 200), generous padding
- Sections: Alternating cream/beige backgrounds
- Feature cards: `border: 2px solid var(--beige)`, no shadow
- CTAs: Navy buttons with gold hover
- Typography: Strict adherence to DM Sans/Inter hierarchy
- Whitespace: Generous padding (48px-96px sections)

### Testing Checkpoint:
- [ ] Landing page matches user specification exactly
- [ ] All sections render correctly
- [ ] Navigation between marketing pages works
- [ ] CTAs link to correct pages
- [ ] Responsive layout works
- [ ] No rounded corners
- [ ] No bold text

---

## Phase 6: Shared Components & Forms
**Goal:** Update all reusable components for consistency

### Files to Update:

1. **packages/frontend/src/components/forms/** (all form components)
   - Input fields: Square, navy border, cream background
   - Labels: Navy text, font-weight 400
   - Select dropdowns: Square, navy border
   - Checkboxes: Square (not rounded)
   - Radio buttons: Square (yes, square radio buttons)
   - Validation errors: Red text, no icons

2. **packages/frontend/src/components/Button.tsx** (if exists)
   - Consolidate all button styles
   - `.btn-primary`: Navy background, cream text
   - `.btn-secondary`: Cream background, navy border
   - `.btn-ghost`: Transparent, cream text
   - `.btn-danger`: Red background, cream text
   - All square, no hover shadow

3. **packages/frontend/src/components/Card.tsx** (if exists)
   - Square container
   - Beige border, no shadow
   - Cream background
   - Generous padding

4. **packages/frontend/src/components/Modal.tsx** (if exists)
   - Square modal container
   - Navy header, cream body
   - Square close button
   - No rounded corners on overlay

5. **packages/frontend/src/components/Disclaimer.tsx**
   - Beige background
   - Navy text
   - Square container
   - Generous padding

### Key Changes:
- All inputs: `border-radius: 0`, `border: 2px solid var(--navy)`
- Focus states: Gold border (not blue ring)
- Disabled states: Muted color, no opacity change
- All buttons: Consistent sizing, square
- Modals: Square, clean, minimal

### Testing Checkpoint:
- [ ] Forms submit correctly
- [ ] Validation works
- [ ] All buttons functional
- [ ] Modals open/close correctly
- [ ] Consistent styling across all forms
- [ ] Accessibility maintained

---

## Phase 7: Documentation & Branding Assets
**Goal:** Update all outbound materials

### Files to Update:

1. **docs/outbound/attlee-platform-overview.html**
   - Apply design system styling
   - Match landing page aesthetic
   - Square elements, generous whitespace

2. **README.md**
   - Update screenshots (if any)
   - Update branding references
   - Ensure consistency with platform overview

3. **packages/frontend/public/index.html**
   - Update title, meta descriptions
   - Add favicon (square Attlee logo)
   - Link design system fonts (DM Sans, Inter)

### Key Changes:
- All documentation uses Attlee branding
- Screenshots show new design
- Consistent language/terminology

### Testing Checkpoint:
- [ ] HTML documents render correctly
- [ ] Fonts load properly
- [ ] Favicon displays
- [ ] Meta tags accurate

---

## Phase 8: Final Verification & Testing
**Goal:** Comprehensive end-to-end testing

### Test Scenarios:

1. **Assessment Flow**
   - [ ] Upload documents → Run assessment → View carousel → Save to client
   - [ ] All 55+ criteria display correctly
   - [ ] Evidence, reasoning, references accurate
   - [ ] Accept/Reject AI changes
   - [ ] Download reports

2. **Client Management**
   - [ ] Create client → Create pack → Upload docs → Run assessment
   - [ ] View client detail → View pack detail
   - [ ] Edit/delete clients and packs

3. **Visual Consistency**
   - [ ] No rounded corners anywhere
   - [ ] No bold text (except font-weight 400 where specified)
   - [ ] All buttons square
   - [ ] Color palette consistent (Navy/Cream/Beige/Gold)
   - [ ] Typography hierarchy correct (DM Sans/Inter)
   - [ ] Whitespace generous and consistent

4. **Functionality Verification**
   - [ ] All existing functionality works
   - [ ] No logic broken
   - [ ] Database operations successful
   - [ ] API calls work
   - [ ] Error handling intact

5. **Browser Testing**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge
   - [ ] Mobile responsive

---

## Implementation Strategy

### Approach:
1. **Work in phases** - Complete one phase before moving to next
2. **Test after each file update** - Ensure no logic breaks
3. **Commit frequently** - Small, focused commits
4. **Visual verification** - Check browser after each component update

### Commit Messages:
- "Phase 1: Update application shell and navigation"
- "Phase 2: Redesign QuickAssess page"
- "Phase 2: Redesign CriterionCarousel component"
- "Phase 3: Update client management pages"
- etc.

### Risk Mitigation:
- **DO NOT CHANGE**: Any TypeScript interfaces, API calls, data structures, logic
- **ONLY CHANGE**: CSS classes, styling, visual presentation
- **PRESERVE**: All functionality, workflows, database operations

### Rollback Plan:
- Each phase committed separately
- Can revert individual components if issues arise
- Full test before moving to next phase

---

## Success Criteria

✅ **Visual:**
- No rounded corners anywhere in the application
- No bold text (max font-weight 400)
- Consistent Navy/Cream/Beige/Gold palette
- DM Sans for headlines, Inter for body text
- Generous whitespace throughout
- Flat, minimal, authoritative aesthetic

✅ **Functional:**
- All existing workflows work unchanged
- Two-phase assessment engine intact
- Database operations successful
- Carousel navigation functional
- Accept/Reject changes work
- Save to Client creates client + pack

✅ **Technical:**
- No TypeScript errors
- No console errors
- All imports resolved
- Clean build
- Fast page loads

---

## Estimated Scope

**Total Components to Update:** ~20-25 files
**Estimated Effort per Phase:**
- Phase 1: 1-2 components
- Phase 2: 4-5 components (includes 43KB carousel)
- Phase 3: 4-5 components
- Phase 4: 2 components
- Phase 5: 5 components
- Phase 6: 5-8 components
- Phase 7: 3 files
- Phase 8: Testing only

**Total:** Complete redesign maintaining 100% functionality

---

## Next Step

**Begin Phase 1:** Update App.tsx and navigation with AttleeLogo and square design system.
