# Report Generator Specification

This document describes how to use the document metadata labels and user intake responses to generate tailored reports for end users.

## Overview

The report generator takes two inputs:
1. **User intake responses** from `intake_flow.json` questions
2. **Document catalogue** from `catalogue.json` with per-document metadata

It produces a **clear, actionable report** that:
- Summarizes what applies to the user's specific situation
- Prioritizes actions by impact
- Highlights compliance considerations
- Identifies information gaps

---

## Report Structure

### 1. Executive Summary
**Purpose:** Quick orientation for the reader

**Content:**
- One paragraph summary of user's situation based on intake
- Key determination: Is this a Higher-Risk Building (HRB)?
- Primary regulator: BSR or Local Authority Building Control?
- Current stage and next milestone

**Example:**
> You are a **Housing Association** working on a **new-build residential development** in **Tower Hamlets, London** at **24m height (8 storeys)**. This is a **Higher-Risk Building** subject to BSR building control. You are currently at **Gateway 2 preparation** stage. Your next milestone is submitting the building control approval application to BSR.

---

### 2. What Applies to You

**Purpose:** Filter the corpus to documents relevant to this user

**Logic:**
```
FOR each document in catalogue:
  relevance_score = 0

  # Geography match
  IF user.location == "london" AND doc.london_specific:
    relevance_score += 3
  IF user.location in doc.geography_scope:
    relevance_score += 2
  IF user.location NOT IN ["england", "london", "england_not_london"]:
    IF "England" in doc.geography_scope:
      relevance_score -= 5  # Warn: may not apply

  # Role match
  IF user.role in doc.regulated_actors:
    relevance_score += 3

  # Building type match
  IF user.building_height triggers HRB:
    IF "higher_risk_buildings" in doc.topic_tags:
      relevance_score += 4

  # Stage match
  IF user.stage relates to doc.topic_tags:
    relevance_score += 2

  # Topic match
  IF user.specific_topic in doc.topic_tags:
    relevance_score += 3

SORT documents by relevance_score DESC
RETURN top 10 with score > 3
```

**Output format:**
| Document | Relevance | Why It Applies |
|----------|-----------|----------------|
| CLC Gateway 2 Guidance | High | HRB at Gateway 2 stage |
| BSR Charging Scheme 2025-26 | High | Fees for Gateway 2 submission |
| Golden Thread Guidance | Medium | Required for all HRBs |

---

### 3. Your Obligations

**Purpose:** Extract and present must/should/may obligations relevant to user's role

**Logic:**
```
FOR each relevant_document:
  FOR each obligation in doc.obligations.must:
    IF obligation applies to user.role:
      ADD to must_obligations
  FOR each obligation in doc.obligations.should:
    IF obligation applies to user.role:
      ADD to should_obligations
```

**Output format:**

#### MUST (Legal Requirements)
- [ ] Submit building control approval application to BSR before starting HRB work *(Building Safety Act 2022, s.32)*
- [ ] Appoint Principal Designer and Principal Contractor before Gateway 2 *(HRB Procedures Regulations 2023, reg.9)*
- [ ] Pay £189 application fee with Gateway 2 submission *(BSR Charging Scheme, Schedule 1)*

#### SHOULD (Best Practice)
- [ ] Engage with BSR early through pre-application advice
- [ ] Ensure fire strategy is peer-reviewed before submission
- [ ] Establish golden thread information system before construction

#### MAY (Optional/Permitted)
- [ ] Request relaxation of building regulations if justified *(£113 fee)*
- [ ] Submit staged application if phased development

---

### 4. Actions to Consider (Priority Order)

**Purpose:** Actionable checklist ordered by impact/urgency

**Ordering criteria:**
1. Legal deadlines (Gateway dates, registration deadlines)
2. Cost implications (fees, penalties)
3. Dependencies (what blocks other work)
4. Complexity (longer lead time items first)

**Output format:**

#### Immediate Actions (This Week)
1. **Confirm HRB status** - Verify building meets 18m/7 storey threshold
2. **Appoint dutyholders** - Principal Designer and Principal Contractor must be appointed

#### Short-Term Actions (This Month)
3. **Prepare competence evidence** - Gather CVs, qualifications, past project evidence
4. **Draft fire strategy** - Must be part of Gateway 2 submission
5. **Set up golden thread system** - Information management for prescribed documents

#### Medium-Term Actions (Before Submission)
6. **Compile prescribed documents** - Per HRB Procedures Regulations Schedule 1
7. **Budget for BSR fees** - £189 + £151/hour for assessment (typically £10k-50k total)
8. **Plan for 12-week determination** - Standard Gateway 2 timeline

---

### 5. Fees and Costs

**Purpose:** Indicative cost information from charging scheme

**Conditional:** Only show if HRB or building control application relevant

**Output format:**

| Activity | Fixed Fee | Hourly Rate | Typical Total |
|----------|-----------|-------------|---------------|
| Gateway 2 Application | £189 | £151/hr | £10,000 - £50,000 |
| Completion Certificate | £227 | £151/hr | £5,000 - £15,000 |
| HRB Registration | £251 | £151/hr | £500 - £2,000 |
| Building Assessment Certificate | £302 | £151/hr | £2,000 - £10,000 |

**Notes:**
- Fees are estimates based on project complexity
- Third party costs (fire service, specialists) charged at cost
- Exemption available for work solely for disabled persons

---

### 6. Risks and Compliance Considerations

**Purpose:** Highlight potential issues and compliance risks

**Logic:**
```
FOR each relevant_document:
  FOR each exception in doc.exceptions:
    IF exception.condition might apply to user:
      ADD to "Check if exception applies"
  FOR each confidence_note in doc.confidence_notes:
    ADD to "Areas of uncertainty"
```

**Output format:**

#### Potential Issues to Address
- **Height measurement**: Ensure measured correctly per HRB definition (top of floor, not roof)
- **Mixed use**: If commercial at ground floor, residential portion must still meet HRB threshold
- **Phased development**: Each phase may need separate Gateway 2 if independently occupied

#### Compliance Risks
- **Unauthorised work**: Starting before Gateway 2 approval is a criminal offence
- **Change control**: Major changes during construction require change control application (£189 + hourly)
- **Golden thread**: Failure to maintain prescribed information is criminal offence

#### Areas of Uncertainty
- *Document X notes ambiguity around [specific issue] - recommend seeking BSR clarification*

---

### 7. London-Specific Considerations

**Purpose:** Highlight London-specific requirements (only if user in London)

**Conditional:** Only show if user.location == "london"

**Content:**
- London Plan policies affecting building design
- GLA referral thresholds
- Mayor's fire safety guidance
- Borough-specific policies if known

---

### 8. Key Documents to Review

**Purpose:** Reading list prioritized by relevance

**Output format:**

#### Essential Reading
1. **CLC Gateway 2 Guidance** - Step-by-step application process
   - *Focus on:* Sections 3, 4, 5 (prescribed documents)
2. **BSR Charging Scheme 2025-26** - Fee structure and payment process
   - *Focus on:* Schedule 1 (Gateway 2), Annex C (payment terms)

#### Recommended Reading
3. **Golden Thread Guidance** - Information management requirements
4. **Approved Document B Vol 2** - Fire safety for buildings other than dwellings

#### Reference (As Needed)
5. **Building Safety Act 2022** - Primary legislation
6. **HRB Procedures Regulations 2023** - Detailed procedural requirements

---

### 9. Information We Still Need

**Purpose:** Prompt user to provide missing information for better recommendations

**Logic:**
```
FOR each unanswered question in intake_flow:
  IF question.strongly_recommended:
    ADD to "Recommended to provide"
  IF question affects filtering significantly:
    ADD to "Would help narrow recommendations"
```

**Output format:**

#### To Provide Better Recommendations, Please Tell Us:
- [ ] **Exact building height** - Determines which fire safety provisions apply
- [ ] **Number of dwellings** - Affects HRB determination for care homes
- [ ] **Construction type** - Timber frame has specific requirements

#### Optional But Helpful:
- [ ] Expected submission date - Can flag time-sensitive requirements
- [ ] Previous BSR engagement - May have pre-app advice on file

---

## Implementation Notes

### Document Matching Algorithm

```python
def calculate_relevance(user_context, document):
    score = 0
    reasons = []

    # Geography
    if user_context.location == "london":
        if document.london_specific:
            score += 3
            reasons.append("London-specific guidance")
    if user_context.location_region in document.geography_scope:
        score += 2
        reasons.append(f"Applies to {user_context.location_region}")

    # Role
    if user_context.role in document.regulated_actors:
        score += 3
        reasons.append(f"Addresses {user_context.role} duties")

    # HRB status
    if user_context.is_hrb:
        if "higher_risk_buildings" in document.topic_tags:
            score += 4
            reasons.append("HRB-specific requirements")
        if "gateway_process" in document.topic_tags:
            score += 3
            reasons.append("Gateway process guidance")

    # Stage
    stage_topic_map = {
        "gateway2_application": ["gateway_process", "building_control"],
        "construction": ["golden_thread", "change_control"],
        "occupation": ["building_safety", "safety_case"]
    }
    if user_context.stage in stage_topic_map:
        for topic in stage_topic_map[user_context.stage]:
            if topic in document.topic_tags:
                score += 2
                reasons.append(f"Relevant to {user_context.stage}")
                break

    # Specific topic interest
    if user_context.topic_interest:
        if user_context.topic_interest in document.topic_tags:
            score += 3
            reasons.append("Matches your topic of interest")

    return score, reasons
```

### Report Generation Pipeline

1. **Parse intake responses** → User context object
2. **Load catalogue.json** → Document list
3. **Calculate relevance scores** → Ranked document list
4. **Filter to relevant documents** → Top N by score
5. **Extract obligations** → Must/should/may for user's role
6. **Order actions** → By urgency and impact
7. **Calculate fees** → From charging scheme if applicable
8. **Identify risks** → From exceptions and confidence notes
9. **Generate missing info prompts** → From unanswered questions
10. **Render report** → Markdown or HTML output

### Incremental Document Addition

When new documents are added:

1. Process through LLM extraction pipeline (same as initial docs)
2. Generate `doc_id` from filename hash
3. Create `/knowledge/docs/<doc_id>.json` and `.md`
4. Add entry to `catalogue.json`
5. No changes needed to intake_flow.json or this spec
6. New documents automatically included in relevance matching

---

## Example Report Output

```markdown
# Building Safety Report
**Generated:** 2026-02-17
**User:** Housing Association, London (Tower Hamlets)
**Project:** 24m residential building, Gateway 2 preparation

## Executive Summary
You are developing a Higher-Risk Building subject to BSR building control...

## What Applies to You
| Document | Relevance | Why |
|----------|-----------|-----|
| CLC Gateway 2 Guidance | High | HRB at G2 stage |
...

## Your Obligations
### MUST
- [ ] Submit to BSR before starting work
...

[etc.]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-17 | Initial specification |
