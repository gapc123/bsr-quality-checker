"""
Generate three BSR Quality Checker validation PDFs.
Run with: python3 generate_test_pdfs.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

PAGE_W, PAGE_H = A4


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("title", parent=base["Title"], fontSize=20, spaceAfter=6, leading=24),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"], fontSize=13, spaceAfter=4, textColor=colors.HexColor("#444444")),
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontSize=15, spaceBefore=18, spaceAfter=6, textColor=colors.HexColor("#1a3c5e")),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontSize=12, spaceBefore=12, spaceAfter=4, textColor=colors.HexColor("#2c5f8a")),
        "body": ParagraphStyle("body", parent=base["Normal"], fontSize=10, spaceAfter=6, leading=15, alignment=TA_JUSTIFY),
        "bullet": ParagraphStyle("bullet", parent=base["Normal"], fontSize=10, spaceAfter=4, leftIndent=20, bulletIndent=10, leading=14),
        "note": ParagraphStyle("note", parent=base["Normal"], fontSize=9, spaceAfter=4, textColor=colors.HexColor("#666666"), leftIndent=10),
        "cover_field": ParagraphStyle("cover_field", parent=base["Normal"], fontSize=10, spaceAfter=3, leading=14),
    }
    return styles


def hr(story):
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 6))


def add_field_table(story, rows, styles):
    data = [[Paragraph(f"<b>{k}</b>", styles["body"]), Paragraph(v, styles["body"])] for k, v in rows]
    t = Table(data, colWidths=[6 * cm, 11 * cm])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#dddddd")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f5f7fa")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


# ---------------------------------------------------------------------------
# PDF 1 — GOOD QUALITY: Kensington Court
# ---------------------------------------------------------------------------
def generate_good(path, styles):
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2.5*cm, rightMargin=2.5*cm,
                            topMargin=2.5*cm, bottomMargin=2.5*cm)
    story = []

    story.append(Paragraph("FIRE STRATEGY REPORT", styles["title"]))
    story.append(Paragraph("Kensington Court — Gateway 2 Submission", styles["subtitle"]))
    story.append(Spacer(1, 12))
    hr(story)

    add_field_table(story, [
        ("Project",            "Kensington Court, 12 Kensington Park Road, London, W11 2ES"),
        ("Client",             "Kensington Residential Developments Ltd"),
        ("Principal Designer", "Premier Fire Consultants Ltd (CABE Accredited, IFE Corporate Member)"),
        ("Principal Contractor","BuildSafe Construction PLC (ISO 9001:2015 certified)"),
        ("Document Reference", "KGC-FSR-001 Rev D"),
        ("Date",               "15 October 2025"),
        ("Author",             "Dr. Sarah Whitmore CEng MIFireE — Senior Fire Engineer"),
        ("Checked By",         "James Patel FIFireE — Technical Director"),
    ], styles)

    story.append(Spacer(1, 10))

    # ---- Section 1 ----
    story.append(Paragraph("1. Introduction and Building Description", styles["h1"]))
    story.append(Paragraph(
        "This Fire Strategy Report has been prepared in accordance with the requirements of the Building Safety Act 2022 "
        "and Approved Document B (Fire Safety) 2019 Edition incorporating 2020 amendments (ADB). It forms part of the "
        "Gateway 2 building control application for Kensington Court.",
        styles["body"]))
    story.append(Paragraph(
        "Kensington Court is a new-build high-rise residential building (HRB) located in the Royal Borough of Kensington "
        "and Chelsea, London. The building comprises <b>7 storeys above ground level</b> and <b>1 basement storey</b>, "
        "achieving a <b>finished height of 22 metres above ground level</b> to the finished floor of the top storey, "
        "as measured per the Building Safety Act 2022 definition. The building contains <b>120 self-contained residential "
        "apartments</b> classified as Use Class C3 (Dwellinghouses).",
        styles["body"]))

    add_field_table(story, [
        ("Building Height",    "22m above ground level (measured to finished floor of highest storey)"),
        ("Number of Storeys",  "7 above ground + 1 basement (8 total)"),
        ("Use / Occupancy",    "C3 Residential — 120 self-contained apartments"),
        ("Construction Type",  "Reinforced concrete frame, brick outer leaf"),
        ("Location",           "Royal Borough of Kensington & Chelsea, London"),
    ], styles)

    story.append(Paragraph(
        "This report has been produced in compliance with BS 9991:2015 Fire Safety in the Design, Management and Use of "
        "Residential Buildings and the London Plan Policy D12 (Fire Safety).",
        styles["body"]))

    # ---- Section 2 ----
    story.append(Paragraph("2. Means of Escape", styles["h1"]))
    story.append(Paragraph(
        "The means of escape strategy has been designed in accordance with ADB Volume 1, Section 3 and BS 9991:2015 "
        "Clause 7. The primary evacuation strategy is <b>Stay Put</b>, with simultaneous evacuation as a contingency "
        "when directed by the fire and rescue service.",
        styles["body"]))

    story.append(Paragraph("2.1 Staircase Provision", styles["h2"]))
    story.append(Paragraph(
        "The building is served by <b>two protected escape staircases</b>, Stair Core A and Stair Core B, each "
        "running from basement level to the seventh floor. As the building exceeds 18m in height, two staircases "
        "are required by ADB Volume 1 Table 3.2 and are duly provided. Both staircases are pressurised to EN 12101-6 "
        "to maintain tenable conditions during evacuation.",
        styles["body"]))

    story.append(Paragraph("2.2 Travel Distances", styles["h2"]))
    story.append(Paragraph(
        "Maximum travel distances within apartments and common areas comply with ADB Table 3.2. The following distances "
        "have been confirmed from architectural drawings ref. KGC-A-001 to KGC-A-045:",
        styles["body"]))
    story.append(Paragraph("• Maximum travel distance within any apartment to the apartment entrance door: <b>9m</b>", styles["bullet"]))
    story.append(Paragraph("• Maximum travel distance in the common corridor to the nearest staircase: <b>7.5m</b>", styles["bullet"]))
    story.append(Paragraph("• Combined maximum travel distance (apartment door to staircase): <b>16.5m</b>, complying with the ADB limit of 45m (single direction) and 7.5m (dead-end corridor).", styles["bullet"]))
    story.append(Paragraph("• All final exit widths at ground floor level: <b>1,200mm minimum</b> clear width.", styles["bullet"]))
    story.append(Paragraph("• Emergency escape signage and maintained emergency lighting provided throughout to BS 5266-1:2016.", styles["bullet"]))

    story.append(Paragraph("2.3 Firefighting Lift", styles["h2"]))
    story.append(Paragraph(
        "A dedicated firefighting lift serving all floors is provided in accordance with ADB B5 and BS 9999:2017 "
        "Annex H. The lift is located adjacent to Stair Core A and is provided with a firefighting lobby at each level.",
        styles["body"]))

    # ---- Section 3 ----
    story.append(Paragraph("3. Compartmentation and Fire Resistance", styles["h1"]))
    story.append(Paragraph(
        "The compartmentation strategy provides fire resistance in accordance with ADB Volume 1 Table A1. Each "
        "residential apartment forms a <b>separate fire compartment</b>. The following minimum fire resistance periods "
        "are specified throughout the building:",
        styles["body"]))

    add_field_table(story, [
        ("Compartment floors/ceilings", "60 minutes (REI 60) — concrete slab construction"),
        ("Compartment walls",           "60 minutes (EI 60) — blockwork / proprietary fire-rated partitions"),
        ("Apartment entrance doors",    "30 minutes (E 30 / EI2 30) — FD30S self-closing fire doors"),
        ("Protected staircase walls",   "60 minutes (EI 60)"),
        ("Structural concrete frame",   "60 minutes minimum fire resistance (R 60)"),
        ("Fire stopping",               "All service penetrations sealed with tested intumescent systems per BR 128"),
        ("Cavity barriers",             "Installed at every floor level and at 20m horizontal intervals per ADB B3"),
    ], styles)

    story.append(Paragraph(
        "All cavity barriers are installed by the approved subcontractor and are subject to third-party inspection "
        "under the Site Inspection Programme ref. KGC-QA-003. Proprietary fire stopping products carry CE marking "
        "and have been independently tested to EN 1366-3.",
        styles["body"]))

    # ---- Section 4 ----
    story.append(Paragraph("4. External Wall Systems", styles["h1"]))
    story.append(Paragraph(
        "The external wall build-up has been assessed in accordance with the requirements of ADB Approved Document B "
        "Volume 2 Diagram 12.1 and the DLUHC Advice Note dated January 2020 for buildings over 18m.",
        styles["body"]))

    add_field_table(story, [
        ("Outer leaf",           "Facing brick — Class A1 (EN 13501-1) non-combustible"),
        ("Insulation",           "Mineral wool slab — Class A1 (EN 13501-1) non-combustible (Rockwool Rainscreen Duo Slab)"),
        ("Internal board",       "15mm fire-rated plasterboard — Class A2-s1,d0"),
        ("Overall system classification", "Class A2-s1,d0 per EN 13501-1 — complies with ADB requirement for >18m"),
        ("BR 135 Test Reference","Passed BS 8414-1 large-scale test; BR 135 Classification Report ref. TF/2024/0441"),
        ("Cavity barriers",      "Horizontal A1 mineral wool barriers at each floor level per ADB B3 Diagram 12.9"),
        ("EWS1 Classification",  "A1 — No combustible material in the wall"),
    ], styles)

    story.append(Paragraph(
        "Test certificates for all external wall products are included as Appendix D to this report. The EWS1 form "
        "signed by a RICS-registered EWS1 assessor (ref. EWS1-KGC-2025) confirms Class A1 status.",
        styles["body"]))

    # ---- Section 5 ----
    story.append(Paragraph("5. Active Fire Protection Systems", styles["h1"]))

    story.append(Paragraph("5.1 Sprinkler System", styles["h2"]))
    story.append(Paragraph(
        "An automatic sprinkler system is installed <b>throughout the entire building</b>, including all residential "
        "apartments, common areas, basement, and plant rooms. The system is designed and installed to "
        "<b>BS EN 12845:2015 + A1:2019</b> (Light Hazard classification for residential areas). "
        "The system is fed by a dedicated water supply with a minimum 30-minute reserve tank capacity per Table 7 "
        "of BS EN 12845. Third-party design certification is included at Appendix E.",
        styles["body"]))

    story.append(Paragraph("5.2 Fire Detection and Alarm", styles["h2"]))
    story.append(Paragraph(
        "An addressable fire detection and alarm system of Category <b>L1</b> is installed throughout, designed "
        "and installed to <b>BS 5839-1:2017</b>. The system includes automatic smoke and heat detectors in all "
        "rooms, common areas, plant rooms, and voids. The system interfaces with the sprinkler system, smoke "
        "control AOVs, and firefighting lift.",
        styles["body"]))

    story.append(Paragraph("5.3 Smoke Control", styles["h2"]))
    story.append(Paragraph(
        "Automatic Opening Vents (AOVs) are installed at the head of both protected staircases, opening "
        "automatically on alarm activation. The common corridor ventilation system operates in accordance with "
        "BS EN 12101-6 and provides a minimum 10 air changes per hour on alarm. Smoke shaft ventilation serves "
        "all apartment lobbies to ADB Volume 1 Section 2.25.",
        styles["body"]))

    # ---- Section 6 ----
    story.append(Paragraph("6. Firefighting Provisions", styles["h1"]))
    story.append(Paragraph(
        "Firefighting access and provision has been designed in accordance with ADB Volume 1 B5 and GN20 "
        "(Guidance on Fire Service Access for High-Rise Buildings).",
        styles["body"]))
    story.append(Paragraph("• Vehicle access road: <b>3.7m minimum width</b> hard-standing on three sides of the building.", styles["bullet"]))
    story.append(Paragraph("• Dry riser outlets: Installed in both Stair Core A and Stair Core B on every floor level to BS 9990:2015.", styles["bullet"]))
    story.append(Paragraph("• Fire main connection point: Located within 18m of the building perimeter.", styles["bullet"]))
    story.append(Paragraph("• Firefighting lobby: Provided adjacent to firefighting lift on all floors above 18m.", styles["bullet"]))
    story.append(Paragraph("• Secure key-safe: Installed at main entrance for fire service access.", styles["bullet"]))

    # ---- Section 7 ----
    story.append(Paragraph("7. Dutyholder Competence", styles["h1"]))
    story.append(Paragraph(
        "Principal Designer: Premier Fire Consultants Ltd. Competence evidence: CABE (Chartered Association of "
        "Building Engineers) accreditation ref. CABE-PD-2024-0112; IFE Corporate Membership of lead author; "
        "minimum 15 years experience on high-rise residential projects. CPD record included at Appendix F.",
        styles["body"]))
    story.append(Paragraph(
        "Principal Contractor: BuildSafe Construction PLC. Competence evidence: ISO 9001:2015 certification "
        "ref. ISO/2024/BC/001; 20+ HRB projects completed; Build UK member; no HSE enforcement notices in "
        "preceding 5 years (RIDDOR record at Appendix G).",
        styles["body"]))

    # ---- Section 8 ----
    story.append(Paragraph("8. Summary of Compliance", styles["h1"]))
    story.append(Paragraph(
        "The following table summarises the key compliance points for this submission:",
        styles["body"]))
    add_field_table(story, [
        ("Building height declared",    "22m — consistent throughout all submission documents"),
        ("Number of storeys",           "7 above ground + 1 basement — consistent"),
        ("Occupancy",                   "C3 Residential — 120 apartments"),
        ("Evacuation strategy",         "Stay Put with simultaneous evacuation contingency"),
        ("Sprinkler system",            "BS EN 12845:2015 throughout — YES"),
        ("Smoke control",               "AOVs in staircases; common corridor system — YES"),
        ("External wall classification","Class A1 — non-combustible throughout"),
        ("No. of escape staircases",    "2 (compliant for 22m / >18m building)"),
        ("Fire resistance periods",     "60 minutes throughout (REI/EI/R 60)"),
        ("Travel distances",            "Max 16.5m combined (compliant with ADB Table 3.2)"),
        ("Basement levels",             "1 basement (B1)"),
        ("Firefighting provisions",     "Dry riser, firefighting lift, access road — all provided"),
        ("Dutyholder competence",       "Evidenced — see Appendix F & G"),
    ], styles)

    hr(story)
    story.append(Paragraph(
        "This report has been prepared by Premier Fire Consultants Ltd. All information is correct to the best of the "
        "author's knowledge at the time of writing. This document should be read in conjunction with all other "
        "documents within the Gateway 2 submission pack, including Structural Calculations ref. KGC-STRUCT-001, "
        "MEP Specification ref. KGC-MEP-001, and Architectural General Arrangement drawings KGC-A-001 to KGC-A-045.",
        styles["note"]))

    doc.build(story)
    print(f"Generated: {path}")


# ---------------------------------------------------------------------------
# PDF 2 — POOR QUALITY (dangerous safety gaps): Ashford Tower
# ---------------------------------------------------------------------------
def generate_poor_safety(path, styles):
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2.5*cm, rightMargin=2.5*cm,
                            topMargin=2.5*cm, bottomMargin=2.5*cm)
    story = []

    story.append(Paragraph("FIRE STRATEGY REPORT", styles["title"]))
    story.append(Paragraph("Ashford Tower — Building Regulations Application", styles["subtitle"]))
    story.append(Spacer(1, 12))
    hr(story)

    add_field_table(story, [
        ("Project",            "Ashford Tower, 78 Station Road, Manchester, M1 4FG"),
        ("Client",             "Northern Property Group Ltd"),
        ("Prepared By",        "City Architects Ltd"),
        ("Document Reference", "AT-FSR-01 Rev A"),
        ("Date",               "20 January 2024"),
        ("Author",             "Mark Thompson — Architect"),
    ], styles)

    story.append(Spacer(1, 10))

    # ---- Section 1 ----
    story.append(Paragraph("1. Introduction", styles["h1"]))
    story.append(Paragraph(
        "This document has been prepared to support the building regulations application for Ashford Tower, "
        "a new residential development in Manchester. The building will provide 95 apartments across 9 storeys "
        "above ground level. The building height is approximately 28 metres.",
        styles["body"]))
    story.append(Paragraph(
        "This fire strategy has been prepared by City Architects Ltd. The document sets out the fire safety "
        "approach for the development.",
        styles["body"]))

    # ---- Section 2 ----
    story.append(Paragraph("2. Building Description", styles["h1"]))
    story.append(Paragraph(
        "Ashford Tower is a residential apartment building. The scheme comprises 95 apartments over 9 storeys. "
        "Accommodation is provided on floors 1 to 9. The building does not have a basement. ",
        styles["body"]))
    story.append(Paragraph(
        "The building is of reinforced concrete frame construction with external cladding. Residential use throughout.",
        styles["body"]))

    add_field_table(story, [
        ("Building Height",   "28m (approximate)"),
        ("Storeys",           "9 storeys above ground"),
        ("Use",               "Residential apartments (95 units)"),
        ("Basement",          "None"),
    ], styles)

    # ---- Section 3 ----
    story.append(Paragraph("3. Means of Escape", styles["h1"]))
    story.append(Paragraph(
        "The building will be provided with means of escape provisions in accordance with the relevant guidance.",
        styles["body"]))
    story.append(Paragraph(
        "A staircase is located in the central core of the building providing escape for all residents. "
        "The staircase is protected and runs from ground floor to the top floor. Escape routes are provided "
        "from all apartments onto the common corridor which leads to the staircase.",
        styles["body"]))
    story.append(Paragraph(
        "Evacuation of the building will be carried out in accordance with the fire alarm activation. "
        "Evacuation strategy to be confirmed at detailed design stage.",
        styles["body"]))
    story.append(Paragraph(
        "Emergency lighting will be provided in the escape routes.",
        styles["body"]))

    # ---- Section 4 ----
    story.append(Paragraph("4. Compartmentation", styles["h1"]))
    story.append(Paragraph(
        "Fire compartmentation will be provided throughout the building to restrict the spread of fire and smoke. "
        "Each floor will form a fire compartment. Compartment walls and floors will be constructed to provide "
        "appropriate fire resistance. Fire doors will be provided to all compartment openings.",
        styles["body"]))
    story.append(Paragraph(
        "Fire stopping will be provided to all service penetrations through compartment walls and floors. "
        "Full details of fire stopping products will be confirmed at detailed design stage.",
        styles["body"]))

    # ---- Section 5 ----
    story.append(Paragraph("5. External Wall Systems", styles["h1"]))
    story.append(Paragraph(
        "The external walls of the building will be constructed using an aluminium composite material (ACM) "
        "rainscreen cladding system as the outer layer. This provides an attractive and contemporary appearance "
        "appropriate to the Manchester city centre context.",
        styles["body"]))
    story.append(Paragraph(
        "The cladding system will be installed in accordance with the manufacturer's guidance. The contractor "
        "will confirm exact product specifications prior to installation.",
        styles["body"]))
    story.append(Paragraph(
        "Insulation within the external wall construction will be specified by the contractor at tender stage.",
        styles["body"]))

    # ---- Section 6 ----
    story.append(Paragraph("6. Active Fire Protection", styles["h1"]))
    story.append(Paragraph(
        "A fire detection and alarm system will be provided throughout the building. The system will include "
        "smoke and heat detectors in common areas and apartments. The fire alarm system will be designed and "
        "installed by a specialist contractor.",
        styles["body"]))
    story.append(Paragraph(
        "Further active fire protection measures will be confirmed at detailed design stage following engagement "
        "with the building control body.",
        styles["body"]))

    # ---- Section 7 ----
    story.append(Paragraph("7. Firefighting Provisions", styles["h1"]))
    story.append(Paragraph(
        "Fire service access will be provided to the building. A vehicle access road will be provided to the "
        "front of the building. Further firefighting provisions will be agreed with the local fire and rescue service.",
        styles["body"]))

    # ---- Section 8 ----
    story.append(Paragraph("8. Conclusion", styles["h1"]))
    story.append(Paragraph(
        "This fire strategy sets out the overall approach to fire safety for Ashford Tower. The building will "
        "be designed and constructed to comply with the relevant building regulations. Further detailed "
        "information will be provided at detailed design stage as required.",
        styles["body"]))

    hr(story)
    story.append(Paragraph(
        "Prepared by City Architects Ltd. January 2024.",
        styles["note"]))

    doc.build(story)
    print(f"Generated: {path}")


# ---------------------------------------------------------------------------
# PDF 3 — POOR QUALITY (internal inconsistencies): Cedar Gardens
# ---------------------------------------------------------------------------
def generate_poor_inconsistent(path, styles):
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2.5*cm, rightMargin=2.5*cm,
                            topMargin=2.5*cm, bottomMargin=2.5*cm)
    story = []

    story.append(Paragraph("FIRE STRATEGY REPORT & DESIGN SUMMARY", styles["title"]))
    story.append(Paragraph("Cedar Gardens Residential Development — Gateway 2 Submission", styles["subtitle"]))
    story.append(Spacer(1, 12))
    hr(story)

    add_field_table(story, [
        ("Project",            "Cedar Gardens, 201 Broad Lane, Birmingham, B15 2TT"),
        ("Client",             "Midlands Urban Housing Ltd"),
        ("Fire Engineer",      "FireSafe Consulting Ltd"),
        ("Document Reference", "CGD-FSR-002 Rev B"),
        ("Date",               "5 March 2025"),
        ("Author",             "R. Griffiths — Consultant Fire Engineer"),
    ], styles)

    story.append(Spacer(1, 10))

    # ---- Section 1 ----
    story.append(Paragraph("1. Project Overview", styles["h1"]))
    story.append(Paragraph(
        "Cedar Gardens is a high-rise residential development in Birmingham comprising <b>10 storeys above ground "
        "level</b>. The building reaches a <b>height of 35 metres</b> above ground level, placing it firmly within "
        "the definition of a Higher-Risk Building under the Building Safety Act 2022. The development contains "
        "145 self-contained apartments of mixed tenure.",
        styles["body"]))
    story.append(Paragraph(
        "This combined Fire Strategy Report and Design Summary has been prepared in accordance with the Building "
        "Safety Act 2022 and Approved Document B (Fire Safety). It addresses all key fire safety matters for the "
        "Gateway 2 submission.",
        styles["body"]))
    story.append(Paragraph(
        "The building's primary <b>evacuation strategy is Stay Put</b>, consistent with standard practice for "
        "residential high-rise buildings in the UK. Residents are instructed to remain within their apartments "
        "in the event of fire unless directly threatened.",
        styles["body"]))

    # ---- Section 2 ----
    story.append(Paragraph("2. Building Technical Description", styles["h1"]))
    story.append(Paragraph(
        "Cedar Gardens rises to <b>11 storeys above ground level</b> with a plant room at roof level. "
        "The reinforced concrete frame is of flat-slab construction with blockwork internal walls. "
        "The building sits above a single-storey basement car park.",
        styles["body"]))

    story.append(Paragraph(
        "The building height as confirmed on the structural engineers' drawings ref. CGD-STRUCT-201 is <b>31 metres</b> "
        "above finished ground level. The number of residential apartments totals 145 units spread across floors 1 to 10 "
        "(one apartment per staircase lobby layout is used on floor 11).",
        styles["body"]))

    add_field_table(story, [
        ("Confirmed Building Height",  "31m above ground level (per structural drawings CGD-STRUCT-201)"),
        ("Number of Storeys",          "11 above ground + basement (12 total)"),
        ("Number of Apartments",       "145 units (floors 1-10) plus plant room on floor 11"),
        ("Basement",                   "1 basement level — car park use"),
        ("Construction",               "Reinforced concrete flat-slab frame"),
        ("Location",                   "Birmingham — West Midlands"),
    ], styles)

    # ---- Section 3 ----
    story.append(Paragraph("3. Means of Escape Strategy", styles["h1"]))
    story.append(Paragraph(
        "The means of escape from Cedar Gardens has been designed to comply with ADB Volume 1 and BS 9991:2015. "
        "The building is served by <b>2 protected escape staircases</b> (Stair Core North and Stair Core South), "
        "each pressurised to EN 12101-6.",
        styles["body"]))
    story.append(Paragraph(
        "Travel distances within apartments have been confirmed from architectural drawings. The maximum travel "
        "distance from any point within an apartment to the apartment entrance door is <b>12 metres</b>. "
        "The maximum corridor travel distance from apartment entrance to staircase is <b>14 metres</b>.",
        styles["body"]))

    story.append(Paragraph("3.1 Evacuation Strategy", styles["h2"]))
    story.append(Paragraph(
        "Given the building height and the provision of sprinklers and fire detection throughout, the evacuation "
        "strategy adopted is <b>Simultaneous Evacuation</b>. All occupants will evacuate the building upon "
        "activation of the fire alarm system. Public address system (PAS) loudspeakers are installed throughout "
        "to direct occupants to the nearest escape route. This approach has been agreed with Birmingham Fire and "
        "Rescue Service at the pre-application meeting dated 18 November 2024.",
        styles["body"]))

    # ---- Section 4 ----
    story.append(Paragraph("4. External Wall Construction", styles["h1"]))
    story.append(Paragraph(
        "The external wall build-up for Cedar Gardens has been carefully specified to ensure compliance with "
        "ADB requirements for buildings over 18m in height. All external wall materials achieve a minimum "
        "classification of <b>Class A1 (EN 13501-1)</b>.",
        styles["body"]))

    add_field_table(story, [
        ("Outer leaf",      "Terracotta rainscreen tiles — Class A1 (EN 13501-1)"),
        ("Insulation",      "Mineral wool slab — Class A1 (EN 13501-1) — 150mm Rockwool Rainscreen Duo Slab"),
        ("Sheathing board", "12mm calcium silicate board — Class A1"),
        ("Internal board",  "15mm fire-rated plasterboard — Class A2-s1,d0"),
        ("Cavity barriers", "A1 mineral wool cavity barriers at each floor level"),
        ("EWS1 Status",     "A1 — No combustible materials present"),
        ("Test evidence",   "BR 135 large-scale test report ref. BRE/2024/CGD/0091"),
    ], styles)

    # ---- Section 5 ----
    story.append(Paragraph("5. Compartmentation and Fire Resistance", styles["h1"]))
    story.append(Paragraph(
        "The compartmentation strategy provides 60-minute fire resistance periods for all compartment elements, "
        "including floors, walls, and apartment entrance doors. The concrete frame achieves REI 60 without "
        "additional fire protection.",
        styles["body"]))
    story.append(Paragraph(
        "All fire doors to apartments are FD30S (30 min, with smoke seal). Protected staircase walls and floors "
        "achieve EI 60. Fire stopping to all service penetrations is provided using BS EN 1366-3 tested systems.",
        styles["body"]))

    # ---- Section 6 ----
    story.append(Paragraph("6. Active Fire Protection", styles["h1"]))

    story.append(Paragraph("6.1 Sprinkler System", styles["h2"]))
    story.append(Paragraph(
        "An automatic life-safety sprinkler system is installed throughout the entire building including all "
        "residential units, common areas, and the basement car park. The system has been designed and will be "
        "installed to <b>BS 9251:2021</b> (Sprinkler systems for residential and domestic occupancies — Code of "
        "practice). The system includes a dedicated water storage tank with a minimum 45-minute reserve capacity.",
        styles["body"]))

    story.append(Paragraph("6.2 Fire Detection and Alarm", styles["h2"]))
    story.append(Paragraph(
        "A full addressable fire detection and alarm system of Category L2 is installed throughout all common "
        "areas, plant rooms, and escape routes, with LD2 domestic detection within individual apartments. "
        "Designed and installed to BS 5839-1:2017. The system is monitored 24/7 by an Alarm Receiving Centre.",
        styles["body"]))

    story.append(Paragraph("6.3 Smoke Control", styles["h2"]))
    story.append(Paragraph(
        "Mechanical smoke extract ventilation is provided to the common corridors at each floor level, "
        "providing a minimum of 10 air changes per hour on alarm activation. AOVs are installed at the head "
        "of both escape staircases, opening automatically on detection. The system complies with BS EN 12101-6.",
        styles["body"]))

    # ---- Section 7 ----
    story.append(Paragraph("7. Firefighting Provisions and Site Access", styles["h1"]))
    story.append(Paragraph(
        "Fire appliance access is provided on three sides of the building via a 4.5m wide access road. "
        "Dry riser inlets are located within both escape staircase lobbies on every floor from ground to "
        "roof level, installed to BS 9990:2015. A firefighting lift is provided adjacent to Stair Core North, "
        "complying with ADB B5 and BS 8899:2016.",
        styles["body"]))
    story.append(Paragraph(
        "Escape staircase provision: The building is served by <b>3 protected escape staircases</b> serving "
        "all residential floors. Stair Core North, Stair Core South, and the secondary Central Stair all run "
        "from basement level to the roof plant room.",
        styles["body"]))

    # ---- Section 8 ----
    story.append(Paragraph("8. External Wall Cladding System — Revised Specification", styles["h1"]))
    story.append(Paragraph(
        "Following value engineering review by the contractor (Midlands Build Ltd), the external wall "
        "specification has been revised. The approved revised system is as follows:",
        styles["body"]))

    add_field_table(story, [
        ("Outer leaf",      "ACM rainscreen panel system — colour: anthracite grey"),
        ("Product",         "Alucobond Plus — aluminium composite panel with PE core"),
        ("Insulation",      "EPS (expanded polystyrene) foam board insulation — 120mm"),
        ("Sheathing board", "OSB (oriented strand board)"),
        ("Cavity barriers", "Tbc by contractor prior to commencement"),
        ("Note",            "EWS1 assessment pending — assessor to be appointed"),
    ], styles)

    # ---- Section 9 ----
    story.append(Paragraph("9. Summary Table", styles["h1"]))
    story.append(Paragraph(
        "The following table provides a summary of the key fire safety parameters for this submission:",
        styles["body"]))
    add_field_table(story, [
        ("Building height",          "35m above ground level"),
        ("Number of storeys",        "10 storeys residential"),
        ("Evacuation strategy",      "Stay Put"),
        ("Sprinkler system",         "BS EN 12845:2015 — throughout"),
        ("Fire detection",           "L2 category system — BS 5839-1:2017"),
        ("External wall class",      "Class A1 — non-combustible"),
        ("Escape staircases",        "2 protected staircases"),
        ("Fire resistance periods",  "60 minutes throughout"),
        ("Travel distances",         "Max 26m combined"),
        ("Basement levels",          "1 — car park"),
    ], styles)

    hr(story)
    story.append(Paragraph(
        "Prepared by FireSafe Consulting Ltd on behalf of Midlands Urban Housing Ltd. March 2025. "
        "This document should be read alongside the structural calculations ref. CGD-STRUCT-201.",
        styles["note"]))

    doc.build(story)
    print(f"Generated: {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import os
    out = os.path.dirname(os.path.abspath(__file__))
    styles = build_styles()

    generate_good(
        os.path.join(out, "1_good_fire_strategy_kensington_court.pdf"),
        styles
    )
    generate_poor_safety(
        os.path.join(out, "2_poor_fire_strategy_ashford_tower.pdf"),
        styles
    )
    generate_poor_inconsistent(
        os.path.join(out, "3_inconsistent_cedar_gardens.pdf"),
        styles
    )

    print("\nAll 3 PDFs generated successfully.")
