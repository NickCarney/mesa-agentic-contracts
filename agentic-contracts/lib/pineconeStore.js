import {initPinecone} from './pineconeClient.js';
import {processDocuments} from './processDocuments.ts';
import {OpenAI} from 'openai';

import { createHash } from 'crypto';

export async function main() {
  const client = await initPinecone();

  const indexName = "mesa-docs-index";
  try {
    await client.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: { 
        serverless: { 
          cloud: 'aws', 
          region: 'us-east-1' 
        }
      }
    });
  } catch (e) {
    console.log("Index might already exist",e);
  }

  const index = client.index(indexName);

  const pdfPath = 'public/';
  const text = await processDocuments(pdfPath);


  const openai =  new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  //const openaiClient =  new OpenAIApi(configuration);

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embeddings = embeddingResponse.data[0].embedding;

  const vectorId = createHash("md5").update(pdfPath).digest("hex");

  const records = text.map((d) => ({
    id: vectorId,
    values: embeddings,
    metadata: { text: d.text }
  }));

  await index.namespace('mesa-docs-namespace').upsert(records);

  console.log("Data successfully inserted!");
}

main();
