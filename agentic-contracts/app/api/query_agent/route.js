//import { Pinecone } from "@pinecone-database/pinecone";
//import { give_prompt } from "@/utils/agentkitIntegration";
// import { fetchLawInsider } from "@/lib/fetchLawInsider";
// import { generatePrompt } from "@/lib/generatePrompt";


export async function POST(request) {
    try {
        //1. get data (ipfs link and jurisdiction) from supabase webhook
        let ipfsLink = request.json().body.record.ipfs_link;
        const jurisdiction = request.json().body.record.jurisdiction;
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
        //4. generate prompt for agentkit based on context
        //5. call agentkit to generate new contract and post onchain
        //6.? docusign integration
        return new Response(JSON.stringify({ message: 'Contract processed successfully' }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

};

export async function GET(request){
  console.log(request)
  return new Response(JSON.stringify({ message: 'Get processed' }), { status: 200 });
}



