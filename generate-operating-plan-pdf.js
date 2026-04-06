const fs = require('fs');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function generatePDF() {
  console.log('Converting ATTLEE_OPERATING_PLAN.md to PDF...');

  // Read markdown file
  const markdown = fs.readFileSync('ATTLEE_OPERATING_PLAN.md', 'utf-8');

  // Convert to HTML
  const html = marked(markdown);

  // Create full HTML document
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
      margin-top: 40px;
      font-size: 2.2em;
    }
    h2 {
      color: #0066cc;
      margin-top: 30px;
      font-size: 1.8em;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
    }
    h3 {
      color: #333;
      margin-top: 25px;
      font-size: 1.4em;
    }
    h4 {
      color: #555;
      margin-top: 20px;
      font-size: 1.2em;
    }
    code {
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 4px solid #0066cc;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #0066cc;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    blockquote {
      border-left: 4px solid #0066cc;
      margin: 20px 0;
      padding: 10px 20px;
      background-color: #f5f5f5;
    }
    ul, ol {
      margin: 15px 0;
      padding-left: 30px;
    }
    li {
      margin: 8px 0;
    }
    strong {
      color: #000;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .page-break {
      page-break-after: always;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `;

  // Launch puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  // Generate PDF
  await page.pdf({
    path: 'ATTLEE_OPERATING_PLAN.pdf',
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true
  });

  await browser.close();

  console.log('✓ Generated ATTLEE_OPERATING_PLAN.pdf');
}

generatePDF().catch(console.error);
