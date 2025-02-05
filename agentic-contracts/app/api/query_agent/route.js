import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from "@pinecone-database/pinecone";
//import { give_prompt } from "@/utils/agentkitIntegration";
import { fetchLawInsider } from "@/lib/fetchLawInsider";
import { generatePrompt } from "@/lib/generatePrompt";


export async function POST(req,res) {
    try {
        //1. get data (ipfs link and jurisdiction) from supabase webhook
        const ipfsLink = req.body.record.ipfs_link;
        const jurisdiction = req.body.record.jurisdiction;
        console.log('New contract inserted:',  ipfsLink, jurisdiction );
        //2. parse contract from ipfs link
        //3. query pinecone for similar contracts (context)
        //4. generate prompt for agentkit based on context
        //5. call agentkit to generate new contract and post onchain
        //6.? docusign integration
        return NextResponse.json({ ipfs: ipfsLink });
    } catch (error) {
        console.error('Error processing contract:', error);
        return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
        };
    }

};



