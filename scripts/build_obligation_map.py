"""
EXPLORATORY SCRIPT — build_obligation_map.py
=============================================
Reads butler-library regulation documents from the database, extracts obligations,
time constraints, conditions, and citations using LexNLP, then classifies each
clause as HARD_REQUIREMENT / PERMISSION / ADVISORY.

Results are written to a new `obligation_map` table.

This script is READ-ONLY from the perspective of the existing application:
  - It does not modify any existing tables.
  - The `obligation_map` table is not referenced by any existing checks.
  - Existing deterministic rules and LLM assessments are unaffected.

Intent: generate a structured obligation map that can later inform automated
generation of deterministic checks, reducing the reliance on hand-coded rules.
"""

import json
import os
import re
import sys
import subprocess
import importlib
import uuid
import traceback
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# 1. Dependency bootstrap
# ---------------------------------------------------------------------------

def pip_install(package: str) -> bool:
    """Attempt to install a package; return True if successful."""
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", package, "--quiet"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return True
    except subprocess.CalledProcessError:
        return False


def try_import(module_name: str, pip_name: str | None = None):
    """Try to import a module, optionally pip-installing it first."""
    try:
        return importlib.import_module(module_name)
    except ImportError:
        pkg = pip_name or module_name
        print(f"  [{module_name}] not found — attempting: pip install {pkg}")
        if pip_install(pkg):
            try:
                return importlib.import_module(module_name)
            except ImportError:
                pass
        print(f"  WARNING: could not import {module_name}. Related features will be skipped.")
        return None


print("Checking dependencies...")
lexnlp = try_import("lexnlp", "lexnlp")
regnlp = try_import("regnlp", "regnlp")

# lexnlp sub-modules (only if lexnlp loaded)
extract_durations = None
extract_conditions = None
extract_citations = None

if lexnlp:
    try:
        from lexnlp.extract.en import durations as _dur
        extract_durations = _dur
    except Exception as e:
        print(f"  WARNING: lexnlp.extract.en.durations unavailable: {e}")
    try:
        from lexnlp.extract.en import conditions as _cond
        extract_conditions = _cond
    except Exception as e:
        print(f"  WARNING: lexnlp.extract.en.conditions unavailable: {e}")
    try:
        from lexnlp.extract.en import citations as _cit
        extract_citations = _cit
    except Exception as e:
        print(f"  WARNING: lexnlp.extract.en.citations unavailable: {e}")

# regnlp ObligationClassifier (only if regnlp loaded)
obligation_classifier = None
if regnlp:
    try:
        ObligationClassifier = getattr(regnlp, "ObligationClassifier", None)
        if ObligationClassifier:
            obligation_classifier = ObligationClassifier()
            print("  regnlp ObligationClassifier loaded.")
        else:
            print("  WARNING: regnlp has no ObligationClassifier attribute — using heuristic fallback.")
    except Exception as e:
        print(f"  WARNING: could not initialise regnlp ObligationClassifier: {e} — using heuristic fallback.")

# ---------------------------------------------------------------------------
# 2. Heuristic obligation classifier (fallback when regnlp unavailable)
# ---------------------------------------------------------------------------

_HARD_PATTERNS = re.compile(
    r"\b(shall|must|is required|are required|is mandatory|shall not|must not"
    r"|it is a requirement|required to|shall be provided|shall include"
    r"|shall demonstrate|shall submit|shall comply)\b",
    re.IGNORECASE,
)
_PERMISSION_PATTERNS = re.compile(
    r"\b(may|can|is permitted|are permitted|is allowed|at the applicant"
    r"|at the developer|is not required|need not|does not need to"
    r"|is optional|alternatively)\b",
    re.IGNORECASE,
)
_ADVISORY_PATTERNS = re.compile(
    r"\b(should|ought to|it is recommended|it is advised|best practice"
    r"|consider|where possible|where practicable|guidance suggests"
    r"|is encouraged|it is good practice)\b",
    re.IGNORECASE,
)


def classify_obligation_heuristic(text: str) -> str:
    """Keyword-based fallback classifier returning HARD_REQUIREMENT / PERMISSION / ADVISORY."""
    hard = len(_HARD_PATTERNS.findall(text))
    perm = len(_PERMISSION_PATTERNS.findall(text))
    adv  = len(_ADVISORY_PATTERNS.findall(text))
    if hard > 0 and hard >= perm and hard >= adv:
        return "HARD_REQUIREMENT"
    if perm > 0 and perm >= adv:
        return "PERMISSION"
    if adv > 0:
        return "ADVISORY"
    return "ADVISORY"  # default for undetermined


def classify_obligation(text: str) -> str:
    """Classify a clause using regnlp if available, otherwise use heuristic."""
    if obligation_classifier:
        try:
            label = obligation_classifier.classify(text)
            # Normalise whatever the library returns to our three-value enum
            label_up = str(label).upper()
            if "HARD" in label_up or "REQUIREMENT" in label_up or "MANDATORY" in label_up:
                return "HARD_REQUIREMENT"
            if "PERMISS" in label_up or "OPTIONAL" in label_up or "ALLOW" in label_up:
                return "PERMISSION"
            return "ADVISORY"
        except Exception as e:
            print(f"    regnlp classify error: {e} — falling back to heuristic")
    return classify_obligation_heuristic(text)


# ---------------------------------------------------------------------------
# 3. LexNLP extractors (each returns a JSON-serialisable list)
# ---------------------------------------------------------------------------

def get_durations(text: str) -> list:
    if not extract_durations:
        return []
    try:
        results = []
        for d in extract_durations.get_duration_list(text):
            results.append(str(d))
        return results
    except Exception as e:
        print(f"    duration extraction error: {e}")
        return []


def get_conditions(text: str) -> list:
    if not extract_conditions:
        return []
    try:
        results = []
        for c in extract_conditions.get_condition_list(text):
            results.append(str(c))
        return results
    except Exception as e:
        print(f"    condition extraction error: {e}")
        return []


def get_citations(text: str) -> list:
    if not extract_citations:
        return []
    try:
        results = []
        for c in extract_citations.get_citation_list(text):
            results.append(str(c))
        return results
    except Exception as e:
        print(f"    citation extraction error: {e}")
        return []


# ---------------------------------------------------------------------------
# 4. Database connection — supports SQLite (file:...) and PostgreSQL
# ---------------------------------------------------------------------------

def resolve_db_url() -> str:
    """Read DATABASE_URL from .env, falling back to the dev SQLite file."""
    env_path = Path(__file__).parent.parent / "packages" / "backend" / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL"):
                _, _, raw = line.partition("=")
                return raw.strip().strip('"').strip("'")
    fallback = Path(__file__).parent.parent / "packages" / "backend" / "prisma" / "dev.db"
    return f"file:{fallback}"


def get_connection(db_url: str):
    """Return (connection, db_type) where db_type is 'sqlite' or 'postgres'."""
    if db_url.startswith("file:"):
        import sqlite3
        path = db_url[len("file:"):]
        if not Path(path).exists():
            sys.exit(f"SQLite database not found at: {path}")
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        return conn, "sqlite"
    else:
        try:
            import psycopg2
            import psycopg2.extras
        except ImportError:
            print("psycopg2 not found — installing...")
            if not pip_install("psycopg2-binary"):
                sys.exit("Could not install psycopg2-binary. Install manually and retry.")
            import psycopg2
            import psycopg2.extras
        conn = psycopg2.connect(db_url)
        return conn, "postgres"


def placeholder(db_type: str, n: int = 1) -> str:
    """Return the correct parameter placeholder for the db type."""
    return "?" if db_type == "sqlite" else "%s"


# ---------------------------------------------------------------------------
# 5. Obligation map table DDL
# ---------------------------------------------------------------------------

OBLIGATION_MAP_DDL_SQLITE = """
CREATE TABLE IF NOT EXISTS obligation_map (
    id                 TEXT     PRIMARY KEY,
    butler_document_id TEXT     NOT NULL,
    source_text        TEXT     NOT NULL,
    obligation_type    TEXT     NOT NULL,
    time_constraints   TEXT     NOT NULL DEFAULT '[]',
    conditions         TEXT     NOT NULL DEFAULT '[]',
    citations          TEXT     NOT NULL DEFAULT '[]',
    created_at         TEXT     NOT NULL
)
"""

OBLIGATION_MAP_DDL_POSTGRES = """
CREATE TABLE IF NOT EXISTS obligation_map (
    id                 TEXT        PRIMARY KEY,
    butler_document_id TEXT        NOT NULL,
    source_text        TEXT        NOT NULL,
    obligation_type    TEXT        NOT NULL,
    time_constraints   JSONB       NOT NULL DEFAULT '[]',
    conditions         JSONB       NOT NULL DEFAULT '[]',
    citations          JSONB       NOT NULL DEFAULT '[]',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def ensure_table(cursor, db_type: str):
    ddl = OBLIGATION_MAP_DDL_SQLITE if db_type == "sqlite" else OBLIGATION_MAP_DDL_POSTGRES
    cursor.execute(ddl)


# ---------------------------------------------------------------------------
# 6. Sentence splitter (simple regex; avoids spaCy dependency)
# ---------------------------------------------------------------------------

_SENTENCE_RE = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9])')

def split_sentences(text: str) -> list[str]:
    """Split text into sentences; skip blanks and very short fragments."""
    raw = _SENTENCE_RE.split(text.strip())
    return [s.strip() for s in raw if len(s.strip()) >= 20]


# ---------------------------------------------------------------------------
# 7. Main
# ---------------------------------------------------------------------------

def main():
    db_url = resolve_db_url()
    is_file = db_url.startswith("file:")
    db_label = db_url if is_file else re.sub(r':([^@]+)@', ':***@', db_url)
    print(f"\nConnecting to database: {db_label}")

    conn, db_type = get_connection(db_url)
    cursor = conn.cursor()

    print(f"Database type: {db_type}")

    # ---- Ensure obligation_map table exists ----------------------------
    ensure_table(cursor, db_type)
    conn.commit()

    # ---- Query butler documents ----------------------------------------
    # Butler regulation documents are stored in the Document table with
    # libraryType = 'butler'. Their extracted text lives in Chunk records.
    ph = placeholder(db_type)
    cursor.execute(
        f"SELECT id, filename, docType FROM \"Document\" WHERE \"libraryType\" = {ph}",
        ("butler",),
    )
    butler_docs = cursor.fetchall()

    if not butler_docs:
        # Try unquoted table name (SQLite is case-insensitive)
        try:
            cursor.execute(
                f"SELECT id, filename, docType FROM Document WHERE libraryType = {ph}",
                ("butler",),
            )
            butler_docs = cursor.fetchall()
        except Exception:
            pass

    print(f"\nFound {len(butler_docs)} butler document(s).\n")
    if not butler_docs:
        print("No butler documents found. Upload regulation PDFs via the Butler Library first.")
        conn.close()
        return

    # ---- Process each document -----------------------------------------
    total_clauses = 0
    skipped_clauses = 0
    type_counts = {"HARD_REQUIREMENT": 0, "PERMISSION": 0, "ADVISORY": 0}
    all_time_constraints: list[str] = []
    rows_inserted = 0

    for doc in butler_docs:
        doc_id   = doc[0] if db_type == "postgres" else doc["id"]
        filename = doc[1] if db_type == "postgres" else doc["filename"]
        print(f"Processing: {filename} ({doc_id})")

        # Fetch all chunks for this document, ordered by chunkIndex
        try:
            cursor.execute(
                f'SELECT text FROM "Chunk" WHERE "documentId" = {ph} ORDER BY "chunkIndex"',
                (doc_id,),
            )
            chunks = cursor.fetchall()
        except Exception:
            cursor.execute(
                f"SELECT text FROM Chunk WHERE documentId = {ph} ORDER BY chunkIndex",
                (doc_id,),
            )
            chunks = cursor.fetchall()

        full_text = "\n".join(
            (row[0] if db_type == "postgres" else row["text"]) for row in chunks
        )

        if not full_text.strip():
            print(f"  No text extracted for this document — skipping.")
            continue

        sentences = split_sentences(full_text)
        print(f"  {len(sentences)} sentences to classify")

        now_iso = datetime.now(timezone.utc).isoformat()

        for sentence in sentences:
            total_clauses += 1
            try:
                obligation_type  = classify_obligation(sentence)
                time_constraints = get_durations(sentence)
                conditions       = get_conditions(sentence)
                citations        = get_citations(sentence)

                type_counts[obligation_type] = type_counts.get(obligation_type, 0) + 1
                all_time_constraints.extend(time_constraints)

                row_id = str(uuid.uuid4())

                if db_type == "sqlite":
                    cursor.execute(
                        """
                        INSERT OR IGNORE INTO obligation_map
                            (id, butler_document_id, source_text, obligation_type,
                             time_constraints, conditions, citations, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            row_id, doc_id, sentence, obligation_type,
                            json.dumps(time_constraints),
                            json.dumps(conditions),
                            json.dumps(citations),
                            now_iso,
                        ),
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO obligation_map
                            (id, butler_document_id, source_text, obligation_type,
                             time_constraints, conditions, citations, created_at)
                        VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (
                            row_id, doc_id, sentence, obligation_type,
                            json.dumps(time_constraints),
                            json.dumps(conditions),
                            json.dumps(citations),
                            now_iso,
                        ),
                    )
                rows_inserted += 1

            except Exception as e:
                skipped_clauses += 1
                print(f"    ERROR processing clause (skipped): {e}")
                if "--verbose" in sys.argv:
                    traceback.print_exc()
                continue

        conn.commit()
        print(f"  Done ({rows_inserted} rows so far)")

    conn.close()

    # ---- Summary --------------------------------------------------------
    print("\n" + "=" * 60)
    print("OBLIGATION MAP — BUILD SUMMARY")
    print("=" * 60)
    print(f"Total clauses processed : {total_clauses}")
    print(f"Clauses skipped (errors): {skipped_clauses}")
    print(f"Rows written            : {rows_inserted}")
    print()
    print("Breakdown by obligation type:")
    for otype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        pct = (count / total_clauses * 100) if total_clauses else 0
        print(f"  {otype:<22} {count:>5}  ({pct:.1f}%)")
    print()
    if all_time_constraints:
        print(f"Time constraints found ({len(all_time_constraints)} total):")
        for tc in sorted(set(all_time_constraints))[:20]:
            print(f"  - {tc}")
        if len(all_time_constraints) > 20:
            print(f"  ... and {len(all_time_constraints) - 20} more")
    else:
        print("No time constraints extracted.")
    print()
    if not lexnlp:
        print("NOTE: lexnlp was not available — time constraints, conditions, and")
        print("      citations columns will all be empty arrays. Install lexnlp")
        print("      (pip install lexnlp) and re-run for full extraction.")
    if not obligation_classifier:
        print("NOTE: regnlp ObligationClassifier was not available. Obligation types")
        print("      were classified using a keyword heuristic (shall/must →")
        print("      HARD_REQUIREMENT, may/can → PERMISSION, should → ADVISORY).")
    print("=" * 60)


if __name__ == "__main__":
    main()
