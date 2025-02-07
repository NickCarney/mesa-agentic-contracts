import { NextResponse } from 'next/server';
import {initPinecone} from '../../../lib/pineconeClient';
//import OpenAI from "openai";
import { generatePrompt } from "@/lib/generatePrompt";
import { give_prompt } from "@/utils/agentkitIntegration";
import { createClient } from "@supabase/supabase-js";
// import { fetchLawInsider } from "@/lib/fetchLawInsider";



export async function POST(req,res) {
     try{
        console.log(req,res)
        const payload = await req.json()
        const { ipfs_cid, jurisdiction } = payload.record;
        //1. get data (ipfs link and jurisdiction) from supabase webhook
        console.log('New contract inserted:',  ipfs_cid, jurisdiction );

        //2. parse contract from ipfs link
        const ipfsLink = 'https://ipfs.io/ipfs/'+ipfs_cid;
        const ipfsResponse = await fetch(ipfsLink);
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
        //const openai = new OpenAI();
        const client = await initPinecone();
        const indexName = "mesa-docs-index";
        const index = client.index(indexName);

        // const embedding = await openai.embeddings.create({
        //   model: "text-embedding-3-small",
        //   input: contractText,
        //   encoding_format: "float",
        // });

        const queryResponse = await index.namespace('mesa-docs-namespace').query({
          id: 'f832923ad3cb060bc87ad85e68b8a1c3',
          topK: 2,
          includeMetadata: true,
          includeValues: true,
        });

        const contextMatches = queryResponse.matches || [];
        console.log(`Found ${contextMatches.length} matching context documents in Pinecone.`);

        const contextDocs = contextMatches
        .map(match => match.metadata?.text.slice(0, 7000))
        .filter(Boolean)
        .join("\n");

        //4. generate prompt for agentkit based on context
        const userQuery = `generate a new translated contract in the official language of this jurisdiction: ${jurisdiction}. Once you have the contract, generate a new wallet, add funds from faucet to mint and deploy the contract as an NFT. Then mint the contract and deploy it. Afterwards, display the wallet details along with the NFT details.`;
        const prompt = generatePrompt(userQuery, contextDocs, contextDocs)//using context docs twice until we gain law insider access.

        //5. call agentkit to generate new contract and post onchain
        give_prompt(prompt);

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



