import initPinecone from './pineconeClient';
import extractTextFromPDF from './processDocuments';

import { createHash } from 'crypto';

export async function main() {
  const client = await initPinecone();

  const indexName = "mesa-docs-index";
  try {
    await client.createIndex({
      name: indexName,
      dimension: 1536,
    });
  } catch (e) {
    console.log("Index might already exist");
  }

  const index = client.Index(indexName);

  const pdfPath = '../public/';
  const text = await extractTextFromPDF(pdfPath);

  const openai = require("openai");
  const configuration = new openai.Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openaiClient = new openai.OpenAIApi(configuration);

  const embeddingResponse = await openaiClient.createEmbedding({
    model: "text-embedding-ada-002",
    input: text,
  });

  const embeddings = embeddingResponse.data.data[0].embedding;

  const vectorId = createHash("md5").update(pdfPath).digest("hex");

  await index.upsert([
    { id: vectorId, values: embeddings, metadata: { source: pdfPath } },
  ]);

  console.log("Data successfully inserted!");
}

main();
