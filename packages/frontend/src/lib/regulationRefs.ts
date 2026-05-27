/**
 * Human-readable labels and URLs for BSR regulation reference IDs.
 * Keyed to the reference_sources values in success_matrix.json.
 */
export const REGULATION_REFS: Record<string, { label: string; shortLabel: string; url?: string }> = {
  bsa_2022_schedule_6:        { label: 'Building Safety Act 2022, Schedule 6', shortLabel: 'BSA 2022 Sch.6', url: 'https://www.legislation.gov.uk/ukpga/2022/30/schedule/6' },
  bsa_2022:                   { label: 'Building Safety Act 2022', shortLabel: 'BSA 2022', url: 'https://www.legislation.gov.uk/ukpga/2022/30' },
  bsr_gateway_2_guidance:     { label: 'BSR Gateway 2 Guidance', shortLabel: 'BSR G2 Guidance', url: 'https://www.gov.uk/guidance/gateway-2-building-control-approval' },
  building_regulations_2010:  { label: 'Building Regulations 2010', shortLabel: 'BR 2010', url: 'https://www.legislation.gov.uk/uksi/2010/2214' },
  approved_document_b:        { label: 'Approved Document B (Fire Safety)', shortLabel: 'ADB', url: 'https://www.gov.uk/government/publications/fire-safety-approved-document-b' },
  approved_document_a:        { label: 'Approved Document A (Structure)', shortLabel: 'ADA', url: 'https://www.gov.uk/government/publications/structure-approved-document-a' },
  bs_9991_2015:               { label: 'BS 9991:2015 — Fire safety in residential buildings', shortLabel: 'BS 9991', url: 'https://www.bsigroup.com' },
  bs_9999_2017:               { label: 'BS 9999:2017 — Fire safety in buildings', shortLabel: 'BS 9999' },
  bs_en_1365:                 { label: 'BS EN 1365 — Fire resistance tests', shortLabel: 'BS EN 1365' },
  hrb_regulations_2023:       { label: 'Higher-Risk Buildings Regulations 2023', shortLabel: 'HRB Regs 2023', url: 'https://www.legislation.gov.uk/uksi/2023/919' },
  fire_safety_act_2021:       { label: 'Fire Safety Act 2021', shortLabel: 'FSA 2021', url: 'https://www.legislation.gov.uk/ukpga/2021/24' },
  fire_safety_order_2005:     { label: 'Regulatory Reform (Fire Safety) Order 2005', shortLabel: 'FSO 2005', url: 'https://www.legislation.gov.uk/uksi/2005/1541' },
};

export function resolveRef(id: string): { label: string; shortLabel: string; url?: string } {
  return REGULATION_REFS[id] ?? { label: id.replace(/_/g, ' '), shortLabel: id };
}
