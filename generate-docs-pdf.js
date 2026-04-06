const puppeteer = require('puppeteer');
const fs = require('fs');
const { marked } = require('marked');

async function generatePDF(markdownFile, outputFile) {
  console.log(`Converting ${markdownFile} to ${outputFile}...`);
  
  // Read markdown
  const markdown = fs.readFileSync(markdownFile, 'utf-8');
  
  // Convert to HTML
  const htmlContent = marked.parse(markdown);
  
  // Wrap in HTML template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #1a202c;
      border-bottom: 3px solid #3182ce;
      padding-bottom: 10px;
      margin-top: 40px;
    }
    h2 {
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 30px;
    }
    h3 {
      color: #4a5568;
      margin-top: 24px;
    }
    code {
      background: #f7fafc;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.85em;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #3182ce;
      padding-left: 16px;
      margin: 16px 0;
      color: #4a5568;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #f7fafc;
      font-weight: 600;
    }
    hr {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 30px 0;
    }
    ul, ol {
      padding-left: 24px;
    }
    li {
      margin: 6px 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `;
  
  // Generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: outputFile,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true
  });
  
  await browser.close();
  console.log(`✓ Generated ${outputFile}`);
}

async function main() {
  await generatePDF('TECHNICAL_OVERVIEW.md', 'TECHNICAL_OVERVIEW.pdf');
  await generatePDF('PRODUCT_OVERVIEW.md', 'PRODUCT_OVERVIEW.pdf');
  console.log('\n✅ Both PDFs generated successfully!');
}

main().catch(console.error);
