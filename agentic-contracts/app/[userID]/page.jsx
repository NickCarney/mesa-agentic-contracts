import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


export default async function ContractPage({ params }) {
  const {userID} = params
  console.log(userID)
  const id = userID;
  let contractText;


  const { data: contract, error } = await supabase
  .from('translated-contracts')
  .select('*')
  .eq('id', Number(id))
  .single();


  const fetchIPFSContent = async () => {
    if (!contract.ipfs_link) return;
    try {
      const response = await fetch(contract.ipfs_link);
      if (!response.ok) {
        throw new Error("Failed to fetch IPFS content");
      }
      contractText = await response.text();
      console.log(contractText)
    } catch (err) {
      console.error("Error fetching IPFS content:", err);
      setIpfsText("Error loading contract content.");
    }
  };
    fetchIPFSContent();

  if (error || !contract) {
    return <div className='text-center'><p>No contract found for ID: {id}</p></div>;
  }

  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold">Contract for ID: {id}</h1>
      <p>original ipfs Link: {contract.ipfs_link}</p>
      <textarea
        className="w-full h-64 p-2 border rounded-md"
        value={contractText}
      />
    </div>
  );
}
