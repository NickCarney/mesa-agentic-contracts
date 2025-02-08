import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


export default async function ContractPage({ params }) {
    const {userID} = params
    console.log(userID)
    const id = userID;


  const { data: contract, error } = await supabase
    .from('translated-contracts')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error || !contract) {
    return <div className='text-center'><p>No contract found for ID: {id}</p></div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Contract for ID: {id}</h1>
      <p>Link: {contract.link}</p>
      <p>Emails: {contract.emails?.join(', ')}</p>
    </div>
  );
}
