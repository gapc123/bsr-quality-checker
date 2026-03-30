"""
bsr_quality_checker — BSR Quality Checker Python package
=========================================================
Layer 2: Application Information Schedule generation (Annex 4A).
Layer 3: Completeness check against the Build UK rejection catalogue.

Entry points:
    from bsr_quality_checker.annex4a_generator import generate_annex4a_from_json
    from bsr_quality_checker.completeness_check import run_completeness_check
"""

from .annex4a_generator import (
    generate_annex4a_from_json,
    generate_annex4a,
    APPROVED_DOCUMENT_PARTS,
    BFLO_PARTS,
    ScheduleEntry,
    Annex4ASchedule,
)

from .completeness_check import (
    run_completeness_check,
    run_completeness_check_from_json,
)

from .completeness_knowledge_base import (
    BSR_REQUIREMENTS,
    COVERAGE_PRIORITY,
)

from .coordination_check import (
    run_coordination_check,
    run_coordination_check_from_json,
)

from .icj_checker import (
    run_icj_check,
    run_icj_check_from_json,
)

from .rfi_response_generator import (
    generate_rfi_response,
    generate_rfi_response_from_json,
)

from .conflict_report_exporter import (
    ConflictReport,
    export_report,
    export_report_from_json,
)

from .rejection_scorecard import (
    REJECTION_CATALOGUE,
    generate_scorecard,
    generate_scorecard_from_json,
    to_markdown,
)

__all__ = [
    # Layer 2
    "generate_annex4a_from_json",
    "generate_annex4a",
    "APPROVED_DOCUMENT_PARTS",
    "BFLO_PARTS",
    "ScheduleEntry",
    "Annex4ASchedule",
    # Layer 3
    "run_completeness_check",
    "run_completeness_check_from_json",
    "BSR_REQUIREMENTS",
    "COVERAGE_PRIORITY",
    # Layer 4
    "run_coordination_check",
    "run_coordination_check_from_json",
    # Layer 5
    "run_icj_check",
    "run_icj_check_from_json",
    # Layer 6
    "generate_rfi_response",
    "generate_rfi_response_from_json",
    # Report exporter
    "ConflictReport",
    "export_report",
    "export_report_from_json",
    # Rejection scorecard
    "REJECTION_CATALOGUE",
    "generate_scorecard",
    "generate_scorecard_from_json",
    "to_markdown",
]
