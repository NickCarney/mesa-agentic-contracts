import { Pinecone } from '@pinecone-database/pinecone';

export async function initPinecone() {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  return pc;
}



