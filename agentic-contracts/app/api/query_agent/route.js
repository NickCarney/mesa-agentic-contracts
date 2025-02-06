import {initPinecone} from '../../../lib/pineconeClient';
import OpenAI from "openai";
//import { give_prompt } from "@/utils/agentkitIntegration";
// import { fetchLawInsider } from "@/lib/fetchLawInsider";
// import { generatePrompt } from "@/lib/generatePrompt";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    //1. get data (ipfs link and jurisdiction) from supabase webhook
        
    let ipfsLink = req.json().body.record.ipfs_link;
    const jurisdiction = req.json().body.record.jurisdiction;
    console.log('New contract inserted:',  ipfsLink, jurisdiction );

    //2. parse contract from ipfs link
    ipfsLink = 'https://ipfs.io/ipfs/'+ipfsLink;
    const ipfsResponse = await fetch(ipfsUrl);
    if (!ipfsResponse.ok) {
      throw new Error(`Failed to fetch IPFS content. Status: ${ipfsResponse.status}`);
    }
    const contractText = await ipfsResponse.text();
    console.log('Contract text:', contractText);

    const supabase = createClient(
      "https://ewvzsofyvxcctuxxqibo.supabase.co",
      process.env.SUPABASE_ANON_KEY
    );
    await supabase
    .from("agentic-eth-contracts")
    .insert([{ jurisdiction: jurisdiction, ipfslink: ipfsLink, contracttext: contractText }]);

    //3. query pinecone for similar contracts (context)

    //embed contract text
    const openai = new OpenAI();
    const client = await initPinecone();
    const indexName = "mesa-docs-index";
    const index = client.index(indexName);

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: contractText,
      encoding_format: "float",
    });

    const queryResponse = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
      namespace: 'mesa-docs-namespace', // this assumes you have indexed documents under a namespace named by jurisdiction
    });

    const contextMatches = queryResponse.matches || [];
    console.log(`Found ${contextMatches.length} matching context documents in Pinecone.`);
    //4. generate prompt for agentkit based on context
    //5. call agentkit to generate new contract and post onchain
    //6.? docusign integration
    res.status(200).json({ message: 'Post successful!' })
  } else {
    res.status(200).json({ message: 'Get successful!' })
  }
}

