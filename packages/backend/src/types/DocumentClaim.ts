export type ApprovedDocumentPart =
  'A' | 'B' | 'C' | 'D' | 'E' | 'F1' | 'F2' |
  'G' | 'H' | 'J' | 'K' | 'L' | 'M' | 'N' |
  'O' | 'P' | 'Q' | 'R' | 'S' | 'T';

export interface DocumentClaim {
  filename: string;
  pageNumber: number;
  sectionHeading: string;
  revision: string;
  approvedDocumentPart: ApprovedDocumentPart;
  claimText: string;
}
