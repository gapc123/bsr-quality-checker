import { seedClcRequirements } from './clcRequirements';

export async function runAllSeeds(): Promise<void> {
  await seedClcRequirements();
}

export { seedClcRequirements };
