//import { Pinecone } from "@pinecone-database/pinecone";
//import { give_prompt } from "@/utils/agentkitIntegration";
// import { fetchLawInsider } from "@/lib/fetchLawInsider";
// import { generatePrompt } from "@/lib/generatePrompt";


export async function POST(req,res) {
    try {
        //1. get data (ipfs link and jurisdiction) from supabase webhook
        let ipfsLink = req.body.record.ipfs_link;
        const jurisdiction = req.body.record.jurisdiction;
        console.log('New contract inserted:',  ipfsLink, jurisdiction );
        //2. parse contract from ipfs link
        ipfsLink = 'https://ipfs.io/ipfs/'+ipfsLink;
        const ipfsResponse = await fetch(ipfsUrl);
        if (!ipfsResponse.ok) {
          throw new Error(`Failed to fetch IPFS content. Status: ${ipfsResponse.status}`);
        }
        const contractText = await ipfsResponse.text();
        console.log('Contract text:', contractText);
        //3. query pinecone for similar contracts (context)
        //4. generate prompt for agentkit based on context
        //5. call agentkit to generate new contract and post onchain
        //6.? docusign integration
        return res.status(200).json({ message: 'Contract processed successfully' });
    } catch (error) {
        console.error('Error processing contract:', error);
        return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
        };
    }

};



