import { createClient } from '@supabase/supabase-js';
import * as pdf from 'pdf-parse';
//import { give_prompt } from '../../utils/agentkitIntegration'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


export default async function ContractPage({ params }) {
  const {userID} = await params
  //console.log(userID)
  const id = userID;


  const { data: contract, error } = await supabase
  .from('translated-contracts')
  .select('*')
  .eq('id', Number(id))
  .single();
  const lastIndex = contract.ipfs_link.lastIndexOf("/");
  const cid = contract.ipfs_link.substring(lastIndex,);
  //console.log(cid);



  async function displayWebpageText(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const pdfBytes = await response.arrayBuffer();
      return pdfBytes;
    } catch (error) {
      console.error("Error fetching or displaying text:", error);
      return error;
    }
  }
  const pdfBytes = await displayWebpageText("https://ipfs.io/ipfs/"+cid)

  async function extractText(pdfBytes) {
    const data = await pdf(pdfBytes);
    //console.log('PDF Text Content:', data.text);
    return data.text
  }

  const text = await extractText(pdfBytes);


  if (error || !contract) {
    return <div className='text-center'><p>No contract found for ID: {id}</p></div>;
  }

  // const postOnchain = () => {
  //   const prompt = 'add funds from faucet until you can mint and deploy. Then mint and deploy a pdf stored on IPFS at this link: (https://ipfs.io/ipfs/'+cid+'). Once this is deployed that is all, thank you.'
  //   give_prompt(prompt)
  // }

  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold">Contract for ID: {id}</h1>
      <a href={contract.ipfs_link}>Translated Contract IPFS Link</a>
      <br/>
      <h3>Edit your contract if necessary</h3>
      <textarea id="contract" defaultValue={text} rows="20" cols="80"></textarea>
      {/* <button onClick={postOnchain}>
        Post Onchain
      </button> */}

    </div>
  );
}
