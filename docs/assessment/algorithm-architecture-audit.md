# Algorithm Architecture Audit - Phase 0

**Date**: 2026-02-28
**Status**: In Progress
**Scope**: Complete deterministic assessment system from PDF upload to final decision

---

## 1. DATA FLOW MAPPING

### Complete Pipeline

```
┌─────────────────┐
│  PDF Upload     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Text Extraction │ (ingestion.ts)
│ - pdf-parse lib │
│ - Extract text  │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ Document             │
│ Classification       │ (ingestion.ts: classifyDocType)
│ - Pattern matching   │
│ - Assign docType     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Text Chunking        │ (ingestion.ts: chunkText)
│ - 1000 char chunks   │
│ - 200 char overlap   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Store in Database    │
│ - Document record    │
│ - Chunk records      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ ASSESSMENT TRIGGER   │
└────────┬─────────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌──────────────────────┐            ┌─────────────────────┐
│ PHASE 1:             │            │ PHASE 2:            │
│ DETERMINISTIC RULES  │            │ LLM ANALYSIS        │
│                      │            │ (30 matrix criteria)│
│ (55 rules)           │            │                     │
│                      │            │ - Corpus retrieval  │
│ 1. Prepare docs      │            │ - Claude API call   │
│ 2. Execute rules     │            │ - Evidence mapping  │
│ 3. Return results    │            │ - Proposed changes  │
└────────┬─────────────┘            └──────────┬──────────┘
         │                                     │
         │                                     │
         └──────────────┬──────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ RESULT AGGREGATION  │
              │                     │
              │ - Combine phases    │
              │ - Calculate score   │
              │ - Identify gaps     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ OUTPUT GENERATION   │
              │                     │
              │ - Assessment report │
              │ - Issues list       │
              │ - Readiness score   │
              └─────────────────────┘
```

---

## 2. PHASE 1: DETERMINISTIC RULES ENGINE ANALYSIS

### 2.1 Evidence Preparation Pipeline

**Location**: `deterministic-rules.ts` lines 36-155

**Key Functions**:
