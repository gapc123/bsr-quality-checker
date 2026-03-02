const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  const htmlPath = path.join(__dirname, 'attlee-ai-assessment-process.html');
  const outputPath = path.join(__dirname, 'attlee-ai-assessment-process.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    console.log('Loading HTML file...');
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0'
    });

    // Add custom styling for better PDF output
    await page.addStyleTag({
      content: `
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 100%;
          padding: 20px;
        }
        h1 {
          color: #1e3a5f;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
          margin-top: 30px;
        }
        h2 {
          color: #1e3a5f;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
          margin-top: 25px;
        }
        h3 {
          color: #3b82f6;
          margin-top: 20px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;
        }
        th {
          background-color: #1e3a5f;
          color: white;
          padding: 10px;
          text-align: left;
        }
        td {
          border: 1px solid #e5e7eb;
          padding: 8px;
        }
        code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        pre {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #3b82f6;
          overflow-x: auto;
        }
        blockquote {
          border-left: 4px solid #fbbf24;
          padding-left: 15px;
          margin: 15px 0;
          font-style: italic;
          color: #666;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          h1, h2, h3 {
            page-break-after: avoid;
          }
          table, pre {
            page-break-inside: avoid;
          }
        }
      `
    });

    console.log('Generating PDF...');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #666; margin-top: 10px;">
          Attlee AI Assessment Process - Technical Documentation
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #666; margin-bottom: 10px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });

    console.log(`PDF generated successfully: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePDF();
