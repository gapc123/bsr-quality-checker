# Test Pack 007 - "Skyline Apartments" (POOR QUALITY)

**Type**: Poor (would fail Gateway 2)
**Project**: Skyline Apartments - incomplete submission
**Height**: 24m (8 storeys)
**Location**: Manchester
**Gateway 2 Outcome**: Would be rejected - significant gaps

## Project Details

- **Building Use**: Residential (C3) - 85 apartments
- **Height**: 24m (8 storeys above ground, no basement)
- **Storey Count**: 8
- **Construction**: Steel frame with ACM cladding ⚠️
- **Fire Strategy**: Incomplete
- **Means of Escape**: Poorly defined
- **Compartmentation**: No fire resistance periods stated
- **External Walls**: Combustible materials ⚠️

## Submission Quality

This is a **poor-quality, incomplete submission** that should FAIL Gateway 2:

❌ Fire strategy present but incomplete (only 12 pages)
❌ Means of escape mentioned but NO travel distances stated
❌ Compartmentation mentioned but NO fire resistance periods
❌ External walls are combustible ACM (banned for >18m buildings)
❌ NO sprinklers specified (required for >11m residential)
❌ Structural calculations missing fire resistance section
❌ Principal Designer identified but NO competence evidence
❌ Building height inconsistent (24m vs 22m in different documents)
❌ Many required documents missing
❌ No London-specific documents (but project NOT in London anyway)

## Critical Safety Issues

1. **Combustible cladding** - ACM on 24m building (banned since Grenfell)
2. **No sprinklers** - Required for >11m residential
3. **No fire resistance periods** - Cannot assess compartmentation
4. **Travel distances not stated** - Cannot verify means of escape
5. **Height mismatch** - 24m vs 22m (which is correct?)

## Why This Is a "Poor" Pack

This pack is designed to trigger FAILURES on high-severity rules:

- **SM-002** (Means of escape): Should FAIL - mentioned but not "clearly defined"
- **SM-003** (Compartmentation): Should FAIL - no fire resistance periods
- **SM-004** (External walls): Should FAIL - combustible materials on HRB
- **SM-005** (Sprinklers): Should FAIL - not specified for >11m building
- **SM-009** (Structural fire resistance): Should FAIL - missing from structural calcs
- **SM-010** (Principal Designer): Should FAIL - no competence evidence
- **SM-020** (Height consistency): Should FAIL - contradictory heights
- **SM-007** (Second staircase): Should FAIL - only 1 staircase for 24m building

## Ground Truth Expectations

This pack should achieve:
- **Overall**: ~25/55 rules FAIL
- **High-severity failures**: 8+ critical failures
- **System should flag**: Combustible cladding, no sprinklers, missing fire resistance

Expected system accuracy on this pack: **This pack tests if the system can catch dangerous failures**

If the system PASSES these rules, it's producing FALSE POSITIVES (dangerous).
