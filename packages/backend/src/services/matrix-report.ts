/**
 * Matrix-Based Report Generation
 *
 * Compact visual format:
 * - Answer first (Executive Summary with visual stats)
 * - Severity-first ordering with color coding
 * - Condensed findings (key gaps + actions only)
 * - Top 20 actions, not all
 */

import { FullAssessment, AssessmentResult } from './matrix-assessment.js';
import type { ConfidenceLevel } from '../types/confidence.js';
import type {
  EffortLevel,
  CostImpact,
  RejectionLikelihood,
} from '../types/impact.js';
import {
  describeEffortLevel,
  describeCostImpact,
  describeRejectionLikelihood,
  getEffortEmoji,
  getCostImpactEmoji,
  getRejectionEmoji,
} from '../types/impact.js';
import type { SubmissionGate } from '../types/triage.js';
import { analyzeSubmissionGate } from './triage-analyzer.js';

interface ReportData {
  assessment: FullAssessment;
  packName: string;
  versionNumber: number;
  projectName: string | null;
  documentCount: number;
}

/**
 * Format confidence level as a badge for display
 */
function formatConfidenceBadge(level: ConfidenceLevel | undefined): string {
  if (!level) {
    return '[CONFIDENCE: NOT DETERMINED]';
  }

  const badges = {
    'HIGH': '🟢 HIGH CONFIDENCE',
    'MEDIUM': '🟡 MEDIUM CONFIDENCE',
    'REQUIRES_HUMAN_JUDGEMENT': '🔴 REQUIRES HUMAN JUDGEMENT'
  };

  return `[${badges[level]}]`;
}

/**
 * Get short explanation of confidence level
 */
function getConfidenceDescription(level: ConfidenceLevel | undefined): string {
  if (!level) return '';

  const descriptions = {
    'HIGH': 'System determined definitively through document analysis',
    'MEDIUM': 'AI interpretation with reasonable confidence',
    'REQUIRES_HUMAN_JUDGEMENT': 'Requires professional expert judgement'
  };

  return descriptions[level];
}

/**
 * Stage 2: Format effort assessment (prefers new format, falls back to old)
 */
function formatEffort(result: AssessmentResult): string {
  // Prefer new impact assessment
  if (result.effort_assessment) {
    const emoji = getEffortEmoji(result.effort_assessment.level);
    return `${emoji} ${result.effort_assessment.description}`;
  }

  // Fallback to old format
  if (result.timeline_estimate) {
    return result.timeline_estimate.description;
  }

  return 'Unknown';
}

/**
 * Stage 2: Format cost impact (prefers new format, falls back to old)
 */
function formatCostImpact(result: AssessmentResult): string {
  // Prefer new impact assessment
  if (result.cost_impact_assessment) {
    const emoji = getCostImpactEmoji(result.cost_impact_assessment.impact);
    return `${emoji} ${result.cost_impact_assessment.description}`;
  }

  // Fallback to old format
  if (result.cost_estimate) {
    return `£${result.cost_estimate.min.toLocaleString()}-£${result.cost_estimate.max.toLocaleString()}`;
  }

  return 'Unknown';
}

/**
 * Stage 2: Format rejection likelihood (prefers new format, falls back to old)
 */
function formatRejectionLikelihood(result: AssessmentResult): string {
  // Prefer new impact assessment
  if (result.rejection_assessment) {
    const emoji = getRejectionEmoji(result.rejection_assessment.likelihood);
    return `${emoji} ${describeRejectionLikelihood(result.rejection_assessment.likelihood)}`;
  }

  // Fallback to old format
  if (result.rejection_risk) {
    return `${Math.round(result.rejection_risk.probability * 100)}% risk`;
  }

  return 'Unknown';
}

/**
 * Generate markdown report from matrix assessment
 * ENHANCED VERSION with Executive Summary + Issues Register
 */
export function generateMatrixReport(data: ReportData): string {
  const { assessment, packName, projectName, versionNumber, documentCount } = data;

  console.log('[Report Gen] Generating enhanced report with executive summary...');

  // Generate new enhanced sections
  const execSummary = generateExecutiveSummary(assessment, projectName || packName);
  const issuesRegister = generateIssuesRegister(assessment);

  const sections: string[] = [];

  // ============================================
  // PAGE 1: EXECUTIVE SUMMARY
  // ============================================
  sections.push(formatExecutiveSummaryMarkdown(execSummary, projectName || packName, assessment));
  sections.push('\n\n' + '═'.repeat(105) + '\n\n');

  // ============================================
  // PAGE 2-3: ISSUES REGISTER
  // ============================================
  sections.push(formatIssuesRegisterMarkdown(issuesRegister));
  sections.push('\n\n' + '═'.repeat(105) + '\n\n');

  // ============================================
  // LEGACY SECTIONS (kept for compatibility)
  // ============================================
  sections.push('# APPENDIX: Detailed Assessment\n\n');
  sections.push('The following sections provide comprehensive details on all assessment criteria.\n\n');

  const sections2: string[] = [];

  // Calculate stats for legacy sections
  const passResults = assessment.results.filter(r => r.status === 'meets');
  const failResults = assessment.results.filter(r => r.status === 'does_not_meet');
  const partialResults = assessment.results.filter(r => r.status === 'partial');

  const highSeverity = assessment.results.filter(r => r.status !== 'meets' && r.severity === 'high');
  const mediumSeverity = assessment.results.filter(r => r.status !== 'meets' && r.severity === 'medium');
  const lowSeverity = assessment.results.filter(r => r.status !== 'meets' && r.severity === 'low');

  const topActions = getTopActions(assessment.results, 5);
  const riskThemes = getRiskThemes(assessment.results);
  const allActions = consolidateActions(assessment.results).slice(0, 20); // Limit to top 20

  const statusBanner = getStatusBanner(assessment);
  const passPercent = Math.round(passResults.length / assessment.criteria_summary.total_applicable * 100);
  const partialPercent = Math.round(partialResults.length / assessment.criteria_summary.total_applicable * 100);
  const failPercent = Math.round(failResults.length / assessment.criteria_summary.total_applicable * 100);

  // ============================================
  // TITLE PAGE (Legacy - now in appendix)
  // ============================================
  sections2.push(`<div class="title-page">
<img class="title-bg-img" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMSEhUSEhIWFhUXFxoXFxcWFRkYFxkXFxgWFxcaGBcYHyggGBolHRgVITEhJSorLi4uFx8zODMtNyguLisBCgoKDg0OGhAQGy8lHyUtLS0tLS8tLy0tLS0vLS8tLS0tLS0uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAFAQIDBAYAB//EAFIQAAECAwQGBgUIBgYIBwEAAAECEQADIQQSMUEFUWFxgZEGEyKhsfAjMkLB0RRSYnKCorLhByQzU5LxFRZzs8PSNENEVGODo8IlNWSTpNPiF//EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EAC4RAAICAQMCBAYCAgMAAAAAAAABAhEDEiExBEETMjNRFCJhcYGhkcEj0TRC8P/aAAwDAQACEQMRAD8APytPzB6wSraXT34ngmL0jT0s0WFJJ2P3et3RnQGNMdlTxuXlc1COQnIcQPeEOT9pUUpshxRsEW+WqiVg7HryNYlUsZGMS2WOwB+N1PZ/iMTSZqk+qo7WL9w7CRzi1k9yXjfY115sY4h4zcrSqwKsoecVUD7ni7Z9NJA7SVAawXHexPARoskWZuEgsEQ07Yil6Slq9obHoe/GHTJ2oRa3JexITDCRDBNOqIyquEUokORK0NIhvWHVDjM5w6YrRwTDF0h4U8IoDXAgbEcxxh0I3GGA1oaoRIZcJdgERFIjgmJAnZDgnZDsCC5HKTE9yGLGyCwoiuCGXInbZCEQ7EQFEJdie6Ybdh2FENyGlMWCnUIaUw7FRAUQhTE92EKYdiorlENKYs3Ybdh2KivchLsWCmEKYLFRXuwl2LBRCXYdhRXuwl2JyiOuwWKgTZZompcFxucONQJV3JiRSci2OB+CiPwRn3MpV5NU5hnAdnLHGNBY7QFodDkDIA+CTh9mPHTTVo9eUXF0xy0sKjc+HALujkmGrGvD6WHArZI4AxLQO3ZfUyeY7B8YUUqaPm13vZP4oZJEpOZyzPuUtgOAhDrr9b/9r/7RE6EZjmP8wf8AHEaBmMdaaniU3j94QANNNg/hB3lXaVwEPlzVJwURzA4JxVvMcgasdhrxIvK7xHDv2UO4teWe6AKLcvSKxQsdhFTyoOMWZelAfWSRrYuBxpApmp3er90OpR3xxGR4AjwQMOMWskl3IeOL7B6XapasFAb6eOMTiXGdB3vnV1cTgmHy5pHqkjcWA3nMxos77mbwLsHzLhLkVLDpIGkw7lZHHH4wmk9NypExEtRdSwTQigyJ3xssiasyeNp0XLsLdiOTbpSsFc/jhFlIBqC42Q1JPglxa5ImMddia5HXYdioiFIURLchLkFjIoW7ElyFuwWFEJEc0TXYS5BYURNCXIluR12CwIbsIURPdhLsOworlENKItXYTq4LCirchDLi3cjrkPULSUyiEuRcMuGGXD1BpKlyEuRbMuEuQahUVLkJdi2UQ0oh6g0mFAehy84bjECXkqChVGYIcB2cscosOHaGWiaAglVQkEkDMAOW2sI8SMmnse/kgpLckV0ssiVmWZt0pN0i7MCX3pdLcIvWXSMlf7OdLNfZWh+4oV4wM6O9EZdpl9fOvhRKglII7KdVRXfhE1s/RtKPqTSMmUh/wEB9wivGhdGHw2SrQdfM73Y+JSfxQty8Pnfe/wDs90YtfQG2S6yJ4Gq7MUk02UbnCGxaXksSVTBgy0JmjmHPfFLJB8MiWHIuYs2ZTl3O/cSfwwikkBjQbSw5EoHcYxv9a7ZKpOsyTrAK0fdUSO6LNm6cy6BcmYjWzEcklFOEWZmqZhqHEDuCB3mFApSo2VH3Kc1QGs/SqxqwmpSfpApPMpB+9BWRbJU0OiYhe5QV4XzAIez0x2Y/dTTmYckPhUj7TcB2UwqkPQ8qHuKj+GFWNff7r90ckwDGAPv2VPPBMULdopE09Y3bu3bwJIYYOcHHc5gkpGZFNZw4FTJHAGFbPvx7yyRygBMyh0kuyFpgKpb443RkaeMaOw25MxIXLXyNd1MIfabKmYllB9uOXzqJ4RkbXoudZVdZZy6c0j1Ts2HZCtrkvSpcfwbyTpKYKEvsPvOMW5WmB7SOI+EZTQ2nJdoDHszBik0c54wXu/zy4a40U5LuZPGn2NBJt0pXtNvp34RbSh6hiIyl3zmecOQtQwJB2GLWZ9yHiXY1XVQhlwCk6Wmpzvbx5MXZOnAfWQRtFe4xayoh4mXzLjurh1ktKJlEmoyIY/nwiwZUVqJ0lXq47q4s9XDSiHYqK/VwlyLFyEMuHYqK9yOuxPcjrsFhRBcjrkT3Y5oLAhuQnVxPHMILGVzKhvVxb6uEKINQ9JUMuGGXFwohpTD1Co8ybzywMVtLK9DNb92rw8+Xizk3vbexippb9jMb5in5Zx5MeT25+Vmo6KoaypABZyzFhhz5QdCy9DTlnWuXjWAnRhP6unABy3LL4QYKd/Fw2HLxjik/mZ2wXyoH2bo8JwXOC1JUZs0Fmq0xTOWvd+UV7NYrSVzJUucfRNiXBcrHtBTYCNT0cS8g/wBtO/vVRW0KP1u1/Y/FMj1IpOKtHiSk1J0+4Bl2yem0y7PPuKCwolkuWAU1SwxSctUX52hrMv1rPLJLeyAcdYrFbTY/8Us/9ir/ABNcFgMdVDXft98cWf5Z/Lseh03z4/m3MVpbo5o5K7ipa0KYF0Xl444hRGVIoS+gVnm3jItDlLOCgkg4gFiLp3iPRbNIlq6y+EkOn1g/sjXGd6LkdbbbtEiaw1AC8AAMqRq9SxqabMVpllcHFUZtXQ63yaybSVbBNVq+apkwiF6UkjtJvb5R/FJ+Meijdnjn+cPQ2VKGM11MjSXSQ7HnKelM5B9LZuMtYB/hUCrvixK6Y2cntiZLP05Z8e2rwjRacts1C+xLTMl3Q4Ui9XOpUKc4g0XYrNbJXWTLPLS6lDsuHCSwLi6drRu8rUVJrY51gUpOMXuvoQWfTdnmNdnyycnUAf8AqEn7sX6KFWKTrqPvkDkIE6V6H2CWAohSAokdkFTc0kwFX0Qlitmt/VKySSUF+bw1li/f+CXgmnW1/cu6c6NBXpZRKVCrh3HcAod4iHRHSRSCJVqDHBK8QdtaHxhv9FaXki8ibLnAa1JUf+oH5GBxnzp5Mu1yEILFQUCQVVABAcg44hmzxhqUezG4Se0lv7m9SygCkuDmKk8cBDinZyNOJjC2LSE6xFlPMkHXlvHvjRWfpVY5hYT0pIoQsEMdjgI74tO+DKUXF0ws388hHed8JZ7TLmAFExK/qqCzwA7IiUDns7SvgIZI2WopLgsRWmUHLDpygE3de+I98BAMhyHvMcngfwiGnQmkzapmONkJGVsVvVK9UunMF2J2DF4OI0xJYFSil8iC/c4jVSTMnFovhoRQiqNJSP3qOJbxieTaJavVmy/40/GKtE7ilEJciwJeog7i8KmWYNQUVrkNuRaKdkNuCHqCiuUQ0y4tXIS5BqCiAbo5xE9yEMuCw3IrohqpcS3IaRAM8jA/k/gcvyitphI6mYxfsHfg0W0lssdeH5edkVNMUs8z6hxryMedHk9eb2ZrOiyf1dJGLnBNcNeHCDBHCuZ2jlvgT0WU9mRjmzlsvONYMheFeQfNNXy3nGOKXmZ2RvSiDRuk0JQpHWgKE2a6SoA1mqMRaGmvPtJvYlLVxF+a2+NNI0ZJmS0lcpCiRW8hJPGkQzei9lP+pA+qVJ/CRHqxeyPDmvmZibRMP9KSnJ/ZKx3LweNKkDHdUnaYztssKZGlJKUqVd6uYQFKvNRsVRoEJfuqePl44up856PR+l+RZA/ab0/gGuM50QS8y26+vO7FcaVOjLQoKXJmSrpYELSrEAVBBNIzPRRBTMtoVRXWuQkk1YktQFqnLnGsvRX4MYb9Q/yadSK114cPCGlOvbTlHAmuQfZq5N3bxCCYWoGoal6xxs70q4ILUhwt9nhAfoP/AKKP7Rf4oJ2q2y0lSVTEhRALEtk0DehNLMNYmTA32g8dWX0YnHh/5EvyGZllTNISsOGVQ1zTwgKvQsvrLSgOBLKLrEhr6Co4bY0MgekT9VXiiKSf9Itv/J/ujGvTeRGHV+qwd0ODWfaZijxYEmBnTJCUTUEJAJRUgAEsSz64LdEW+Tn66stiYC9PT6SV9Q+Pnnz5X6r/ACd8PSj9kZ7SFoIlqo7sGUHHaIBpx857DRnRKxTLPL6yQlSlJSpSqhRJSHYpIYbBGGtjdX9pH40+ePP1LQ4eRKH0Btyhzk0lRMYxlJpo88tfR7RvWKSDaJKkEgkLStIYtQKJURjlFuwdHLQoKNj0oshLOmdLWGeoBCi3G7F3T9hTfmlsRXeRN+Agl0JTdXak0YGT3y3jom3GOpM4oVOeloDTJOmpNDLkWhIxukD7vY8IarpTaJZ/WdHTkt7SUlSdrAC73xb6Zp/WFLGKZUghgH7U9aFMccI3JVXLGIeZxSbNI4IybS2owVj6c2KYazCg/wDESSeAS4EGbLpKRN9SbLU+paVLPB6QvS8S0y0qXIlTAylKEyUFnsJvFqhjjWsDrd0Q0eqzieqz3HlhZEpak4gEsHY46otZlSbXJD6d20nwEp1kzSC/zXrls3xBdUMgnfTxjMWLQ0sqSiy6QtUgqLJQshaSTgGQrvPGCdisNslTSi0zUTUXSUqEtMsuCkdpTB6GgcmhdqPqppuu5i8bS1dgkwzL7oklrV7AI3QgO1A3dr4wpY4rUdw+J90WQTi1zRjOWNy1e4xInS84YTZh3qfxiGXIP7tW84eEPKSPaSncfg8FiotI01af3nNKfeI0+h9LonC6WTM+bkdqfhGLKE5rJ3D4mHy0EEFCFEioO3XQQ7Bo9EKIQpgRoPTt5pc8BKqAKcMrYQcDhv2ZnyBDsVFYoiNaItoZojmAQ9QaTxeWOFcg4PDz4RW02ofJ5rfMOBcYQ8zUj2gNxfu4xQ0zaEdRMYubpwBGT5xxRuz05VpZtei7dQj1cSdeWN3LfBpCyW9Y12AVI5+EA+jNpSmxoWSWJVkHpjmzwURbZZISxwdzhiMhidkccoyUmdcZxaQTs3Sqzy0hC76btHUlhTMOXaLUrpTZFYThyPuEB0WtLUUA1GAUTRxxjrROQqqiCM7wH0cs8Dk0dS6hpeU4ZdIm9pAnSlrQvSslSFgjqpld42wbSkbd5woTVvyirIlSkkqQJSTrASDic6c4spmBhUnDCnnxjHLPXK6OjDj8OOm7NDoYeh4nLYIwugAflFuanphr+Zq/OCU2yS1G8SQqmCyDqwBbD4xHYtGS5V8oCiZhvKJYuRTYDjFyyLw9JnDDLxte1F4M9alxuw3U8tDVAtWmxzDyDur7vP5QgUKU2d8YWddBmwSkqsynSCO0zjYMjGK6HBpBAH+umimxdIOi32lAKECSUfTKwqorgGgZoCyKkSri2JK1rdOHbN7OOick8SVnJjhJZm623DujdFS57iaFUDi6tSWL60kd7xYmdEZTqUidPQVNeIWFPdoHvpLsIpWPS3yckmWpd75rU4Z8Iuf1vlZybQNvVEjnGuCSUErMOpg3kboyPRUHqlhx2Z81OGSVXcMqCA36Qf2kn6ivGDvRlJTLmXgRenzlpBDOlS3BrvgB+kANNk/UPiPPwjB+o/ydML8NfZGYtifR8U/iT5819P0Ko9TK+qO7z38/MLb+zOOKfxJj0/Q37GX9UfDz5dZeEXi8z+3+wZpexzFTF+hmsS79TMukMsOFAXSDeGeUM6Jn01rG2TzEpi+qoMeq6PPokfUT4CPPJP8A5hb/AK8s/dIjoyv/ABnFgX+b+TPdMpautnKIN02azMWo6bWskDJwG4RtVY8YodL7LLOjJswoSVpmIAXdF4C8il7ECppti+ffHPk8sTqxeeZn+l6fQkfQnf3S4nml9Ht/6Yf3aYv6U0cmdZp5JIMqUtaWu17BBBcGjFqEGItCWPrrNJlOBfkoS5DistOTgnnDXlj9yX55/YxeiZbLs5bC0JH3ZkaHpfpJUnqms6pz36pbstcyUQ7v3RPpfosuxqs6itKwq1SxRwQSF5Ngz56oDfpQl0s9c5mH/LjeXqxObH6Mr9yknpU3rWS0j6siUr/viQdNJeCpFv8A/ZAHcs+EALJYL9mnTrygZZADEsxDnvjWiVF5MjgGHDHJfYqDpZZM5c8fXlTC38KYd/XiwpH7QDfIne9JgToIL68hcxagRMYFRIF1SGpuMaAjzX4iJnm0umiodNrVpldHTywn/am3SVp72ES/1usKv9ovb1hPi8CLXfFoT2+wpYTcupZriTixOJi3pOyp6tV0JBoxugs5GuG8tNKuSVgtN3wX/wCsFjymyftTk/ERpuj3Tmzhpc20SSjBKhNBKdhqXGG7w8lKVOoFMo3SKmSjPhBeXouUUBQlIBKQVMkCpD5Ro5aeTOOPVwe82VaFpCkKCgahSS4IPaBBGIIILwk5NYZo+SEJuJJZN1I3BCAIdaCxxOEWZHgUtA+aOBPgSdXjFPS5aTMp7BxSNTeyAMIlFpyYZCrjHbw7tkUtMTT1C2f1MHf2rvDzlGR0t7M23RRRNmAKqXjiss9cNRfLODctIOLUOonMU1fZjI6GtsyXZApKsFpHqByFzkSzUuAGUabtUa1N58DyADOMwcO+OVqm2dcXaS+xj9IaVnSpikoKroJIAKQPWWAwUgtRELK0xOVLBdTEBwbjh7wxCA/qjnEOl/2qyfifXtEP0QXRsuy/8SOyMVXB585yUnTfJYsumVqnypcwpCCVFV4XWZK27SVAYjVqg1Ot99E1UlLiUlKlnBr5LFKVVOBPDPCMzNkE2ySlOaVf4hxILYQR/oqZiAagAtRwxLHCj/lGU4xUjfFKbgY3TGk5yZhUFzAGBLTCMdiaZiOsPThaE3TfUdalEnmXgnpzRawCShVUoANDUqTRw9e+MemRj2XpTYXFdtHHGNo8HLPzOzY2Pp8tRLIWWGS0jH7Bi3//AEO6WV1gP1gfhGa6K2ArXMCQ7JBoNu6O0xohp/bBCWSTRiRmz8axPMmiqqKka6zfpAStQSkzCo4ASws/i90afRWlZk5AWgpUHIIVQgpZwwpQxgv0f2VKdISrobszN/s5xp+i9nWZDIVdu2macHvBM0liKUJoa1FKROSMUuEaYZycqt8e5oF2+4AZoSmrDthqM9TCy9MyzgpFDlMBxiabKTPmutKa3iwZgXQKDnzMB7RotAm2pNWlqkhNcL6HPeYzjgjJWbT6mcHXIXlW0EOASzuQXFGwOecZH9IE0XpCjR0r30Un4wQ6Ko9ASa+kU+9kO744n84CfpApMlZdlXinz5c5qCUqNXNuFmftc9Nw70/iEep6EmDqJQzKAeG+PIrUvsGuo8iI9Y6OK/V5RPzde0wZIJpWGPI7dFsolu9AddQcWOG2EssmUhalpYKW14lVTdoHc5RjNK2+Z8qmpC1NfLdtQxIyBbGJbHpSbLmT0ElbIl3QrtMVJvFnzJVuoIbwOuSY9TFyrTubDSstM6WqSuaQhTEoC0gOC4Na5DlFxCwQ4IO4giPFunSyJpmoUVAlgVBiQCWJGRZoE6H0jaSVITMKbtWGGNYvwLjuzP4ipOonvtqUsy5ktAT6VCkEqegUGcNnEehnkIlAgKVKSkanKQBwwjxzo3pi32ifKkiaUCYSApQ7PZCiWYOfUI3x6Dom3ldk6/rFhSZEuapJUK9YlSuzeSXa7XU4iZYnFJX+hxzRk23H9mn6S2xdqTISJJTctEuYSVpIupe8zF84zfT7R5mpkdr1SvvCfhEVj6VFRQLlFrQgFxitdx8Mi54Rb6VrN2WL10kqLsMKND+ZTTkCUHjccZnpOhpsuxWm6UFJF5WLi6k4QUSrbl5zimbVM6lcvrhcmC6oFCXZiDV6YmJ5NpDBzlr1cYWealVGnS45QvUDbFZ1InIJAAaZUKckkoOF0N3wTJ2xSRa0FQV1yCE3qAN6zYm8dQiz8tlfOTz/ACiMqcpWkaYZKMabX8gy3yF9fLmN2esRV64JThvEErYCpCgmpo1RViIrWieFlPpE3UqSpmqWIOLt3RLPtbMygDtwNM4qT8v0IgnU/q2BFaPm+keWReAzSWZ8awWsy/RIevYSHGHqjnHC1rUKKl7aH4xFIVdQEuGAAejUDZ7o1yzTqjHBilG9SPabKognahCqmjm8nwSmFnkviO74xipGnLR2WmKHZQDRGamGX1ornTloOM1Z5e6NPEObQeaBTH7Se7b57jFXSYHUrw9Q6x7UWELc4n1vOPnvitbiOqV9U+MBp2D1npYhX25ftH/eUYD3xtFpY0YDF721PL62MY6zq/UcvXln/wCSny8bpSajDH4VH+bCOSf9s7cf9IyFusi1TFlKCpIeqQ4YLtDndUV2wmhyBLP1JPeJhMHjogFSj1pDkksCMe1kae+GDQgc+lL4OynYGlLz5mkdMcsUjingyNvYCyD+vSMqK1fNm5mkGEaa7cxASewQkG8zgpCsGpieQh8jQqUzZc4zSShykVbtApOKjrxgLJBE+cGU5UkjsmoIYHmDyhXGc7+hTWTFjpc2G9MrC7KkjOdKOOZug++PPLRZ1S1FCmcULKBHNJIj0XTKSLMgHETJD7CLgaMPYdHmeFrNokyyC5E1dxSiakpDV/ONcflOfJ52Xv0dp/WZ9H7CdeRTqhOm6WtVPmJwp87bD/0ej9ZnfUHimJOllmC7alBWiWDLT25hZKWvntFIOpt5EQvVZtL0F9/9lfoJIJtstYHZSFJJpQrDpDbbquUHNAaRlykXFOSqdaGaoAEw7c/dWBHRGX1ekUSxMStNTeQXQogJYgkA0vKHOJrNZyShQST6e0poHqVqIFOMVNJ1ZlibTbjzX9o3GipgUpKkgsUrZ9ikDnQxSttbRbasAqzkndJLd7Qyzyl9XLAmGWReelaqdsRTzkYarRkwqUTPJKwL5uPeuDsv2qsPLREZxiqNsmOc3dexU6Kk9QR/xFfhQ/u/KAP6Qj25H1VeKfPwwjWaN0f1CSm85Kir1QGJYMGyp5MZD9ItFyPqq8Uxjdzs6arGk/oZi0n0Z4eI8+Wj1To5/o8s/RPidW7zl5VPPozu8+f5R6toAPIlD6J2+0rz5o59icfLMfpBBNrnHILSNxLEeB5QXsK0ItVqVMAKQiTUh27ITqgnO0QlSiSQCo3j2Ril7r7q47drDrfYEp64hRXMUlF5IYm6hQIoK5Hlui3NSWkyWKUJub43KnTnR0uZZETEI7V9YJSDgOpOH2lc4zPQTR6FWmYkhx1JLPmFpjZdJ0FNgQHuvNU52K6rHgID9GLCiTb1IROROT1D30AgHtooyg7iLdLG6Mo28qsG9EENpCzACgmkbALqxwxjS6MtCP6NSi8HFlYhw4PUvhuPfATQplybXZpiZ6VKXPKZkoBQUhIUWckMXYGkVrAVFCE0CVSkJqcSqX1YAGZN3CKmkxYpOLdE2j5rS5ZzTOkn7xUPER3T63LVLQoFyCdftXR74cnRqk0vlgpKikoAqlmzpC6QC3lqQWKVhWLYXS1MizcYltaky4xkoNAzRdi6yxzpyyoLRk5DdkGo5xohN7N2lQljVwwq3azo7vgIGzbRNKbQm7L9OpSlVV2bwZh+cVpk1RXKuktR2woRXlCnTqisVxu/oYvTMm5MoSHvHHMKUPhExsf6p1zm9ebH6Ta4saalhawHQmsztLU2CsH4xaSH0WT9Mf3g2w3wjOG7f2YO6OyDMmFySEql4nXMSKjOkbjSEsCQoBISQlZdOJ7IZ8qMajXGW6MICJi0OlV0oN9BcEFcsgAlnZjxJg5IKphmpBJCwSh/ml6s7gdpPMQTW5WJ0n/7sBbHOWpQTeIqXIUoYIfW2MaKyqeUnakE5u+NTjFKz6NVLN4XMM3OIbwixLTdQlJLkBtlGglT4HjUk9zVSdIpYEt6qM80lzzcQ1FqQ2I/lTVAauCkFJBIZTE+sQ/ZJH8ofLjJP3LUE1YAROL8T4ecfjFe2qeWrH1TByWZRIeWjL2U+4xKZNnUkhUtB2Xcn2HdD8VFPCx9hX+oivtyqOP34O989Ub1ZIulyyqgjVeumjYuMDSMtodMuZds90CX6xCUqSXT2wUqTX1kgxoJcmQhV1XykpCQRRcyhUos6iSA4dmau2MtpbLk0TcN3xsS9cGclXI1oNfv4RBb9JCWgqqTgMW9bbVu+JZtvsSKBE1dHdQu5YVY8hAa16esywErkAJxDhZL4vjXfESTjyhT6rGjM/04s2+QVrUUE3CCeyy2ThhQkH7Mb+y9VedJS7MWOW1soAplSHSpMiSWIIWAgsX21BxgmNJKQHT2S7G6kDh2RCfWx06aZxeIteosads65koBAKvSS8A9AUvhqjHHohbP93mcmjWqtylqIUqYWDuDe3gDHuiFdpJDp7Ww0NK5ikJdc4qlH9kTalJsD9EdFTrNapvXSlJCpYYqHZNQMcDnTZE/SXo/OtE4TJYSU3EpfrECod8SDmIISbSpWKbowx+FInIBIBPMRk+ukp6tP7L13DQAujmgJtntcubMCQlN4EhaVM7EUSTqi5Z7NMQhgASLRMmDteysq9xaCgSGY+MRpSAS1DnXl4xM+uyy7ImLcHaAHRmTPRaZqprFExIrfCnWkhmY6iqNam0AhvPd54wNmMWBUQMcWOYxMSyZdHDkDGoLZ1q+rnCfV5ZqqRWPK4SbL0qeCoPSin2MkkbqhuLRjP0kWSYtcgyZUyYAFuUIUpqoZ7oLZ8o0yS7Bjjdzxx1PDkpqe0QxqwUaUr6tRXx1RePNl50GkuobVM8tVoy1KQQLLaDqazzP8seoaJsNoNlQhMuZLmXXBIZiF3iCDrDjiIkK7puk1dk3mF58AHZ4ojTCQq6ykkFsGq4F3HFyOYjbx780WvwJZmg4dE2pibqQWpeUkbs/PhmrB0RtaLWbRMm2cJKClTzVXi9cLrYscYkOn5ayzuHZzUZ4RKbZKoxS+oUIo+AjXFOCe139UPJmeRU0EtJ6MkTpIkzbXLSAsqdAKzgA2WqM+Oj8qyzBMs06ZMJSUEdUAGJBdyoatRi9P0rJSbqprEZEqGLYE0OI5xJKt6FNdWiuHaBeOivlpGbk7vuZmR0dlS5qZx68qC747IYF3qEh++GW3Q0goSm/MF26zgg9l2xTtMbFxmQeAbhSIpyxkkcvhGbxSb8zIp+5lVoTdKQuhBwNQ+qHKl3gEnLPXtfX8I0C5N72RxSfG9FVehwagoHD+cDwy/7Bc1wwKuzJwvHVl8IikWeXLQZalkpKSkVALFji2NIMHo++SPAxEro2n93yP5w1iku47k+WBrfYLLMTLSZY7AIKgSFKKiC62NTQaojlWGzCWZRU0t3udsh3BoUl8a45QXmdGQXcKD/ThZPRqWnEnir84rw33YfYC2aw2SWSUEy3Z1G8yhRSWvKPc22H2iXJUoTDNFBdBD4ABOAGwQcOiJIZ0Sy2uvjEyEpT6qUjcBD8P6k19QMiSFUC8tR8WiROjFOMMdkGet2t52R3XbR3/CDwku47l7sE/JFFig3WcAUyJGcMVo9ftEk6yrjlF+VOASHPzvxKhybWnX3CCONNWDTb5M0lR8/zh5w/J89xjnFDi20nnWHApJ9U4efZjio9awr0aB69INGvVb6CsrsH9M6PmrmBUomiAMbpJvLrgH3wB0NN6uamYULCQMWapSoDUKv3wf0o8+4uVOQGSxvXkvUnBiDjsisclGe7MM84vHV7g2ZKtaPWCiNovCIhbDhMkJVwYxbULYjAKI/4Zv8Ach2irN0tMdpgO5Qc8jHanfBwiFFnViiYjcyhsoYk+RywQqXaFA/SCh4Foi+XoNDLHK74NHCdLPskfa90Jwi+UKieemeR2JsraR6x5t4wqRNcEhhmAArkztzioQl/f5aHJuP63EkgfCMpdNjfYVHWnSc2UpfobwxSxG9zWgfjjER6QzAlKpiVJSqgIqnDMltgi0VzB6qyr6pveBhZVrXW8Uy/rYnYUpF597RPwmP2KQMHSxmCnDYkgv8AR5Z4Zxbm6bCkAJUgXqhbsSKggdoAVBIfVlnbTKkKLm6o5ky0p5llKO94mRoSRilEsVwCb22l8qbEwfCwT2Q017AWVallr5KjSoPZbBJBFOfzqjU1QnLvITfqGvMoXQWUzoGpKXalOEaA6JV7MxtbU4MABEX9DEe0/nYTFxwxiFr2AMhdqlgETSTeCiFFxgCmh1bu8RZ+UzkqvIID+s1cGudpnWzEG9i4gqbAoZCJU2QjFhvPujXShbewC0au0JSZa5ilBgErCR1iCPmk40pXviyo2gsQs4BwUsHBvFTJI7T50wwqYKpkgYnlD6QaYiAatEhalKIoSSEghg+WBpF4aNBABFAG3jbkeUX+vH8oei8rBJbzrg0r2HZRGipeYTuLNwEWUWWWAzJbIBIiz8n1g8/hDbyR7MOgs6WUgMMNlPCJRMGyIzO2COM5W6ARIS/8vjEapSvnAb2PvhpUTn3whG33wwGrs68po4CK6rPMPtvzgiLM2LjYaHiMRyh4QnX3H3xlLqMceWAKFjX5eFFhXqgopAfGGqkIOJV/ER4Ri+uxCsGmyKGJTzhhkfTHAH4QQFklaid61H3wvyeV+7B3vnvhPr8fZMLBa5I+d3GIOqSCO0PPGC5TLTUoSN6U8xR4rW+1y0y13UpcoLXQlySKYVJrC+OT2URKSsDyEJuIJmM6UqbUVpCyOZMSokIyKz9g/CCujJ6kyJSbvqy0AnNwkDCurCLPXE+y/KJ+Op6a/YatxBZ5KadUltV0E5YxYphdA4R0dHI2K2Iu6MWYkUJHAj4RDNWUmiElIzGI3gfDGOjoiwHKXgbocahhTW9RHJnKUzgKDeqSFdywR/KOjoFzsO2Rz7FJUe3LCXzQSgjABm7L70wMm6GD+imKLjs3ksHowKgWfHVhHR0bR6jItrC96KIs08LEsoJVi2wYk6gGxwDRbkmX7Sr51Joj+LFWeDDUY6Oj08U9cFJ9y3yEJM6WzXUtqAbmcVcXiYSZJ2blU7jHR0aUId8kRkeYSW7niNNkTldJ2Ok8nMdHQgHiSfpcwR7ocEtm8dHQARrUdcQFcdHQAJeiGZMORO/VqrHR0MZd0clsVF9rxeM8YAx0dCYiJTa3iqpbn3QkdAhimZCX9dISOhiG2q2BCSa8o7oxpZ1TesdLgJSpIqja2JBwLatsdHQNWgL02TMAKxdUnNSVFSRx9nLECIGCkgkp1hzh3x0dHkdTgjBrSJoVQIDqPFKXGrEP3xGlNfWVXUw92PGOjo472syfI+YBnfI2KJfvhXAGAIzccNcLHQ72CyMBLumWK5gAHvxhEDHs/h9za846OhWAmLsphgADXlgIRSh7VTtP5R0dGsYpsVn/2Q==" alt="Modern residential buildings"/>
<div class="title-overlay"></div>
<div class="title-content">
<div class="title-badge">GATEWAY 2</div>
<h1 class="title-main">Quality Assessment Report</h1>
<div class="title-project">${projectName || packName}</div>
<div class="title-meta">Version ${versionNumber} | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

<div class="title-stats">
<div class="title-stat ${statusBanner.statusClass}">
<div class="stat-big">${statusBanner.headline}</div>
<div class="stat-label">Overall Status</div>
</div>
</div>

<div class="title-donut">
<svg viewBox="0 0 100 100" class="donut-chart">
<circle class="donut-bg" cx="50" cy="50" r="40"/>
<circle class="donut-pass" cx="50" cy="50" r="40" stroke-dasharray="${passPercent * 2.51} 251" transform="rotate(-90 50 50)"/>
<circle class="donut-partial" cx="50" cy="50" r="40" stroke-dasharray="${partialPercent * 2.51} 251" transform="rotate(${-90 + passPercent * 3.6} 50 50)"/>
<circle class="donut-fail" cx="50" cy="50" r="40" stroke-dasharray="${failPercent * 2.51} 251" transform="rotate(${-90 + (passPercent + partialPercent) * 3.6} 50 50)"/>
<text x="50" y="45" class="donut-number">${assessment.criteria_summary.total_applicable}</text>
<text x="50" y="58" class="donut-label">criteria</text>
</svg>
<div class="donut-legend">
<div class="legend-row"><span class="dot pass"></span> ${passResults.length} Pass</div>
<div class="legend-row"><span class="dot partial"></span> ${partialResults.length} Partial</div>
<div class="legend-row"><span class="dot fail"></span> ${failResults.length} Fail</div>
</div>
</div>

<div class="title-footer">
<div>BSR Quality Checker</div>
<div class="footer-sub">Building Safety Act 2022 Compliance Assessment</div>
</div>
</div>
</div>

<div class="page-break"></div>

## Executive Summary

<div class="${statusBanner.boxClass}">
<div class="status-headline">${statusBanner.icon} ${statusBanner.headline}</div>
${statusBanner.description}
</div>

### Results at a Glance

| Outcome | Count | | Severity | Count |
|---------|:-----:|---|----------|:-----:|
| <span class="badge pass">PASS</span> | ${passResults.length} | | <span class="sev-high">HIGH</span> | ${highSeverity.length} |
| <span class="badge partial">PARTIAL</span> | ${partialResults.length} | | <span class="sev-med">MEDIUM</span> | ${mediumSeverity.length} |
| <span class="badge fail">FAIL</span> | ${failResults.length} | | <span class="sev-low">LOW</span> | ${lowSeverity.length} |
| **Total** | **${assessment.criteria_summary.total_applicable}** | | | |

## Top 5 Priority Actions

| # | Action | Owner | Effort |
|:-:|--------|-------|:------:|
${topActions.map((a, i) => `| ${i + 1} | ${a.action} | ${a.owner} | ${effortBadge(a.effort)} |`).join('\n')}

---

`);

  // ============================================
  // MATRIX OVERVIEW (Compact Table)
  // ============================================
  sections2.push(`## Criteria Matrix

| ID | Criterion | Result | Severity |
|:---|-----------|:------:|:--------:|
${assessment.results.map(r =>
  `| ${r.matrix_id} | ${r.matrix_title} | ${statusBadge(r.status)} | ${r.status !== 'meets' ? sevBadge(r.severity) : '-'} |`
).join('\n')}

---

`);

  // ============================================
  // RISK THEMES (Visual Summary)
  // ============================================
  sections2.push(`## Risk Themes

| Category | Issues | Impact |
|----------|:------:|--------|
${riskThemes.slice(0, 5).map(t =>
  `| **${t.theme}** | ${t.fails > 0 ? `<span class="fail-count">${t.fails} fail</span>` : ''} ${t.partials > 0 ? `<span class="partial-count">${t.partials} partial</span>` : ''} | ${t.impact} |`
).join('\n')}

---

`);

  // ============================================
  // HIGH SEVERITY FINDINGS (Compact Cards)
  // ============================================
  if (highSeverity.length > 0) {
    sections2.push(`## High Severity Issues

<div class="severity-section high">

${highSeverity.map(r => formatFindingCompact(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // MEDIUM SEVERITY FINDINGS
  // ============================================
  if (mediumSeverity.length > 0) {
    sections2.push(`## Medium Severity Issues

<div class="severity-section medium">

${mediumSeverity.map(r => formatFindingCompact(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // LOW SEVERITY FINDINGS
  // ============================================
  if (lowSeverity.length > 0) {
    sections2.push(`## Low Severity Issues

<div class="severity-section low">

${lowSeverity.map(r => formatFindingCompact(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // PASSED CRITERIA - How Compliance Was Demonstrated
  // ============================================
  if (passResults.length > 0) {
    sections2.push(`## Compliance Demonstrated

The following criteria were successfully met. Each shows how your submission demonstrates compliance with BSR requirements.

<div class="compliance-section">

${passResults.map(r => formatPassedCriterion(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // CONSOLIDATED ACTION PLAN (Top 20)
  // ============================================
  sections2.push(`## Action Plan (Top 20 Priority Actions)

| # | Action | Criterion | Owner | Effort |
|:-:|--------|:---------:|-------|:------:|
${allActions.map((a, i) =>
  `| ${i + 1} | ${a.action} | ${a.criterion} | ${a.owner} | ${effortBadge(a.effort)} |`
).join('\n')}

---

`);

  // ============================================
  // METHODOLOGY
  // ============================================
  sections2.push(`## Assessment Methodology

<div class="methodology-section">

<div class="algorithm-header">
<div class="algorithm-badge">THE ALGORITHM</div>
<h3 class="algorithm-title">How This Report Was Generated</h3>
</div>

<p class="algorithm-intro">This quality assessment uses a <strong>Regulatory Success Matrix</strong> - a structured framework of ${assessment.criteria_summary.total_applicable} criteria derived from Building Safety Act 2022 requirements and BSR review patterns.</p>

<div class="methodology-grid">

<div class="method-card">
<div class="method-icon">1</div>
<div class="method-title">Document Analysis</div>
<div class="method-desc">Each uploaded document is parsed, classified by type (fire strategy, structural calculations, etc.), and indexed for cross-referencing.</div>
</div>

<div class="method-card">
<div class="method-icon">2</div>
<div class="method-title">Criteria Assessment</div>
<div class="method-desc">AI evaluates each matrix criterion against your document corpus, identifying specific evidence or gaps with direct document citations.</div>
</div>

<div class="method-card">
<div class="method-icon">3</div>
<div class="method-title">Severity Classification</div>
<div class="method-desc">Issues are classified as High (likely to cause rejection), Medium (may trigger queries), or Low (recommended improvements).</div>
</div>

<div class="method-card">
<div class="method-icon">4</div>
<div class="method-title">Action Prioritisation</div>
<div class="method-desc">Actions are ranked by impact and effort, helping teams focus on the most critical improvements first.</div>
</div>

</div>

### Quality Indicators

| Indicator | Value | Meaning |
|-----------|:-----:|---------|
| **Reference Anchor Rate** | ${assessment.guardrail_stats.reference_anchor_rate.toFixed(0)}% | Percentage of findings backed by specific document citations |
| **Corpus-Backed Criteria** | ${assessment.guardrail_stats.corpus_backed_criteria}/${assessment.criteria_summary.total_applicable} | Criteria with evidence found in your documents |
| **Documents Analysed** | ${data.documentCount} | Number of documents included in this assessment |

A higher reference anchor rate indicates greater confidence in findings. Rates above 80% suggest well-documented assessments.

</div>

---

`);

  // ============================================
  // FOOTER
  // ============================================
  sections2.push(`## Report Information

| | |
|---|---|
| **Assessment confidence** | ${assessment.guardrail_stats.reference_anchor_rate >= 90 ? 'High' : 'Moderate'} (${assessment.guardrail_stats.reference_anchor_rate.toFixed(0)}% reference anchor rate) |
| **Methodology** | AI-assisted assessment against ${assessment.criteria_summary.total_applicable}-criteria Regulatory Success Matrix |
| **Regulatory basis** | Building Safety Act 2022, HRB Procedures Regulations 2023, Approved Document B |

<div class="disclaimer">
This report assesses submission quality against regulatory success criteria. It does not determine compliance, replace professional review, or guarantee approval. Final decisions rest with the Building Safety Regulator.
</div>

*Generated by BSR Quality Checker*
`);

  // Combine new executive summary + issues register with legacy sections
  const fullReport = [...sections, ...sections2].join('\n').replace(/\u2014/g, '-');

  console.log('[Report Gen] Enhanced report generated successfully');
  return fullReport;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFindingCompact(result: AssessmentResult): string {
  const gaps = result.gaps_identified.slice(0, 2);
  const topAction = result.actions_required[0];

  // Enhanced format aligning with BSR compliance narrative:
  // 1. IDENTIFY the requirement (success_definition)
  // 2. CLARIFY the standard (reference_evidence)
  // 3. JUSTIFY with evidence from submission or explain gap
  // 4. ADDRESS with action
  return `<div class="finding ${result.severity}">
<div class="finding-header">
<span class="finding-id">${result.matrix_id}</span>
<span class="finding-title">${result.matrix_title}</span>
${statusBadge(result.status)}
${formatConfidenceBadge(result.confidence?.level)}
</div>

<div class="requirement-box">
<strong>BSR Requirement:</strong> ${truncateText(result.success_definition, 200)}
</div>

${result.reference_evidence.found ? `<div class="reference-box">
<strong>Regulatory Reference:</strong> ${result.reference_evidence.doc_title || 'Building Regulations'}
${result.reference_evidence.quote ? `<blockquote>"${truncateText(result.reference_evidence.quote, 150)}"</blockquote>` : ''}
</div>` : ''}

<div class="assessment-box">
<strong>Assessment:</strong> ${result.reasoning}
</div>

${result.confidence ? `<div class="confidence-box">
<strong>Confidence:</strong> ${getConfidenceDescription(result.confidence.level)}
${result.confidence.reasoning ? `<br><em>${result.confidence.reasoning}</em>` : ''}
</div>` : ''}

${result.pack_evidence.found ? `<div class="evidence-box ${result.status === 'meets' ? 'pass' : 'partial'}">
<strong>Your Submission:</strong> Found in ${result.pack_evidence.document || 'documents'}
${result.pack_evidence.quote ? `<blockquote>"${truncateText(result.pack_evidence.quote, 150)}"</blockquote>` : ''}
</div>` : ''}

${gaps.length > 0 ? `<div class="gaps-box">
<strong>Gaps Identified:</strong>
<ul>${gaps.map(g => `<li>${g}</li>`).join('')}</ul>
</div>` : ''}

${topAction ? `<div class="action-box">
<strong>Required Action:</strong> ${topAction.action} <em>(Owner: ${topAction.owner}, Effort: ${topAction.effort})</em>
</div>` : ''}

${(result.effort_assessment || result.cost_impact_assessment || result.rejection_assessment) ? `<div class="impact-box">
<strong>Impact Assessment (Stage 2: Honest Categories):</strong>
${result.effort_assessment ? `<br>⏱️  <strong>Effort:</strong> ${result.effort_assessment.description}` : ''}
${result.cost_impact_assessment ? `<br>💰 <strong>Cost Impact:</strong> ${result.cost_impact_assessment.description}${result.cost_impact_assessment.typical_range ? ` (${result.cost_impact_assessment.typical_range})` : ''}` : ''}
${result.rejection_assessment ? `<br>🚨 <strong>BSR Rejection Risk:</strong> ${result.rejection_assessment.reasoning}` : ''}
</div>` : ''}
</div>

`;
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '...';
}

/**
 * Format a passed criterion showing HOW compliance was demonstrated
 * This aligns with the landing page narrative: Identify, Clarify, Justify
 */
function formatPassedCriterion(result: AssessmentResult): string {
  return `<div class="compliance-item pass">
<div class="compliance-header">
<span class="badge pass">PASS</span>
<strong>${result.matrix_id}: ${result.matrix_title}</strong>
</div>

<div class="compliance-details">
<p><strong>Requirement:</strong> ${truncateText(result.success_definition, 150)}</p>
${result.pack_evidence.found && result.pack_evidence.quote
  ? `<p><strong>Evidence Found:</strong> "${truncateText(result.pack_evidence.quote, 120)}" <em>— ${result.pack_evidence.document || 'Submission'}</em></p>`
  : `<p><strong>Compliance:</strong> ${truncateText(result.reasoning, 150)}</p>`
}
</div>
</div>

`;
}

function statusBadge(status: string): string {
  switch (status) {
    case 'meets': return '<span class="badge pass">PASS</span>';
    case 'partial': return '<span class="badge partial">PARTIAL</span>';
    case 'does_not_meet': return '<span class="badge fail">FAIL</span>';
    default: return '<span class="badge">N/A</span>';
  }
}

function sevBadge(severity: string): string {
  switch (severity) {
    case 'high': return '<span class="sev-high">HIGH</span>';
    case 'medium': return '<span class="sev-med">MED</span>';
    case 'low': return '<span class="sev-low">LOW</span>';
    default: return '-';
  }
}

function effortBadge(effort: string): string {
  switch (effort.toUpperCase()) {
    case 'S': return '<span class="effort-s">S</span>';
    case 'M': return '<span class="effort-m">M</span>';
    case 'L': return '<span class="effort-l">L</span>';
    default: return effort;
  }
}

function getStatusBanner(assessment: FullAssessment): { headline: string; description: string; boxClass: string; icon: string; statusClass: string } {
  const { flagged_by_severity, criteria_summary } = assessment;

  if (flagged_by_severity.high >= 5) {
    return {
      headline: 'AT RISK',
      description: `${flagged_by_severity.high} high-severity gaps across ${criteria_summary.total_applicable} criteria. Substantial remediation required.`,
      boxClass: 'status-box risk',
      icon: '!',
      statusClass: 'status-risk'
    };
  }
  if (flagged_by_severity.high >= 1) {
    return {
      headline: 'NEEDS ATTENTION',
      description: `${flagged_by_severity.high} high-severity and ${flagged_by_severity.medium} medium-severity gaps. Address before submission.`,
      boxClass: 'status-box attention',
      icon: '!',
      statusClass: 'status-attention'
    };
  }
  if (criteria_summary.partial > criteria_summary.meets) {
    return {
      headline: 'PARTIALLY READY',
      description: 'Most criteria partially met. Strengthen evidence before submission.',
      boxClass: 'status-box attention',
      icon: '~',
      statusClass: 'status-attention'
    };
  }
  return {
    headline: 'LIKELY REVIEWABLE',
    description: `${criteria_summary.meets} of ${criteria_summary.total_applicable} criteria met. Minor improvements recommended.`,
    boxClass: 'status-box good',
    icon: '+',
    statusClass: 'status-good'
  };
}

function getTopActions(results: AssessmentResult[], n: number): Array<{action: string; owner: string; effort: string}> {
  const actions: Array<{action: string; owner: string; effort: string; sortKey: number}> = [];

  for (const result of results) {
    if (result.status === 'meets') continue;
    const severityKey = { high: 0, medium: 1, low: 2 }[result.severity] || 3;

    for (const action of result.actions_required.slice(0, 1)) {
      actions.push({
        action: action.action,
        owner: action.owner,
        effort: action.effort,
        sortKey: severityKey
      });
    }
  }

  return actions.sort((a, b) => a.sortKey - b.sortKey).slice(0, n);
}

function getRiskThemes(results: AssessmentResult[]): Array<{theme: string; fails: number; partials: number; impact: string}> {
  const themes: Record<string, {fails: number; partials: number}> = {};

  for (const result of results) {
    const theme = formatCategory(result.category);
    if (!themes[theme]) themes[theme] = { fails: 0, partials: 0 };
    if (result.status === 'does_not_meet') themes[theme].fails++;
    if (result.status === 'partial') themes[theme].partials++;
  }

  const impacts: Record<string, string> = {
    'Fire Safety': 'Core BSR focus area',
    'Pack Completeness': 'Foundation for validation',
    'HRB Duties': 'Statutory requirement',
    'Golden Thread': 'Lifecycle information requirement',
    'Consistency': 'Professional coordination indicator',
    'Traceability': 'Review efficiency factor',
  };

  return Object.entries(themes)
    .filter(([_, v]) => v.fails > 0 || v.partials > 0)
    .map(([theme, v]) => ({
      theme,
      fails: v.fails,
      partials: v.partials,
      impact: impacts[theme] || 'Reviewability factor'
    }))
    .sort((a, b) => (b.fails * 2 + b.partials) - (a.fails * 2 + a.partials));
}

function formatCategory(category: string): string {
  const titles: Record<string, string> = {
    'PACK_COMPLETENESS': 'Pack Completeness',
    'FIRE_SAFETY': 'Fire Safety',
    'HRB_DUTIES': 'HRB Duties',
    'GOLDEN_THREAD': 'Golden Thread',
    'VENTILATION': 'Ventilation',
    'LONDON_SPECIFIC': 'London Specific',
    'TRACEABILITY': 'Traceability',
    'CONSISTENCY': 'Consistency'
  };
  return titles[category] || category;
}

function consolidateActions(results: AssessmentResult[]): Array<{
  priority: string;
  action: string;
  criterion: string;
  owner: string;
  effort: string;
}> {
  const actions: Array<{
    priority: string;
    action: string;
    criterion: string;
    owner: string;
    effort: string;
    sortKey: number;
  }> = [];

  for (const result of results) {
    if (result.status === 'meets') continue;
    const priority = result.severity.toUpperCase();
    const sortKey = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 }[priority] || 3;

    for (const action of result.actions_required) {
      actions.push({
        priority,
        action: action.action,
        criterion: result.matrix_id,
        owner: action.owner,
        effort: action.effort,
        sortKey
      });
    }
  }

  return actions.sort((a, b) => a.sortKey - b.sortKey).map(({ sortKey, ...rest }) => rest);
}

/**
 * Generate JSON export of assessment
 */
export function generateMatrixJSON(data: ReportData): object {
  const passResults = data.assessment.results.filter(r => r.status === 'meets');
  const failResults = data.assessment.results.filter(r => r.status === 'does_not_meet');
  const partialResults = data.assessment.results.filter(r => r.status === 'partial');

  return {
    meta: {
      packName: data.packName,
      versionNumber: data.versionNumber,
      projectName: data.projectName,
      documentCount: data.documentCount,
      generatedAt: new Date().toISOString()
    },
    summary: {
      criteria: {
        total: data.assessment.criteria_summary.total_applicable,
        pass: passResults.length,
        partial: partialResults.length,
        fail: failResults.length
      },
      severity: data.assessment.flagged_by_severity,
      topActions: getTopActions(data.assessment.results, 5)
    },
    pack_context: data.assessment.pack_context,
    results: data.assessment.results,
    actions: consolidateActions(data.assessment.results),
    guardrails: data.assessment.guardrail_stats
  };
}

/**
 * Generate UI summary data (for compact display)
 */
export function generateUISummary(data: ReportData): object {
  const passResults = data.assessment.results.filter(r => r.status === 'meets');
  const failResults = data.assessment.results.filter(r => r.status === 'does_not_meet');
  const partialResults = data.assessment.results.filter(r => r.status === 'partial');
  const riskThemes = getRiskThemes(data.assessment.results);

  // Calculate readiness score if not already present
  const totalCriteria = data.assessment.criteria_summary.total_applicable;
  const readinessScore = data.assessment.readiness_score ??
    (totalCriteria > 0 ? Math.round(((passResults.length + partialResults.length * 0.5) / totalCriteria) * 100) : 0);

  // Get assessment phase info (with backwards compatibility)
  const assessmentPhases = data.assessment.assessment_phases ?? {
    deterministic: { total_rules: 0, passed: 0, failed: 0, needs_review: 0 },
    llm_analysis: { total_criteria: totalCriteria, assessed: totalCriteria }
  };

  return {
    overallStatus: getOverallStatusLabel(data.assessment),
    readinessScore,
    criteria: {
      total: data.assessment.criteria_summary.total_applicable,
      pass: passResults.length,
      partial: partialResults.length,
      fail: failResults.length,
      notAssessed: data.assessment.criteria_summary.not_assessed
    },
    severity: {
      ...data.assessment.flagged_by_severity,
      low: data.assessment.flagged_by_severity.low || 0
    },
    assessmentPhases: {
      deterministic: {
        totalRules: assessmentPhases.deterministic.total_rules,
        passed: assessmentPhases.deterministic.passed,
        failed: assessmentPhases.deterministic.failed,
        needsReview: assessmentPhases.deterministic.needs_review
      },
      llmAnalysis: {
        totalCriteria: assessmentPhases.llm_analysis.total_criteria,
        assessed: assessmentPhases.llm_analysis.assessed
      }
    },
    riskThemes: riskThemes.slice(0, 5),
    topActions: getTopActions(data.assessment.results, 5),
    confidence: {
      documentsAnalysed: data.documentCount,
      referenceAnchorRate: data.assessment.guardrail_stats.reference_anchor_rate,
      corpusBackedCriteria: data.assessment.guardrail_stats.corpus_backed_criteria,
      deterministicRuleCount: data.assessment.guardrail_stats.deterministic_rule_count || 55,
      llmCriteriaCount: data.assessment.guardrail_stats.llm_criteria_count || 0
    }
  };
}

function getOverallStatusLabel(assessment: FullAssessment): { label: string; color: string; description: string } {
  const { flagged_by_severity, criteria_summary } = assessment;

  if (flagged_by_severity.high >= 3) {
    return {
      label: 'At Risk',
      color: 'red',
      description: 'Multiple high-severity gaps. Significant work required.'
    };
  }
  if (flagged_by_severity.high >= 1 || flagged_by_severity.medium >= 4) {
    return {
      label: 'Needs Attention',
      color: 'amber',
      description: 'High-priority gaps present. Address before submission.'
    };
  }
  if (criteria_summary.does_not_meet === 0 && criteria_summary.partial <= 3) {
    return {
      label: 'Likely Reviewable',
      color: 'green',
      description: 'Pack substantially meets expectations.'
    };
  }
  return {
    label: 'Review Recommended',
    color: 'amber',
    description: 'Several criteria partially met.'
  };
}

// ============================================
// PHASE 2 ENHANCEMENT: EXECUTIVE SUMMARY & ISSUES REGISTER
// ============================================

import {
  READINESS_THRESHOLDS,
  estimateTimeline,
} from '../constants/cost-estimation.js';
import {
  formatCurrencyRange,
  formatDaysAsWeeks,
  getVerdictEmoji,
  getSeverityEmoji,
  formatRegulatoryRef,
  createTableRow,
  createTableSeparator,
  truncateTitle,
  cleanOwnerName,
} from './report-utils.js';

// Type definitions for new report structure
interface ExecutiveSummary {
  verdict: 'RED' | 'AMBER' | 'GREEN';
  verdict_text: string;
  verdict_description: string;
  critical_blockers: Array<{
    id: string;
    title: string;
    regulatory_ref: string;
    rejection_risk: number;
  }>;
  cost_estimate: {
    min: number;
    max: number;
    currency: 'GBP';
    breakdown: Array<{ owner: string; min: number; max: number }>;
  };
  timeline_estimate: {
    total_days: number;
    total_weeks: number;
    critical_path_owner: string;
    can_parallelize: boolean;
  };
  recommended_next_step: string;
  summary_stats: {
    total_issues: number;
    critical_count: number;
    high_count: number;
    ai_amendable_count: number;
    specialist_required_count: number;
    criteria_passed: number;
    criteria_total: number;
    // Stage 1: Confidence breakdown
    high_confidence: number;
    medium_confidence: number;
    requires_judgement: number;
  };
  // Stage 2: Impact profile (categorical distribution)
  impact_profile?: {
    effort_distribution: Record<string, number>;  // e.g., { WEEKS: 3, MONTHS: 1 }
    cost_distribution: Record<string, number>;    // e.g., { HIGH: 2, MEDIUM: 1 }
    rejection_distribution: Record<string, number>; // e.g., { VERY_LIKELY: 2, LIKELY: 1 }
  };
  // Stage 3: Submission decision gate
  submission_gate?: SubmissionGate;
  bsr_review_fee_estimate?: {
    hours: number;
    cost: number;
  };
}

interface IssueRegisterItem {
  id: string;
  matrix_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  regulatory_reference: string;
  owner: string;
  effort: string;
  cost_range: string;
  status: 'OPEN' | 'READY' | 'IN_PROGRESS' | 'FIXED';
  rejection_risk: number;
  priority_score: number;
  criterion_result?: AssessmentResult;
}

/**
 * Determine owner type for cost estimation (adapter)
 */
function getOwnerForCostEstimate(criterion: AssessmentResult): string {
  // Check if AI amendable
  if (criterion.proposed_change && criterion.proposed_change.length > 100) {
    return 'AI_AMENDABLE';
  }

  // Check actions for owner hints
  const actions = criterion.actions_required || [];
  for (const action of actions) {
    const owner = action.owner?.toUpperCase() || '';
    if (owner.includes('FIRE')) return 'FIRE_ENGINEER';
    if (owner.includes('STRUCTURAL')) return 'STRUCTURAL_ENGINEER';
    if (owner.includes('MEP') || owner.includes('M&E')) return 'MEP_ENGINEER';
    if (owner.includes('ARCHITECT')) return 'ARCHITECT';
    if (owner.includes('PROJECT') || owner.includes('PM')) return 'PROJECT_MANAGER';
  }

  // Check category
  if (criterion.category === 'FIRE_SAFETY') return 'FIRE_ENGINEER';
  if (criterion.category === 'STRUCTURAL') return 'STRUCTURAL_ENGINEER';

  return 'PROJECT_MANAGER';
}

/**
 * Generate Executive Summary (1-page decision summary)
 */
export function generateExecutiveSummary(
  assessment: FullAssessment,
  projectName: string
): ExecutiveSummary {
  const failedCriteria = assessment.results.filter(
    c => c.status === 'does_not_meet' || c.status === 'partial'
  );

  // Count by severity
  const criticalCount = failedCriteria.filter(
    c => c.severity === 'high' && c.status === 'does_not_meet'
  ).length;
  const highCount = failedCriteria.filter(
    c => c.severity === 'high' || c.status === 'does_not_meet'
  ).length;
  const aiAmendableCount = failedCriteria.filter(
    c => c.proposed_change && c.proposed_change.length > 100
  ).length;

  // Determine verdict
  let verdict: 'RED' | 'AMBER' | 'GREEN';
  let verdictText: string;
  let verdictDescription: string;

  const score = assessment.readiness_score;

  if (
    score >= READINESS_THRESHOLDS.GREEN.min_score &&
    criticalCount <= READINESS_THRESHOLDS.GREEN.max_critical_issues
  ) {
    verdict = 'GREEN';
    verdictText = READINESS_THRESHOLDS.GREEN.verdict;
    verdictDescription = READINESS_THRESHOLDS.GREEN.description;
  } else if (
    score >= READINESS_THRESHOLDS.AMBER.min_score &&
    criticalCount <= READINESS_THRESHOLDS.AMBER.max_critical_issues
  ) {
    verdict = 'AMBER';
    verdictText = READINESS_THRESHOLDS.AMBER.verdict;
    verdictDescription = READINESS_THRESHOLDS.AMBER.description;
  } else {
    verdict = 'RED';
    verdictText = READINESS_THRESHOLDS.RED.verdict;
    verdictDescription = READINESS_THRESHOLDS.RED.description;
  }

  // Identify top 3 critical blockers
  const sortedByPriority = [...failedCriteria]
    .filter(c => c.priority_score && c.priority_score > 70)
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 3);

  const criticalBlockers = sortedByPriority.map((c, idx) => ({
    id: String(idx + 1).padStart(2, '0'),
    title: c.matrix_title,
    regulatory_ref: formatRegulatoryRef(c),
    rejection_risk: Math.round((c.rejection_risk?.probability || 0.5) * 100),
  }));

  // Calculate total cost estimate
  const costByOwner: Record<string, { min: number; max: number }> = {};

  for (const criterion of failedCriteria) {
    const owner = getOwnerForCostEstimate(criterion);
    const cost = criterion.cost_estimate || { min: 0, max: 0 };

    if (!costByOwner[owner]) {
      costByOwner[owner] = { min: 0, max: 0 };
    }
    costByOwner[owner].min += cost.min;
    costByOwner[owner].max += cost.max;
  }

  const totalCostMin = Object.values(costByOwner).reduce((sum, c) => sum + c.min, 0);
  const totalCostMax = Object.values(costByOwner).reduce((sum, c) => sum + c.max, 0);

  const costBreakdown = Object.entries(costByOwner)
    .map(([owner, cost]) => ({ owner: cleanOwnerName(owner), min: cost.min, max: cost.max }))
    .filter(item => item.min > 0 || item.max > 0);

  // Calculate timeline estimate
  const issuesForTimeline = failedCriteria.map(c => ({
    effort: c.timeline_estimate?.description || 'M',
    owner: getOwnerForCostEstimate(c),
  }));

  const timelineData = estimateTimeline(issuesForTimeline);

  // Generate recommended next step
  let recommendedNextStep = '';
  if (verdict === 'RED') {
    if (criticalBlockers.length > 0) {
      const topBlocker = criticalBlockers[0];
      const topCriterion = sortedByPriority[0];
      const owner = getOwnerForCostEstimate(topCriterion);

      if (owner === 'FIRE_ENGINEER') {
        recommendedNextStep = `❌ DO NOT SUBMIT to BSR yet (rejection will cost £6K + 6 week delay)\n\n✅ PRIORITY ACTION: Engage fire engineer to address "${topBlocker.title}"\n   (This is blocking and has ${topCriterion.timeline_estimate?.description || '2-week'} lead time)`;
      } else if (owner === 'STRUCTURAL_ENGINEER') {
        recommendedNextStep = `❌ DO NOT SUBMIT to BSR yet\n\n✅ PRIORITY ACTION: Commission structural engineer report to address "${topBlocker.title}"`;
      } else {
        recommendedNextStep = `❌ DO NOT SUBMIT to BSR yet\n\n✅ PRIORITY ACTION: Fix "${topBlocker.title}" first (highest rejection risk: ${topBlocker.rejection_risk}%)`;
      }
    } else {
      recommendedNextStep = '❌ DO NOT SUBMIT to BSR yet. Address critical gaps identified in Issues Register.';
    }
  } else if (verdict === 'AMBER') {
    recommendedNextStep =
      '⚠️ Fix identified high-severity issues before submission. You may proceed with caution but risk rejection or significant BSR queries.';
  } else {
    recommendedNextStep =
      '✅ Your pack is ready for Gateway 2 submission. Minor improvements identified but not blocking.';
  }

  // Estimate BSR review fee
  const estimatedBSRHours = Math.round(40 + failedCriteria.length * 2);
  const bsrReviewFee = {
    hours: estimatedBSRHours,
    cost: estimatedBSRHours * 151, // £151/hour BSR rate
  };

  // Stage 1: Calculate confidence breakdown across all assessed criteria
  const highConfidence = assessment.results.filter(
    r => r.confidence?.level === 'HIGH'
  ).length;
  const mediumConfidence = assessment.results.filter(
    r => r.confidence?.level === 'MEDIUM'
  ).length;
  const requiresJudgement = assessment.results.filter(
    r => r.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT'
  ).length;

  // Stage 2: Calculate impact profile distributions (only for failed criteria)
  const effortDistribution: Record<string, number> = {};
  const costDistribution: Record<string, number> = {};
  const rejectionDistribution: Record<string, number> = {};

  failedCriteria.forEach(criterion => {
    // Count effort levels
    if (criterion.effort_assessment) {
      const level = criterion.effort_assessment.level;
      effortDistribution[level] = (effortDistribution[level] || 0) + 1;
    }

    // Count cost impacts
    if (criterion.cost_impact_assessment) {
      const impact = criterion.cost_impact_assessment.impact;
      costDistribution[impact] = (costDistribution[impact] || 0) + 1;
    }

    // Count rejection likelihoods
    if (criterion.rejection_assessment) {
      const likelihood = criterion.rejection_assessment.likelihood;
      rejectionDistribution[likelihood] = (rejectionDistribution[likelihood] || 0) + 1;
    }
  });

  // Stage 3: Analyze submission gate (clear yes/no decision)
  const submissionGate = analyzeSubmissionGate(assessment.results);

  return {
    verdict,
    verdict_text: verdictText,
    verdict_description: verdictDescription,
    critical_blockers: criticalBlockers,
    cost_estimate: {
      min: totalCostMin,
      max: totalCostMax,
      currency: 'GBP',
      breakdown: costBreakdown,
    },
    timeline_estimate: {
      total_days: timelineData.total_days,
      total_weeks: Math.ceil(timelineData.total_days / 7),
      critical_path_owner: cleanOwnerName(timelineData.critical_path_owner),
      can_parallelize: timelineData.can_parallelize,
    },
    recommended_next_step: recommendedNextStep,
    summary_stats: {
      total_issues: failedCriteria.length,
      critical_count: criticalCount,
      high_count: highCount,
      ai_amendable_count: aiAmendableCount,
      specialist_required_count: failedCriteria.length - aiAmendableCount,
      criteria_passed: assessment.results.filter(c => c.status === 'meets').length,
      criteria_total: assessment.results.length,
      // Stage 1: Confidence breakdown
      high_confidence: highConfidence,
      medium_confidence: mediumConfidence,
      requires_judgement: requiresJudgement,
    },
    // Stage 2: Impact profile (only if we have impact assessments)
    impact_profile: Object.keys(effortDistribution).length > 0 ? {
      effort_distribution: effortDistribution,
      cost_distribution: costDistribution,
      rejection_distribution: rejectionDistribution,
    } : undefined,
    // Stage 3: Submission decision gate
    submission_gate: submissionGate,
    bsr_review_fee_estimate: bsrReviewFee,
  };
}

/**
 * Format Executive Summary as markdown
 */
export function formatExecutiveSummaryMarkdown(
  summary: ExecutiveSummary,
  projectName: string,
  assessment: FullAssessment
): string {
  const emoji = getVerdictEmoji(summary.verdict);

  let md = `╔══════════════════════════════════════════════════════════════╗\n`;
  md += `║  BSR GATEWAY 2 READINESS ASSESSMENT                          ║\n`;
  md += `║  Project: ${projectName.padEnd(47)} ║\n`;
  md += `║  Assessment Date: ${new Date().toISOString().split('T')[0].padEnd(39)} ║\n`;
  md += `╚══════════════════════════════════════════════════════════════╝\n\n`;

  // Stage 3: Submission Gate - The Most Important Decision
  if (summary.submission_gate) {
    const gate = summary.submission_gate;
    const gateEmoji = gate.gate_status === 'GREEN' ? '✅' :
                      gate.gate_status === 'AMBER' ? '⚠️' : '🚨';

    md += `╔══════════════════════════════════════════════════════════════╗\n`;
    md += `║  SUBMISSION DECISION GATE                                    ║\n`;
    md += `╚══════════════════════════════════════════════════════════════╝\n\n`;
    md += `${gateEmoji} ${gate.gate_status}: ${gate.can_submit ? 'READY TO SUBMIT' : 'DO NOT SUBMIT YET'}\n\n`;
    md += `${gate.recommendation}\n\n`;

    if (gate.blockers_count > 0) {
      md += `⛔ ${gate.blockers_count} CRITICAL BLOCKER${gate.blockers_count > 1 ? 'S' : ''} must be fixed first:\n`;
      gate.blocking_issues.forEach(id => {
        md += `   • ${id}\n`;
      });
      md += `\n`;
    }

    if (gate.high_priority_count > 0 && gate.blockers_count === 0) {
      md += `⚠️  ${gate.high_priority_count} HIGH PRIORITY issue${gate.high_priority_count > 1 ? 's' : ''} remain - consider fixing to avoid BSR queries\n\n`;
    }

    md += `${'═'.repeat(65)}\n\n`;
  }

  md += `VERDICT: ${emoji} ${summary.verdict_text}\n`;
  md += `${'─'.repeat(65)}\n\n`;

  md += `${summary.verdict_description}\n\n`;

  if (summary.critical_blockers.length > 0) {
    md += `Your pack has ${summary.critical_blockers.length} CRITICAL GAP${
      summary.critical_blockers.length > 1 ? 'S' : ''
    } that will cause BSR rejection:\n\n`;

    summary.critical_blockers.forEach((blocker, idx) => {
      md += `  ${idx + 1}. [${blocker.id}] ${blocker.title}\n`;
      md += `     → Regulatory basis: ${blocker.regulatory_ref}\n`;
      md += `     → BSR rejection risk: ${blocker.rejection_risk}%\n\n`;
    });
  }

  md += `REMEDIATION PLAN:\n`;
  md += `${'─'.repeat(65)}\n`;
  md += `⚠️  NOTE: Cost and timeline figures below are ROUGH ESTIMATES only.\n`;
  md += `    Actual costs depend on your specific consultants and project context.\n\n`;
  md += `  Estimated cost to fix:     ${formatCurrencyRange(
    summary.cost_estimate.min,
    summary.cost_estimate.max
  )} (indicative)\n`;
  md += `  Estimated timeline:        ${formatDaysAsWeeks(summary.timeline_estimate.total_days)}`;
  if (summary.timeline_estimate.can_parallelize) {
    md += ` (if parallel workstreams)\n`;
  } else {
    md += `\n`;
  }
  md += `  Additional BSR review fee: £${(summary.bsr_review_fee_estimate?.cost || 0).toLocaleString()} (${
    summary.bsr_review_fee_estimate?.hours || 0
  } hours @ £151/hr)\n\n`;

  if (summary.cost_estimate.breakdown.length > 0) {
    md += `BREAKDOWN:\n`;
    summary.cost_estimate.breakdown
      .sort((a, b) => b.max - a.max)
      .slice(0, 5)
      .forEach(item => {
        md += `  • ${item.owner}: ${formatCurrencyRange(item.min, item.max)}\n`;
      });
    md += `\n`;
  }

  md += `RECOMMENDED NEXT STEP:\n`;
  md += `${'─'.repeat(65)}\n`;
  md += `${summary.recommended_next_step}\n\n`;

  if (summary.verdict !== 'GREEN') {
    md += `📞 OPTIONAL: Book 30-min review call with Attlee AI to discuss remediation\n`;
    md += `   → Contact: info@attlee.ai\n\n`;
  }

  md += `${'─'.repeat(65)}\n`;
  md += `ADDITIONAL CONTEXT:\n`;
  md += `  • ${summary.summary_stats.total_issues} issues requiring attention\n`;
  md += `  • ${summary.summary_stats.ai_amendable_count} AI-amendable fixes available (text additions, no specialist)\n`;
  md += `  • ${summary.summary_stats.specialist_required_count} issues require specialist input\n`;
  md += `  • ${summary.summary_stats.criteria_passed}/${summary.summary_stats.criteria_total} criteria already passed\n\n`;

  md += `CONFIDENCE BREAKDOWN:\n`;
  md += `  🟢 High Confidence:       ${summary.summary_stats.high_confidence} checks (deterministic)\n`;
  md += `  🟡 Medium Confidence:     ${summary.summary_stats.medium_confidence} checks (AI interpretation)\n`;
  md += `  🔴 Requires Judgement:    ${summary.summary_stats.requires_judgement} checks (expert needed)\n\n`;

  // Stage 3: Quick wins section
  const quickWins = assessment.results.filter(r =>
    (r.status === 'does_not_meet' || r.status === 'partial') &&
    r.triage?.quick_win
  );

  if (quickWins.length > 0) {
    md += `⚡ QUICK WINS (< 2 days each):\n`;
    md += `  ${quickWins.length} issue${quickWins.length > 1 ? 's' : ''} can be fixed quickly:\n`;
    quickWins.slice(0, 5).forEach(qw => {
      md += `  • ${qw.matrix_id}: ${qw.matrix_title}\n`;
    });
    md += `\n`;
  }

  // Stage 2: Show impact profile if available
  if (summary.impact_profile) {
    md += `IMPACT PROFILE (Honest Categories - Not Fake Precision):\n`;

    if (Object.keys(summary.impact_profile.effort_distribution).length > 0) {
      md += `  Effort Required:\n`;
      Object.entries(summary.impact_profile.effort_distribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([level, count]) => {
          const emoji = getEffortEmoji(level as any);
          md += `    ${emoji} ${level}: ${count} issue${count > 1 ? 's' : ''}\n`;
        });
    }

    if (Object.keys(summary.impact_profile.cost_distribution).length > 0) {
      md += `  Cost Impact:\n`;
      Object.entries(summary.impact_profile.cost_distribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([impact, count]) => {
          const emoji = getCostImpactEmoji(impact as any);
          md += `    ${emoji} ${impact}: ${count} issue${count > 1 ? 's' : ''}\n`;
        });
    }

    if (Object.keys(summary.impact_profile.rejection_distribution).length > 0) {
      md += `  BSR Rejection Risk:\n`;
      Object.entries(summary.impact_profile.rejection_distribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([likelihood, count]) => {
          const emoji = getRejectionEmoji(likelihood as any);
          md += `    ${emoji} ${likelihood}: ${count} issue${count > 1 ? 's' : ''}\n`;
        });
    }
    md += `\n`;
  }

  md += `Assessed by: Attlee AI Assessment Engine v2.1\n`;
  md += `Report generated: ${new Date().toISOString()}\n`;

  return md;
}

/**
 * Generate Issues Register (prioritized table of all issues)
 */
export function generateIssuesRegister(assessment: FullAssessment): IssueRegisterItem[] {
  const failedCriteria = assessment.results.filter(
    c => c.status === 'does_not_meet' || c.status === 'partial'
  );

  // Sort by priority score (highest first)
  const sortedCriteria = [...failedCriteria].sort(
    (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
  );

  // Convert to IssueRegisterItem format
  const items: IssueRegisterItem[] = sortedCriteria.map((criterion, idx) => {
    const owner = getOwnerForCostEstimate(criterion);
    const isAIAmendable = owner === 'AI_AMENDABLE';

    // Map severity
    let severity: 'critical' | 'high' | 'medium' | 'low';
    if (criterion.severity === 'high' && criterion.status === 'does_not_meet') {
      severity = 'critical';
    } else if (criterion.severity === 'high') {
      severity = 'high';
    } else if (criterion.severity === 'medium') {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Stage 2: Use new impact categories (with fallback to old format)
    let effortDisplay = 'Unknown';
    if (criterion.effort_assessment) {
      const emoji = getEffortEmoji(criterion.effort_assessment.level);
      effortDisplay = `${emoji} ${criterion.effort_assessment.level}`;
    } else if (criterion.timeline_estimate) {
      effortDisplay = criterion.timeline_estimate.description;
    }

    let costDisplay = '£0';
    if (criterion.cost_impact_assessment) {
      const emoji = getCostImpactEmoji(criterion.cost_impact_assessment.impact);
      costDisplay = `${emoji} ${criterion.cost_impact_assessment.impact}`;
    } else if (criterion.cost_estimate) {
      costDisplay = formatCurrencyRange(
        criterion.cost_estimate.min,
        criterion.cost_estimate.max
      );
    }

    let rejectionRisk = 50;
    if (criterion.rejection_assessment) {
      // Convert likelihood to numeric score for sorting
      const likelihoodScores = {
        'UNLIKELY': 15,
        'POSSIBLE': 40,
        'LIKELY': 65,
        'VERY_LIKELY': 85,
        'ALMOST_CERTAIN': 95
      };
      rejectionRisk = likelihoodScores[criterion.rejection_assessment.likelihood];
    } else if (criterion.rejection_risk) {
      rejectionRisk = Math.round(criterion.rejection_risk.probability * 100);
    }

    return {
      id: String(idx + 1).padStart(2, '0'),
      matrix_id: criterion.matrix_id,
      title: truncateTitle(criterion.matrix_title, 45),
      severity,
      regulatory_reference: formatRegulatoryRef(criterion),
      owner: cleanOwnerName(owner),
      effort: effortDisplay,
      cost_range: costDisplay,
      status: isAIAmendable ? 'READY' : 'OPEN',
      rejection_risk: rejectionRisk,
      priority_score: criterion.priority_score || 50,
      criterion_result: criterion,
    };
  });

  return items;
}

/**
 * Format Issues Register as markdown table
 */
export function formatIssuesRegisterMarkdown(items: IssueRegisterItem[]): string {
  let md = `╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗\n`;
  md += `║  ISSUES REGISTER: Gateway 2 Submission Gaps                                                                  ║\n`;
  md += `╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n\n`;

  md += `Sorted by: BSR Rejection Risk (High → Low)\n`;
  md += `Showing: Critical & High severity issues (${
    items.filter(i => i.severity === 'critical' || i.severity === 'high').length
  } issues)\n\n`;

  // Table headers
  const widths = [4, 45, 10, 13, 17, 8, 9, 8];

  md += createTableSeparator(widths, 'top') + '\n';
  md +=
    createTableRow(
      ['ID', 'Issue Title', 'Severity', 'Reg Ref', 'Owner', 'Effort', 'Cost', 'Status'],
      widths
    ) + '\n';
  md += createTableSeparator(widths, 'middle') + '\n';

  // Show critical/high first
  const criticalAndHigh = items.filter(i => i.severity === 'critical' || i.severity === 'high');

  criticalAndHigh.forEach(item => {
    md +=
      createTableRow(
        [
          item.id,
          truncateTitle(item.title, 43),
          getSeverityEmoji(item.severity),
          item.regulatory_reference.substring(0, 11),
          item.owner.substring(0, 15),
          item.effort.substring(0, 6),
          item.cost_range,
          item.status,
        ],
        widths
      ) + '\n';
  });

  md += createTableSeparator(widths, 'bottom') + '\n\n';

  // Summary stats
  const aiAmendable = items.filter(i => i.status === 'READY');
  const byOwner: Record<
    string,
    { count: number; costMin: number; costMax: number; maxDays: number }
  > = {};

  items.forEach(item => {
    const owner = item.owner;
    if (!byOwner[owner]) {
      byOwner[owner] = { count: 0, costMin: 0, costMax: 0, maxDays: 0 };
    }
    byOwner[owner].count++;

    // Stage 2: Parse cost range (handle both old numerical and new categorical formats)
    const costMatch = item.cost_range.match(/£([\d.]+)K?-?([\d.]+)?K?/);
    if (costMatch) {
      const min = parseFloat(costMatch[1]) * (item.cost_range.includes('K') ? 1000 : 1);
      const max = costMatch[2]
        ? parseFloat(costMatch[2]) * (item.cost_range.includes('K') ? 1000 : 1)
        : min;
      byOwner[owner].costMin += min;
      byOwner[owner].costMax += max;
    }
    // For new format (e.g., "💛 LOW"), we can't sum but that's okay -
    // the display will show categories instead of totals
  });

  md += `SUMMARY:\n`;
  md += `  Total issues:         ${items.length}\n`;
  md += `  AI-amendable:         ${aiAmendable.length} issues (ready to apply)\n`;
  md += `  Require specialists:  ${items.length - aiAmendable.length} issues\n\n`;

  md += `NEXT ACTIONS BY OWNER:\n`;
  Object.entries(byOwner)
    .sort((a, b) => b[1].costMax - a[1].costMax)
    .forEach(([owner, data]) => {
      const icon =
        owner === 'Ai Amendable'
          ? '🤖'
          : owner.includes('Fire')
          ? '🔧'
          : owner.includes('Structural')
          ? '🏗️'
          : owner.includes('Architect')
          ? '🏛️'
          : owner.includes('Project')
          ? '👔'
          : '  ';
      md += `  ${icon} ${owner}: ${data.count} issue${data.count > 1 ? 's' : ''} | ${formatCurrencyRange(
        data.costMin,
        data.costMax
      )}\n`;
    });

  md += `\n${'─'.repeat(105)}\n`;

  // Add confidence breakdown
  const highConfidence = items.filter(i => i.criterion_result?.confidence?.level === 'HIGH').length;
  const mediumConfidence = items.filter(i => i.criterion_result?.confidence?.level === 'MEDIUM').length;
  const requiresJudgement = items.filter(i => i.criterion_result?.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT').length;

  md += `CONFIDENCE BREAKDOWN:\n`;
  md += `  🟢 High Confidence:       ${highConfidence} issues (deterministic checks)\n`;
  md += `  🟡 Medium Confidence:     ${mediumConfidence} issues (AI interpretation)\n`;
  md += `  🔴 Requires Judgement:    ${requiresJudgement} issues (expert needed)\n\n`;

  md += `💡 TIP: Fix issues #01-03 first (highest BSR rejection risk)\n`;

  return md;
}

export default {
  generateMatrixReport,
  generateMatrixJSON,
  generateUISummary,
  // Phase 2 additions
  generateExecutiveSummary,
  formatExecutiveSummaryMarkdown,
  generateIssuesRegister,
  formatIssuesRegisterMarkdown,
};
