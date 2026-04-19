
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Form Templates ---');
  const templates = await prisma.bizFormTemplate.findMany({
    where: { templateKey: 'employee_onboarding' }
  });
  console.log('Templates found:', JSON.stringify(templates, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  console.log('\n--- Checking Flow Definitions ---');
  const flows = await prisma.flowDefinition.findMany({
    where: { flowCode: 'employee_onboarding' }
  });
  console.log('Flows found:', JSON.stringify(flows, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  console.log('\n--- Checking Flow Steps ---');
  if (flows.length > 0) {
    const steps = await prisma.flowNode.findMany({
      where: { definitionId: flows[0].id }
    });
    console.log('Steps found:', JSON.stringify(steps, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
