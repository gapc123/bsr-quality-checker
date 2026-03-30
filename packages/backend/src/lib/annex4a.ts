/**
 * annex4a.ts — Layer 2: Application Information Schedule generator bridge
 *
 * Wires the Python bsr_quality_checker/annex4a_generator.py module into the
 * TypeScript Layer 2 pipeline. Converts ClassifiedDocument[] (Layer 1 output)
 * to the JSON input format expected by generate_annex4a_from_json, spawns the
 * Python script, and returns the typed schedule result.
 *
 * Source: CLC Guidance Note 04 / Annex 4A v2.0 (27/01/26)
 *   Three-column schedule: Approved Document part | design entity | submission status
 *   Single primary part per file: GN04 §3.4, p.13
 *   BFLO (B, F, L, O) parts flagged critical for Regulation 38 handover
 */

import { spawn } from 'child_process';
import path from 'path';
import { ClassifiedDocument } from './tierController';
import { ApprovedDocumentPart } from '../types';

// ---------------------------------------------------------------------------
// Types — mirror of the Python annex4a_generator output
// ---------------------------------------------------------------------------

export interface Annex4ARow {
  /** Column 1: Approved Document part label, e.g. "Part A — Structure" */
  approved_document_part: string;
  part_letter: ApprovedDocumentPart | string;
  is_bflo_critical: boolean;
  /** Column 2: Design entity responsible for the file */
  design_entity: string;
  /** Column 3: Submission status */
  submission_status: 'With Application' | 'Approval with Requirements' | 'Unknown' | '';
  is_awr: boolean;
  file_reference: string;
  file_title: string;
  notes: string;
  /** True when no file has been assigned to this Approved Document part */
  flag_missing: boolean;
}

export interface Annex4ASummary {
  total_files: number;
  total_awr_files: number;
  total_with_application: number;
  parts_covered: string[];
  parts_covered_count: number;
  parts_missing: string[];
  parts_missing_count: number;
  bflo_covered: string[];
  bflo_missing: string[];
  bflo_missing_count: number;
  design_entities: string[];
}

export interface Annex4AResult {
  schedule: Annex4ARow[];
  summary: Annex4ASummary;
}

// ---------------------------------------------------------------------------
// Registry entry — Python input format
// ---------------------------------------------------------------------------

interface RegistryEntry {
  file_reference: string;
  file_title: string;
  primary_approved_doc_part: string;
  design_entity: string;
  submission_status: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Layer 1 → Python registry conversion
// ---------------------------------------------------------------------------

/**
 * Convert ClassifiedDocument[] (Layer 1 output from tierController) to the
 * flat registry format expected by generate_annex4a_from_json.
 *
 * Notes on field mapping:
 *   file_reference     — derived from filename stem (no canonical ref in Layer 1)
 *   file_title         — chunks[0].filename (basename of the source PDF)
 *   design_entity      — not available from Layer 1; left blank for manual completion
 *   submission_status  — defaults to "With Application"; callers may override via
 *                        the `statusOverrides` map keyed on filename
 */
export function classifiedToRegistry(
  classified: ClassifiedDocument[],
  statusOverrides: Record<string, string> = {}
): RegistryEntry[] {
  return classified.map((doc, index) => {
    const filename = doc.chunks[0]?.filename ?? `doc-${index}`;
    const stem = path.basename(filename, path.extname(filename));

    // Use a sequential reference if no numeric stem is available
    const fileRef = /^\d/.test(stem) ? stem : String(index + 1).padStart(3, '0');

    return {
      file_reference: fileRef,
      file_title: filename,
      primary_approved_doc_part: doc.part,
      design_entity: '',
      submission_status: statusOverrides[filename] ?? 'With Application',
    };
  });
}

// ---------------------------------------------------------------------------
// Python subprocess runner
// ---------------------------------------------------------------------------

const PYTHON_SCRIPT = path.resolve(
  __dirname,
  '../../../../bsr_quality_checker/annex4a_generator.py'
);

/**
 * Invoke the Python annex4a_generator via subprocess.
 * Passes the registry JSON on stdin; reads the result JSON from stdout.
 */
function runPythonGenerator(registryJson: string): Promise<Annex4AResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [PYTHON_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(
          `annex4a_generator.py exited with code ${code}.\nstderr: ${stderr}`
        ));
        return;
      }

      try {
        const result = JSON.parse(stdout) as Annex4AResult | { error: string };
        if ('error' in result) {
          reject(new Error(`annex4a_generator error: ${result.error}`));
        } else {
          resolve(result);
        }
      } catch (err) {
        reject(new Error(`Failed to parse annex4a_generator output: ${err}\nstdout: ${stdout}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn python3: ${err.message}. Ensure python3 is on PATH.`));
    });

    proc.stdin.write(registryJson);
    proc.stdin.end();
  });
}

// ---------------------------------------------------------------------------
// Public API — Layer 2 entry point
// ---------------------------------------------------------------------------

/**
 * Generate a draft Application Information Schedule (Annex 4A) from the
 * Layer 1 classified document set.
 *
 * @param classified     Output of runTier1() from tierController.ts
 * @param statusOverrides  Optional map of filename → submission status string,
 *                         e.g. { "Sprinkler System Design Specification.pdf": "AWR" }
 *                         Needed because AWR designation is not knowable from
 *                         document content alone — it must be supplied by the
 *                         applicant or captured upstream.
 */
export async function generateAnnex4A(
  classified: ClassifiedDocument[],
  statusOverrides: Record<string, string> = {}
): Promise<Annex4AResult> {
  const registry = classifiedToRegistry(classified, statusOverrides);
  const json = JSON.stringify(registry);

  console.log(
    `[annex4a] Generating schedule for ${registry.length} classified documents`
  );

  const result = await runPythonGenerator(json);

  const { summary } = result;
  console.log(
    `[annex4a] Schedule complete — ` +
    `${summary.parts_covered_count}/${summary.parts_covered_count + summary.parts_missing_count} parts covered, ` +
    `${summary.bflo_missing_count > 0 ? `⚠️ BFLO missing: ${summary.bflo_missing.join(', ')}` : 'BFLO ✓'}`
  );

  return result;
}
