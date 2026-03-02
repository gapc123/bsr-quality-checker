# Rules to Regulatory Corpus Mapping Analysis

**Date:** 2026-02-28
**Analyst:** AI Assessment
**Purpose:** Map all 55 deterministic rules to regulatory corpus documents to identify coverage gaps

---

## Executive Summary

This analysis examines the 55 deterministic rules implemented in the BSR Quality Checker and maps them to the 15-document regulatory corpus. Key findings:

- **55 rules total** covering 8 categories
- **15 corpus documents** available for citation
- **Coverage analysis** identifies which rules have proper regulatory backing
- **Gap analysis** identifies rules citing documents NOT in the corpus

### Key Statistics

| Category | Rule Count | Severity Distribution |
|----------|------------|----------------------|
| FIRE_SAFETY | 20 | High: 11, Medium: 8, Low: 1 |
| PACK_COMPLETENESS | 7 | High: 2, Medium: 4, Low: 1 |
| HRB_DUTIES | 7 | High: 2, Medium: 5, Low: 0 |
| GOLDEN_THREAD | 5 | High: 1, Medium: 1, Low: 3 |
| CONSISTENCY | 4 | High: 2, Medium: 1, Low: 1 |
| VENTILATION | 3 | Medium: 3, Low: 0 |
| TRACEABILITY | 4 | Medium: 2, Low: 2 |
| LONDON_SPECIFIC | 2 | High: 1, Medium: 1 |

---

## Corpus Document Inventory

The following 15 documents are available in the regulatory corpus (`knowledge/catalogue.json`):

1. **adf1_ventilation_dwellings_2021** - Approved Document F Vol 1: Dwellings
2. **adf2_ventilation_non_dwellings_2021** - Approved Document F Vol 2: Non-Dwellings
3. **adb2_fire_safety_non_dwellings_2019_amended** - Approved Document B Vol 2 (with 2020-2029 amendments)
4. **clc_golden_thread_guidance_2024** - CLC Golden Thread Guidance
5. **clc_gateway2_guidance_suite** - CLC Gateway 2 Guidance Suite
6. **bsr_charging_scheme_2025_26** - BSR Charging Scheme 2025-2026
7. **uksi_20102214_en** - Building Regulations 2010
8. **uksi_20230909_en** - Building (Higher-Risk Buildings) Regulations 2023
9. **applying_building_control_approval** - BSR: Applying for Building Control Approval
10. **building_control_approval_hrb** - BSR: Building Control Approval for HRBs
11. **building_regs_duties_guide** - BSR: Building Regulations and Duties Guide
12. **keeping_information_golden_thread** - BSR: Golden Thread Information Guidance
13. **manage_building_control_application_hrb** - BSR: Manage Building Control Application
14. **gla_fire_statements_d12b_draft** - GLA Fire Statements D12B Guidance (DRAFT)
15. **gla_fire_safety_lpg_2022** - London Plan Guidance: Fire Safety (2022)

---

## Detailed Rule-by-Rule Mapping

### FIRE_SAFETY Rules (20 total)

#### SM-001: Fire Strategy Report Present and Complete
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Safety Act 2022 / Building Regulations 2010"
  - Section: "Regulation 38 & Approved Document B"
  - Requirement: "A fire safety strategy must be provided..."
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP - All references available in corpus
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended", "clc_gateway2_guidance_suite", "uksi_20230909_en"]`

---

#### SM-002: Means of Escape Clearly Defined
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Regulations 2010, Approved Document B Volume 1 & 2"
  - Section: "Section B1 - Means of Warning and Escape"
  - Requirement: "Building design must provide means of escape..."
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`
- **Note:** Code references "Volume 1 & 2" but corpus only has Volume 2. Volume 1 (dwellings) is NOT in corpus.

---

#### SM-003: Compartmentation Strategy with Fire Resistance Periods
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Regulations 2010, Approved Document B Volume 2"
  - Section: "Section B3 - Internal Fire Spread (Structure)"
  - Requirement: "Buildings must be designed to prevent internal fire spread using compartmentation..."
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-004: External Wall System Fire Performance Specified
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Regulations 2010, Regulation 7 & Approved Document B"
  - Section: "Regulation 7 (Ban on combustible materials) & Section B4 - External Fire Spread"
  - Requirement: "For buildings over 18m with residential use, external wall materials must be Class A1 or A2-s1,d0..."
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
  - **uksi_20102214_en** ✅ (in corpus - contains Regulation 7)
- **Gap status:** NO GAP
- **Success matrix reference sources:** Not explicitly stated in success_matrix.json

---

#### SM-005: Sprinkler Provision Addressed Appropriately
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
  - Source: "Building Regulations 2010, Approved Document B"
  - Section: "Parts B1-B5"
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-006: Firefighting Access Provisions for HRBs
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-007: Second Staircase Provision for Tall Residential
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
  - **gla_fire_safety_lpg_2022** ✅ (in corpus - London specific guidance on second staircases)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended", "gla_fire_safety_lpg_2022"]`

---

#### SM-009: Structural Fire Resistance Aligned with Fire Strategy
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-017: Fire Detection and Alarm System Specified
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-018: Smoke Control Strategy Defined
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-019: Evacuation Strategy Type Explicitly Stated
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
  - **gla_fire_safety_lpg_2022** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended", "gla_fire_safety_lpg_2022"]`

---

#### SM-031: Fire Door Ratings Specified
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-032: Emergency Lighting Specification
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-033: Fire Stopping and Penetration Seals
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-034: Resident Communication of Evacuation Strategy
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-035: Wayfinding and Escape Signage
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-036: Dry or Wet Riser Provision
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-037: Balcony and Terrace Fire Safety
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-038: Basement Fire Safety Strategy
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-039: Car Park Fire Safety
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-040: Refuse Store Fire Safety
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (FIRE_SAFETY)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP

---

### PACK_COMPLETENESS Rules (7 total)

#### SM-001: Fire Strategy Report Present and Complete
(See FIRE_SAFETY section above - categorized as PACK_COMPLETENESS in code)

---

#### SM-008: Structural Design Information Present
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (PACK_COMPLETENESS)
  - Source: "Building Safety Act 2022, The Building (Higher-Risk Buildings) (England) Regulations 2023"
  - Section: "Regulation 9 & Schedule 1"
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_gateway2_guidance_suite", "uksi_20230909_en"]`
- **Note:** Should also reference **Approved Document A (Structure)** - NOT in corpus ❌

---

#### SM-014: Design and Access Statement Present
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (PACK_COMPLETENESS)
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_gateway2_guidance_suite"]`

---

#### SM-015: MEP Systems Specification Present
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (PACK_COMPLETENESS)
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_gateway2_guidance_suite"]`

---

#### SM-022: Fire Risk Assessment Included
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (PACK_COMPLETENESS)
- **Required corpus documents:**
  - **adb2_fire_safety_non_dwellings_2019_amended** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adb2_fire_safety_non_dwellings_2019_amended"]`

---

#### SM-029: Building Description Clear and Complete
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (PACK_COMPLETENESS)
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_gateway2_guidance_suite"]`

---

#### SM-030: Site Location and Context Documented
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (PACK_COMPLETENESS)
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_gateway2_guidance_suite"]`

---

### HRB_DUTIES Rules (7 total)

#### SM-010: Principal Designer Identified with Competence Evidence
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Safety Act 2022"
  - Section: "Section 76 - Duties relating to Principal Designer"
  - Requirement: "The client must appoint a Principal Designer..."
- **Required corpus documents:**
  - **building_regs_duties_guide** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["building_regs_duties_guide", "uksi_20230909_en", "clc_gateway2_guidance_suite"]`
- **Note:** Should also reference **Building Safety Act 2022 primary legislation** - NOT in corpus ❌

---

#### SM-011: Principal Contractor Identified with Competence Evidence
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Safety Act 2022"
  - Section: "Section 77 - Duties relating to Principal Contractor"
  - Requirement: "The client must appoint a Principal Contractor..."
- **Required corpus documents:**
  - **building_regs_duties_guide** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["building_regs_duties_guide", "uksi_20230909_en", "clc_gateway2_guidance_suite"]`
- **Note:** Should also reference **Building Safety Act 2022 primary legislation** - NOT in corpus ❌

---

#### SM-013: Change Control Process Defined
- **Severity:** Medium
- **Current regulatory_ref in code:**
  - Source: "Building Safety Act 2022 / The Building (Higher-Risk Buildings) Regulations 2023"
  - Section: "Sections 82-85 & Regulation 19 - Change Control"
  - Requirement: "Major changes to higher-risk building work require notification to BSR..."
- **Required corpus documents:**
  - **uksi_20230909_en** ✅ (in corpus)
  - **building_control_approval_hrb** ✅ (in corpus)
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["uksi_20230909_en", "building_control_approval_hrb", "clc_gateway2_guidance_suite"]`
- **Note:** Should also reference **Building Safety Act 2022 primary legislation** - NOT in corpus ❌

---

#### SM-028: Construction Phase Plan Approach Outlined
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (HRB_DUTIES)
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_gateway2_guidance_suite", "uksi_20230909_en"]`

---

#### SM-041: Competent Person Scheme References
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (HRB_DUTIES)
- **Required corpus documents:**
  - **building_regs_duties_guide** ✅ (in corpus)
  - **uksi_20102214_en** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-042: Building Safety Manager Considerations
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (HRB_DUTIES)
- **Required corpus documents:**
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP
- **Note:** Should reference **Building Safety (Leaseholder Protections) Regulations** - NOT in corpus ❌

---

#### SM-043: Partial Occupation Strategy
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (HRB_DUTIES)
- **Required corpus documents:**
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-044: Specialist Subcontractor Competence Approach
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (HRB_DUTIES)
- **Required corpus documents:**
  - **building_regs_duties_guide** ✅ (in corpus)
- **Gap status:** NO GAP

---

### GOLDEN_THREAD Rules (5 total)

#### SM-012: Golden Thread Information Strategy Defined
- **Severity:** High
- **Current regulatory_ref in code:**
  - Source: "Building Safety Act 2022 / The Building (Higher-Risk Buildings) Regulations 2023"
  - Section: "Section 88 & Regulations 25-28 - Golden Thread"
  - Requirement: "Dutyholders must establish, maintain and keep under review golden thread information..."
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
  - **keeping_information_golden_thread** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_golden_thread_guidance_2024", "keeping_information_golden_thread", "uksi_20230909_en"]`

---

#### SM-027: Document Version Control Evident
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (GOLDEN_THREAD)
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_golden_thread_guidance_2024"]`

---

#### SM-045: As-Built Documentation Commitment
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (GOLDEN_THREAD)
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
  - **keeping_information_golden_thread** ✅ (in corpus)
  - **uksi_20230909_en** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-046: BIM Strategy for Golden Thread
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (GOLDEN_THREAD)
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-047: Drawing Revision Control System
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (GOLDEN_THREAD)
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
- **Gap status:** NO GAP

---

### VENTILATION Rules (3 total)

#### SM-016: Ventilation Strategy Defined per ADF
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (VENTILATION)
  - Source: "Building Regulations 2010, Approved Document F"
  - Section: "Ventilation"
- **Required corpus documents:**
  - **adf1_ventilation_dwellings_2021** ✅ (in corpus)
  - **adf2_ventilation_non_dwellings_2021** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["adf1_ventilation_dwellings_2021", "adf2_ventilation_non_dwellings_2021"]`

---

#### SM-048: Overheating Risk Assessment
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (VENTILATION)
- **Required corpus documents:**
  - **adf1_ventilation_dwellings_2021** ✅ (in corpus - covers overheating in section on purge ventilation)
  - **adf2_ventilation_non_dwellings_2021** ✅ (in corpus)
- **Gap status:** NO GAP
- **Note:** Should also reference **Approved Document O (Overheating)** - NOT in corpus ❌

---

#### SM-049: Common Area Ventilation
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (VENTILATION)
- **Required corpus documents:**
  - **adf1_ventilation_dwellings_2021** ✅ (in corpus)
  - **adf2_ventilation_non_dwellings_2021** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-050: Kitchen Extract and Makeup Air
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (VENTILATION)
- **Required corpus documents:**
  - **adf1_ventilation_dwellings_2021** ✅ (in corpus)
  - **adf2_ventilation_non_dwellings_2021** ✅ (in corpus)
- **Gap status:** NO GAP

---

### CONSISTENCY Rules (4 total)

#### SM-020: Building Height Consistent Across Documents
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (CONSISTENCY)
  - Source: "Building Safety Act 2022"
  - Section: "Competence requirements"
- **Required corpus documents:** None specified (internal consistency check)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `[]` (empty - consistency check)

---

#### SM-021: Storey Count Consistent Across Documents
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (CONSISTENCY)
- **Required corpus documents:** None specified (internal consistency check)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `[]` (empty - consistency check)

---

#### SM-051: Building Use Consistently Described
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (CONSISTENCY)
- **Required corpus documents:** None specified (internal consistency check)
- **Gap status:** NO GAP

---

#### SM-052: Site Address Consistently Referenced
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (CONSISTENCY)
- **Required corpus documents:** None specified (internal consistency check)
- **Gap status:** NO GAP

---

#### SM-053: Project Name Consistently Used
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (CONSISTENCY)
- **Required corpus documents:** None specified (internal consistency check)
- **Gap status:** NO GAP

---

### LONDON_SPECIFIC Rules (2 total)

#### SM-023: London Fire Statement Present
- **Severity:** High
- **Current regulatory_ref in code:** Uses category default (LONDON_SPECIFIC)
  - Source: "London Plan 2021 / London Fire Brigade Guidance"
  - Section: "Policy D12, LFB Guidance Note 29"
- **Required corpus documents:**
  - **gla_fire_safety_lpg_2022** ✅ (in corpus)
  - **gla_fire_statements_d12b_draft** ✅ (in corpus - DRAFT version)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["gla_fire_safety_lpg_2022", "gla_fire_statements_d12b_draft"]`
- **Note:** Should reference **London Plan 2021** directly - NOT in corpus ❌. Also references **LFB Guidance Note 29** - NOT in corpus ❌

---

#### SM-024: PEEP Considerations Addressed
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (LONDON_SPECIFIC)
- **Required corpus documents:**
  - **gla_fire_safety_lpg_2022** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["gla_fire_safety_lpg_2022"]`

---

### TRACEABILITY Rules (4 total)

#### SM-025: Documents Cross-Reference Each Other
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (TRACEABILITY)
  - Source: "Building Safety Act 2022, The Building (Higher-Risk Buildings) Regulations 2023"
  - Section: "Golden Thread Requirements"
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["clc_golden_thread_guidance_2024"]`

---

#### SM-026: Regulatory Compliance Mapping Present
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (TRACEABILITY)
- **Required corpus documents:**
  - **uksi_20102214_en** ✅ (in corpus)
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP
- **Success matrix reference sources:** `["uksi_20102214_en", "clc_gateway2_guidance_suite"]`

---

#### SM-054: Design Team Identified
- **Severity:** Low
- **Current regulatory_ref in code:** Uses category default (TRACEABILITY)
- **Required corpus documents:**
  - **clc_gateway2_guidance_suite** ✅ (in corpus)
- **Gap status:** NO GAP

---

#### SM-055: Documents Dated Within Last 12 Months
- **Severity:** Medium
- **Current regulatory_ref in code:** Uses category default (TRACEABILITY)
- **Required corpus documents:**
  - **clc_golden_thread_guidance_2024** ✅ (in corpus)
- **Gap status:** NO GAP

---

## Summary Matrix

| Rule ID | Rule Name | Category | Severity | Corpus Docs Available | Gap? | Missing Docs |
|---------|-----------|----------|----------|----------------------|------|--------------|
| SM-001 | Fire Strategy Report | PACK_COMPLETENESS | high | ✅ All | NO | - |
| SM-002 | Means of Escape | FIRE_SAFETY | high | ✅ Mostly | MINOR | ADB Vol 1 (Dwellings) |
| SM-003 | Compartmentation | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-004 | External Wall Fire Performance | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-005 | Sprinkler Provision | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-006 | Firefighting Access | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-007 | Second Staircase | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-008 | Structural Design Info | PACK_COMPLETENESS | high | ✅ Mostly | MINOR | Approved Doc A (Structure) |
| SM-009 | Structural Fire Resistance | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-010 | Principal Designer | HRB_DUTIES | high | ✅ Mostly | MINOR | BSA 2022 primary legislation |
| SM-011 | Principal Contractor | HRB_DUTIES | high | ✅ Mostly | MINOR | BSA 2022 primary legislation |
| SM-012 | Golden Thread Strategy | GOLDEN_THREAD | high | ✅ All | NO | - |
| SM-013 | Change Control | HRB_DUTIES | medium | ✅ Mostly | MINOR | BSA 2022 primary legislation |
| SM-014 | Design & Access Statement | PACK_COMPLETENESS | medium | ✅ All | NO | - |
| SM-015 | MEP Systems Spec | PACK_COMPLETENESS | medium | ✅ All | NO | - |
| SM-016 | Ventilation Strategy | VENTILATION | medium | ✅ All | NO | - |
| SM-017 | Fire Detection System | FIRE_SAFETY | medium | ✅ All | NO | - |
| SM-018 | Smoke Control | FIRE_SAFETY | medium | ✅ All | NO | - |
| SM-019 | Evacuation Strategy Type | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-020 | Height Consistency | CONSISTENCY | high | N/A | NO | - (Internal check) |
| SM-021 | Storey Count Consistency | CONSISTENCY | high | N/A | NO | - (Internal check) |
| SM-022 | Fire Risk Assessment | PACK_COMPLETENESS | medium | ✅ All | NO | - |
| SM-023 | London Fire Statement | LONDON_SPECIFIC | high | ✅ Mostly | MINOR | London Plan 2021, LFB GN29 |
| SM-024 | PEEP Considerations | LONDON_SPECIFIC | medium | ✅ All | NO | - |
| SM-025 | Cross-References | TRACEABILITY | low | ✅ All | NO | - |
| SM-026 | Compliance Mapping | TRACEABILITY | medium | ✅ All | NO | - |
| SM-027 | Version Control | GOLDEN_THREAD | low | ✅ All | NO | - |
| SM-028 | Construction Phase Plan | HRB_DUTIES | medium | ✅ All | NO | - |
| SM-029 | Building Description | PACK_COMPLETENESS | medium | ✅ All | NO | - |
| SM-030 | Site Location | PACK_COMPLETENESS | low | ✅ All | NO | - |
| SM-031 | Fire Door Ratings | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-032 | Emergency Lighting | FIRE_SAFETY | medium | ✅ All | NO | - |
| SM-033 | Fire Stopping | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-034 | Resident Communication | FIRE_SAFETY | medium | ✅ All | NO | - |
| SM-035 | Wayfinding Signage | FIRE_SAFETY | low | ✅ All | NO | - |
| SM-036 | Dry/Wet Riser | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-037 | Balcony Fire Safety | FIRE_SAFETY | medium | ✅ All | NO | - |
| SM-038 | Basement Fire Safety | FIRE_SAFETY | high | ✅ All | NO | - |
| SM-039 | Car Park Fire Safety | FIRE_SAFETY | medium | ✅ All | NO | - |
| SM-040 | Refuse Store Fire Safety | FIRE_SAFETY | low | ✅ All | NO | - |
| SM-041 | Competent Person Schemes | HRB_DUTIES | medium | ✅ All | NO | - |
| SM-042 | Building Safety Manager | HRB_DUTIES | medium | ✅ Mostly | MINOR | Leaseholder Protections Regs |
| SM-043 | Partial Occupation | HRB_DUTIES | medium | ✅ All | NO | - |
| SM-044 | Subcontractor Competence | HRB_DUTIES | low | ✅ All | NO | - |
| SM-045 | As-Built Documentation | GOLDEN_THREAD | medium | ✅ All | NO | - |
| SM-046 | BIM Strategy | GOLDEN_THREAD | low | ✅ All | NO | - |
| SM-047 | Drawing Revision Control | GOLDEN_THREAD | low | ✅ All | NO | - |
| SM-048 | Overheating Risk | VENTILATION | medium | ✅ Mostly | MINOR | Approved Doc O (Overheating) |
| SM-049 | Common Area Ventilation | VENTILATION | medium | ✅ All | NO | - |
| SM-050 | Kitchen Extract | VENTILATION | low | ✅ All | NO | - |
| SM-051 | Building Use Consistency | CONSISTENCY | medium | N/A | NO | - (Internal check) |
| SM-052 | Site Address Consistency | CONSISTENCY | low | N/A | NO | - (Internal check) |
| SM-053 | Project Name Consistency | CONSISTENCY | low | N/A | NO | - (Internal check) |
| SM-054 | Design Team Identified | TRACEABILITY | low | ✅ All | NO | - |
| SM-055 | Documents Dated | TRACEABILITY | medium | ✅ All | NO | - |

---

## Gap Analysis

### Critical Gaps (Documents NOT in Corpus but Referenced by Rules)

1. **Approved Document B Volume 1 (Dwellings)** - Referenced by SM-002
   - **Impact:** Medium
   - **Affected rules:** SM-002 (Means of Escape)
   - **Recommendation:** Add ADB Vol 1 to corpus OR update SM-002 to reference Vol 2 only

2. **Approved Document A (Structure)** - Referenced by SM-008
   - **Impact:** Medium
   - **Affected rules:** SM-008 (Structural Design)
   - **Recommendation:** Add ADA to corpus for structural requirements

3. **Building Safety Act 2022 (Primary Legislation)** - Referenced by SM-010, SM-011, SM-013
   - **Impact:** High
   - **Affected rules:** SM-010 (Principal Designer), SM-011 (Principal Contractor), SM-013 (Change Control)
   - **Recommendation:** Add BSA 2022 sections 75-91 to corpus

4. **Approved Document O (Overheating)** - Referenced by SM-048
   - **Impact:** Low-Medium
   - **Affected rules:** SM-048 (Overheating Risk Assessment)
   - **Recommendation:** Add ADO to corpus

5. **London Plan 2021** - Referenced by SM-023
   - **Impact:** Medium (London projects only)
   - **Affected rules:** SM-023 (London Fire Statement)
   - **Recommendation:** Add London Plan Policy D12 to corpus

6. **London Fire Brigade Guidance Note 29** - Referenced by SM-023
   - **Impact:** Low-Medium (London projects only)
   - **Affected rules:** SM-023 (London Fire Statement)
   - **Recommendation:** Add LFB GN29 to corpus OR update reference

7. **Building Safety (Leaseholder Protections) Regulations** - Referenced by SM-042
   - **Impact:** Low
   - **Affected rules:** SM-042 (Building Safety Manager)
   - **Recommendation:** Add to corpus OR update SM-042 reference

---

## Recommendations

### High Priority

1. **Add Building Safety Act 2022 Primary Legislation** (Sections 75-91) to corpus
   - Affects 3 HRB_DUTIES rules (SM-010, SM-011, SM-013)
   - Critical for dutyholder competence requirements

2. **Add Approved Document B Volume 1 (Dwellings)** to corpus
   - Affects SM-002 (Means of Escape)
   - Essential for residential fire safety

3. **Add Approved Document A (Structure)** to corpus
   - Affects SM-008 (Structural Design)
   - Important for structural compliance checks

### Medium Priority

4. **Add London Plan 2021 Policy D12** to corpus
   - Affects SM-023 (London Fire Statement)
   - Essential for London-specific projects

5. **Add Approved Document O (Overheating)** to corpus
   - Affects SM-048 (Overheating Risk Assessment)
   - Increasingly important with climate change concerns

### Low Priority

6. **Add London Fire Brigade Guidance Note 29** to corpus
   - Supplementary to Policy D12
   - London-specific only

7. **Add Building Safety (Leaseholder Protections) Regulations** to corpus
   - Affects SM-042 (Building Safety Manager)
   - Relevant for occupation phase transition

---

## Conclusion

**Overall corpus coverage: 87% (48/55 rules fully covered by corpus documents)**

The regulatory corpus provides strong coverage for the majority of rules, particularly in:
- ✅ Fire safety (20/20 rules - 100% coverage)
- ✅ Golden Thread (5/5 rules - 100% coverage)
- ✅ Ventilation (3/3 rules - 100% with minor gaps)
- ✅ Gateway 2 process guidance (comprehensive)

**Gaps exist primarily in:**
- ⚠️ Primary legislation (Building Safety Act 2022)
- ⚠️ Structural regulations (Approved Document A)
- ⚠️ Residential-specific guidance (ADB Vol 1)
- ⚠️ London-specific planning policy (London Plan)
- ⚠️ Overheating regulations (Approved Document O)

The current corpus is **fit for purpose** for initial Gateway 2 assessment but should be enhanced with the recommended documents for comprehensive regulatory coverage.

---

**Document generated:** 2026-02-28
**Next steps:** Review gaps, prioritize corpus additions, update rule references
