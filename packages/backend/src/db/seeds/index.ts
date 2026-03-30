import { seedClcRequirements } from './clcRequirements';
import { seedBsrRejectionReasons } from './bsrRejectionReasons';

export async function runAllSeeds(): Promise<void> {
  await seedClcRequirements();
  await seedBsrRejectionReasons();
}

export { seedClcRequirements, seedBsrRejectionReasons };
