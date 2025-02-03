// Import the Pinecone library
import { Pinecone } from '@pinecone-database/pinecone';
import { processDocuments } from './processDocuments';

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const texts = await processDocuments('public/');

// Convert the text into numerical vectors that Pinecone can index
const model = 'multilingual-e5-large';

const embeddings = await pc.inference.embed(
  model,
  texts,
  { inputType: 'passage', truncate: 'END' }
);

console.log(embeddings);

// Create a serverless index
const indexName = "example-index"

await pc.createIndex({
  name: indexName,
  dimension: 1024,
  metric: 'cosine',
  spec: { 
    serverless: { 
      cloud: 'aws', 
      region: 'us-east-1' 
    }
  } 
}); 


// Target the index where you'll store the vector embeddings
const index = pc.index('eth-index');

// Prepare the records for upsert
// Each contains an 'id', the embedding 'values', and the original text as 'metadata'
const records = data.map((d, i) => ({
  id: d.id,
  values: embeddings[i].values,
  metadata: { text: d.text }
}));

// Upsert the vectors into the index
await index.namespace('eth-namespace').upsert(records);

const stats = await index.describeIndexStats();

console.log(stats)


// Define your query
const query = [
  'Tell me about these contracts',
];

// Convert the query into a numerical vector that Pinecone can search with
const queryEmbedding = await pc.inference.embed(
  model,
  query,
  { inputType: 'query' }
);

// Search the index for the three most similar vectors
const queryResponse = await index.namespace("eth-namespace").query({
  topK: 3,
  vector: queryEmbedding[0].values,
  includeValues: false,
  includeMetadata: true
});

console.log(queryResponse);

