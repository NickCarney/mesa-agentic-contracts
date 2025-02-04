import { PineconeClient } from "pinecone-client";

export async function initPinecone() {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: "us-east-1",
  });
  return client;
}
