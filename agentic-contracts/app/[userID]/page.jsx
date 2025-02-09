import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


export default async function ContractPage({ params }) {
  const {userID} = params
  console.log(userID)
  const id = userID;
  const [ipfsText, setIpfsText] = useState<string | null>(null);


  const { data: contract, error } = await supabase
  .from('translated-contracts')
  .select('*')
  .eq('id', Number(id))
  .single();


  useEffect(() => {
    const fetchIPFSContent = async () => {
      if (!contract.ipfs_link) return;
      try {
        const response = await fetch(contract.ipfs_link);
        if (!response.ok) {
          throw new Error("Failed to fetch IPFS content");
        }
        const text = await response.text();
        setIpfsText(text);
      } catch (err) {
        console.error("Error fetching IPFS content:", err);
        setIpfsText("Error loading contract content.");
      }
    };
      fetchIPFSContent();
    }, [contract.ipfs_link]);

  if (error || !contract) {
    return <div className='text-center'><p>No contract found for ID: {id}</p></div>;
  }

  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold">Contract for ID: {id}</h1>
      {ipfsText ? (
        <pre className="bg-gray-100 p-4 rounded-md">{ipfsText}</pre>
      ) : (
        <p>Loading contract content...</p>
      )}
    </div>
  );
}
