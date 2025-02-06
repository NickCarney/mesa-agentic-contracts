import { NextResponse } from 'next/server';
import {initPinecone} from '../../../lib/pineconeClient';
import OpenAI from "openai";
//import { give_prompt } from "@/utils/agentkitIntegration";
// import { fetchLawInsider } from "@/lib/fetchLawInsider";
// import { generatePrompt } from "@/lib/generatePrompt";


export async function POST(req,res) {
     try{
        console.log(req,res)
        const payload = await req.json()
        const { ipfs_cid, jurisdiction } = payload.record;
        //1. get data (ipfs link and jurisdiction) from supabase webhook
        console.log('New contract inserted:',  ipfs_cid, jurisdiction );

        //2. parse contract from ipfs link
        ipfsLink = 'https://ipfs.io/ipfs/'+ipfs_cid;
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
        return NextResponse.json(ipfsLink)
      }catch(err){
        console.log("Error:",err.message);
        const response = {error:err.message, req, returnedStatus:500}
        return NextResponse.json(response, {status:500})
      }
};

export async function GET(req,res){
  console.log(req,res)
  return NextResponse.json(req)
}



