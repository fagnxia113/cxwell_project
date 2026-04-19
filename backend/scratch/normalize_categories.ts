
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Normalizing Categories to Lowercase ---');
  
  // 1. Update Form Templates
  const templates = await prisma.bizFormTemplate.findMany();
  for (const t of templates) {
    if (t.category && t.category !== t.category.toLowerCase()) {
      console.log(`Updating FormTemplate ${t.templateKey}: ${t.category} -> ${t.category.toLowerCase()}`);
      await prisma.bizFormTemplate.update({
        where: { id: t.id },
        data: { category: t.category.toLowerCase() }
      });
    }
  }

  // 2. Update Flow Definitions
  const flows = await prisma.flowDefinition.findMany();
  for (const f of flows) {
    if (f.category && f.category !== f.category.toLowerCase()) {
      console.log(`Updating FlowDefinition ${f.flowCode}: ${f.category} -> ${f.category.toLowerCase()}`);
      await prisma.flowDefinition.update({
        where: { id: f.id },
        data: { category: f.category.toLowerCase() }
      });
    }
  }

  console.log('Normalization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
