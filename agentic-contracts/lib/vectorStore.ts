// Import the Pinecone library
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Define a sample dataset where each item has a unique ID and piece of text
const data = [
  { id: 'vec1', text: 'Apple is a popular fruit known for its sweetness and crisp texture.' },
  { id: 'vec2', text: 'The tech company Apple is known for its innovative products like the iPhone.' },
  { id: 'vec3', text: 'Many people enjoy eating apples as a healthy snack.' },
  { id: 'vec4', text: 'Apple Inc. has revolutionized the tech industry with its sleek designs and user-friendly interfaces.' },
  { id: 'vec5', text: 'An apple a day keeps the doctor away, as the saying goes.' },
  { id: 'vec6', text: 'Apple Computer Company was founded on April 1, 1976, by Steve Jobs, Steve Wozniak, and Ronald Wayne as a partnership.' }
];

// Convert the text into numerical vectors that Pinecone can index
const model = 'multilingual-e5-large';

const embeddings = await pc.inference.embed(
  model,
  data.map(d => d.text),
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

