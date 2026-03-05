# BSR Gateway 2 Pack Quality Checker

A web application that checks Building Safety Regulator (BSR) Gateway 2 submission packs for document quality, clarity, completeness, and internal consistency.

**IMPORTANT:** This is NOT a compliance tool. It is a reviewability diagnostic that helps identify potential issues before submission. Compliance determinations are the sole responsibility of the BSR.

## Features

- **PDF Document Ingestion**: Upload and process PDF documents with automatic text extraction
- **Field Extraction**: AI-powered extraction of key building information (height, storeys, evacuation strategy, etc.)
- **Consistency Checking**: Automatic detection of inconsistencies across documents
- **Quality Analysis**: AI-generated findings with severity ratings, actions, and citations
- **Report Generation**: Export reports in Markdown, PDF, or JSON format
- **Butler Library**: Add reference documents for cross-referencing during analysis

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM
- **Frontend**: React + Vite + Tailwind CSS
- **PDF Processing**: pdf-parse
- **LLM**: Anthropic Claude API
- **PDF Generation**: Puppeteer

## Project Structure

```
bsr-quality-checker/
├── packages/
│   ├── backend/           # Express API server
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── services/  # Business logic
│   │   │   ├── prompts/   # Claude prompt templates
│   │   │   └── db/        # Prisma client
│   │   └── prisma/        # Database schema
│   └── frontend/          # React application
│       └── src/
│           ├── pages/     # Page components
│           └── components/# Shared components
├── data/
│   └── reference/         # Baseline reference documents
├── uploads/               # Uploaded PDF storage
└── reports/               # Generated reports
```

## Prerequisites

- Node.js 18+
- npm 9+
- Anthropic API key

## Quick Start

1. **Clone and install dependencies**
   ```bash
   cd bsr-quality-checker
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cd packages/backend
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Initialize the database**
   ```bash
   npm run db:setup
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API at http://localhost:3001
   - Frontend at http://localhost:5173

## Environment Variables

Create a `.env` file in `packages/backend/`:

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY=your-api-key-here
PORT=3001
```

## Usage

### 1. Create a Pack

Navigate to the home page and click "Create New Pack". Give it a descriptive name.

### 2. Upload Documents

Click "Upload Documents" and drag-and-drop your PDF files. Recommended documents include:
- Fire Strategy Report
- Architectural Drawings
- Structural Drawings/Report
- MEP Specification
- External Wall Schedule
- Risk Assessment

You can optionally add project metadata (project name, borough, building type, etc.).

### 3. Run Analysis

Once documents are uploaded, click "Run Analysis". The system will:
1. Extract text from PDFs
2. Identify key building information
3. Check for inconsistencies
4. Generate quality findings

### 4. Review Results

The results page shows:
- Summary cards with issue counts by severity
- Full report with detailed findings
- Download options (Markdown, PDF, JSON)

### 5. Butler Library (Optional)

Add reference documents to the Butler Library for enhanced cross-referencing:
- Guidance documents (e.g., BS 9991)
- Best practice examples
- Internal standards

## API Endpoints

### Packs
- `GET /api/packs` - List all packs
- `POST /api/packs` - Create a new pack
- `GET /api/packs/:id` - Get pack details
- `DELETE /api/packs/:id` - Delete a pack
- `POST /api/packs/:id/versions` - Upload documents (create version)
- `GET /api/packs/:packId/versions/:versionId` - Get version details

### Analysis
- `POST /api/packs/:packId/versions/:versionId/analyze` - Start analysis
- `GET /api/packs/:packId/versions/:versionId/analyze/status` - Check status
- `GET /api/packs/:packId/versions/:versionId/report` - Get report content
- `GET /api/packs/:packId/versions/:versionId/report/download/:format` - Download report
- `GET /api/packs/:packId/versions/:versionId/issues` - Get issues
- `GET /api/packs/:packId/versions/:versionId/fields` - Get extracted fields

### Butler Library
- `GET /api/butler` - List reference documents
- `POST /api/butler` - Upload reference document
- `GET /api/butler/:id` - Get document details
- `DELETE /api/butler/:id` - Delete document

## Running Tests

```bash
npm test
```

## Development

### Backend

```bash
cd packages/backend
npm run dev        # Start with hot reload
npm run db:migrate # Run migrations
npm run test       # Run tests
```

### Frontend

```bash
cd packages/frontend
npm run dev   # Start dev server
npm run build # Production build
```

## Disclaimer

This tool is provided for document quality assessment purposes only. It does NOT:
- Assess regulatory compliance
- Replace professional review
- Provide legal or regulatory advice

All findings are AI-generated and should be verified by qualified professionals. The Building Safety Regulator (BSR) is solely responsible for compliance determinations.

## License

MIT

<!-- Deployment trigger: Thu  5 Mar 2026 23:26:24 GMT -->
