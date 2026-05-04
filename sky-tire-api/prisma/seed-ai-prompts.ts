import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const defaultPrompts = [
  {
    aiKey: 'chatgpt',
    defaultPrompt: 'You are an AI assistant specialized in tire and wheel industry. Help users find the best products.',
    prompt: 'You are an AI assistant specialized in tire and wheel industry. Help users find the best products.',
  },
  {
    aiKey: 'gemini',
    defaultPrompt: 'You are a helpful AI assistant for SkyTire. Provide detailed information about tires and wheels.',
    prompt: 'You are a helpful AI assistant for SkyTire. Provide detailed information about tires and wheels.',
  },
  {
    aiKey: 'grok',
    defaultPrompt: 'You are Grok, helping users with SkyTire inquiries. Be direct and informative.',
    prompt: 'You are Grok, helping users with SkyTire inquiries. Be direct and informative.',
  },
  {
    aiKey: 'claude',
    defaultPrompt: 'You are Claude, a helpful assistant for SkyTire. Focus on accuracy and customer service.',
    prompt: 'You are Claude, a helpful assistant for SkyTire. Focus on accuracy and customer service.',
  },
  {
    aiKey: 'cursor',
    defaultPrompt: 'You are Cursor AI, assisting with technical and product details for SkyTire.',
    prompt: 'You are Cursor AI, assisting with technical and product details for SkyTire.',
  },
];

async function main() {
  console.log('Seeding AI Prompts...');
  for (const item of defaultPrompts) {
    await prisma.aIPrompt.upsert({
      where: { aiKey: item.aiKey },
      update: {},
      create: item,
    });
  }
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
