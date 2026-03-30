"""
annex4a_demo.py  —  Example usage of the Annex 4A Generator
============================================================
Demonstrates generate_annex4a_from_json() with a realistic sample
classified document registry for a new Higher-Risk Building.
"""

import json
from annex4a_generator import generate_annex4a_from_json

# ─── Sample classified document registry (Layer 1 output) ─────────────────
SAMPLE_REGISTRY = [
    {
        "file_reference": "2.1.1",
        "file_title": "Architectural Plans, Sections and Elevations",
        "primary_approved_doc_part": "A",
        "design_entity": "Architect",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.1.2",
        "file_title": "Structural General Arrangement Drawings",
        "primary_approved_doc_part": "A",
        "design_entity": "Structural Engineer",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.1.3",
        "file_title": "Geotechnical Ground Investigation Report",
        "primary_approved_doc_part": "A",
        "design_entity": "Geotechnical Engineer",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.2.1",
        "file_title": "Fire Strategy Report",
        "primary_approved_doc_part": "B",
        "design_entity": "Fire Engineer",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.2.2",
        "file_title": "External Wall System Fire Performance Assessment",
        "primary_approved_doc_part": "B",
        "design_entity": "Façade Consultant",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.2.3",
        "file_title": "Sprinkler System Design Specification",
        "primary_approved_doc_part": "B",
        "design_entity": "MEP Engineer",
        "submission_status": "AWR",
        "notes": "Final specification subject to product selection on site",
    },
    {
        "file_reference": "2.2.4",
        "file_title": "Smoke Control Strategy",
        "primary_approved_doc_part": "B",
        "design_entity": "MEP Engineer",
        "submission_status": "AWR",
        "notes": "Smoke fan specification deferred pending manufacturer coordination",
    },
    {
        "file_reference": "2.3.1",
        "file_title": "Site Investigation and Contamination Assessment",
        "primary_approved_doc_part": "C",
        "design_entity": "Environmental Consultant",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.6.1",
        "file_title": "Mechanical Ventilation Design Report",
        "primary_approved_doc_part": "F",
        "design_entity": "MEP Engineer",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.7.1",
        "file_title": "Drainage Strategy and Design",
        "primary_approved_doc_part": "H",
        "design_entity": "Civil Engineer",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.10.1",
        "file_title": "Energy Strategy and Target Emissions Rate Calculation",
        "primary_approved_doc_part": "L",
        "design_entity": "Energy Consultant",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.10.2",
        "file_title": "Photovoltaic Panel Layout and Output Schedule",
        "primary_approved_doc_part": "L",
        "design_entity": "Energy Consultant",
        "submission_status": "AWR",
        "notes": "Final panel specification subject to procurement",
    },
    {
        "file_reference": "2.11.1",
        "file_title": "Overheating Risk Assessment (TM59)",
        "primary_approved_doc_part": "O",
        "design_entity": "Environmental Consultant",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.12.1",
        "file_title": "Access and Inclusive Design Statement",
        "primary_approved_doc_part": "M",
        "design_entity": "Architect",
        "submission_status": "With Application",
    },
    {
        "file_reference": "2.13.1",
        "file_title": "Acoustic Design Report",
        "primary_approved_doc_part": "E",
        "design_entity": "Acoustic Consultant",
        "submission_status": "With Application",
    },
]

if __name__ == "__main__":
    result = generate_annex4a_from_json(json.dumps(SAMPLE_REGISTRY))

    # ── Print summary ───────────────────────────────────────────────────────
    summary = result["summary"]
    print("=" * 70)
    print("ANNEX 4A — APPLICATION INFORMATION SCHEDULE (Draft)")
    print("CLC Guidance Note 04 / Annex 4A v2.0")
    print("=" * 70)
    print(f"\n  Total files:              {summary['total_files']}")
    print(f"  Submitted with app:       {summary['total_with_application']}")
    print(f"  Deferred (AWR):           {summary['total_awr_files']}")
    print(f"\n  Approved Doc parts covered ({summary['parts_covered_count']}): {', '.join(summary['parts_covered'])}")
    print(f"  Approved Doc parts MISSING ({summary['parts_missing_count']}): {', '.join(summary['parts_missing'])}")
    print(f"\n  BFLO parts covered:       {', '.join(summary['bflo_covered']) or 'NONE'}")
    print(f"  BFLO parts MISSING:       {', '.join(summary['bflo_missing']) or 'None ✓'}")

    # ── Print schedule rows ─────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f"{'APPROVED DOC PART':<40} {'FILE REF':<10} {'ENTITY':<25} {'STATUS':<30}")
    print("-" * 70)
    last_part = None
    for row in result["schedule"]:
        part = row["approved_document_part"]
        if part != last_part:
            print()
            print(f"  {'★ BFLO CRITICAL ' if row['is_bflo_critical'] else ''}{part}")
            last_part = part
        if row["flag_missing"]:
            print(f"    ⚠️  {row['file_reference']}")
            print(f"       {row['notes']}")
        else:
            status_str = "AWR ⚠️" if row["is_awr"] else "With Application"
            print(f"    [{row['file_reference']}] {row['file_title'][:45]:<45}  {row['design_entity']:<22}  {status_str}")
            if row["notes"]:
                print(f"       Note: {row['notes']}")

    print("\n" + "=" * 70)
    print("End of draft Annex 4A schedule.")
    print("=" * 70)
