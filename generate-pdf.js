const fs = require('fs');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

async function generatePDF() {
  // Read the markdown file
  const markdown = fs.readFileSync('attlee-ai-overview.md', 'utf-8');

  // Convert markdown to HTML
  const html = marked(markdown);

  // Create full HTML document with styling
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 60px;
          font-size: 10pt;
        }
        h1 {
          color: #1a1a1a;
          font-size: 24pt;
          margin-bottom: 10px;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 10px;
        }
        h2 {
          color: #0066cc;
          font-size: 16pt;
          margin-top: 30px;
          margin-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 5px;
        }
        h3 {
          color: #333;
          font-size: 12pt;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        p {
          margin: 10px 0;
        }
        ul, ol {
          margin: 10px 0;
          padding-left: 25px;
        }
        li {
          margin: 5px 0;
        }
        strong {
          color: #1a1a1a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 9pt;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
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
        hr {
          border: none;
          border-top: 2px solid #e0e0e0;
          margin: 25px 0;
        }
        em {
          color: #666;
          font-size: 8pt;
        }
        code {
          background-color: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  // Generate PDF
  await page.pdf({
    path: 'attlee-ai-overview.pdf',
    format: 'A4',
    margin: {
      top: '0.75in',
      right: '0.75in',
      bottom: '0.75in',
      left: '0.75in'
    },
    printBackground: true
  });

  await browser.close();
  console.log('PDF generated successfully: attlee-ai-overview.pdf');
}

generatePDF().catch(console.error);
