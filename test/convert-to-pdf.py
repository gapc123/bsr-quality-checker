#!/usr/bin/env python3
"""
Convert text files to PDFs using reportlab
"""

import os
from pathlib import Path

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.enums import TA_LEFT
except ImportError:
    print("❌ reportlab not installed. Installing now...")
    os.system("pip3 install reportlab")
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.enums import TA_LEFT

SAMPLE_DIR = Path(__file__).parent / "sample-documents"

def convert_txt_to_pdf(txt_path: Path):
    """Convert a text file to PDF with proper formatting"""
    pdf_path = txt_path.with_suffix('.pdf')

    # Create PDF
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Read text content
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Create styles
    styles = getSampleStyleSheet()

    # Custom style for body text
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        fontName='Courier',
        alignment=TA_LEFT,
        spaceAfter=6
    )

    # Build PDF content
    story = []

    # Split content into lines and create paragraphs
    lines = content.split('\n')
    for line in lines:
        if line.strip():
            # Escape XML special characters
            line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(line, body_style))
        else:
            story.append(Spacer(1, 0.1*inch))

    # Build PDF
    doc.build(story)

    return pdf_path

def main():
    print(f"\n📄 Converting text files to PDF...\n")

    txt_files = list(SAMPLE_DIR.glob("*.txt"))

    if not txt_files:
        print("❌ No .txt files found in sample-documents/")
        return

    for txt_file in txt_files:
        try:
            pdf_path = convert_txt_to_pdf(txt_file)
            print(f"✓ {txt_file.name} → {pdf_path.name}")
        except Exception as e:
            print(f"✗ Failed to convert {txt_file.name}: {e}")

    print(f"\n✅ Conversion complete! {len(txt_files)} PDFs created.\n")

    # List all files
    print("📁 Files in sample-documents/:")
    for file in sorted(SAMPLE_DIR.iterdir()):
        size = file.stat().st_size
        print(f"   {file.name} ({size:,} bytes)")
    print()

if __name__ == "__main__":
    main()
