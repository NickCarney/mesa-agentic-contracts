import { NextResponse } from 'next/server';
//import { createClient } from '@supabase/supabase-js';

//const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const sendEmail = async (emails: string, id:string) => {
  try {
    const response = await fetch(`/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emails: emails, id:id }),
    });
    if (!response.ok) {
      console.error("Error sending email:", response.statusText);
      return NextResponse.json(
        { error: "Error sending email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Error sending email" },
      { status: 500 }
    );
  }
};

export async function POST(req: Request) {
  try {
    const { id, ipfs_link, emails } = await req.json();

    if (!id || !ipfs_link || !emails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    sendEmail(emails,id);
    // const { data, error } = await supabase
    //   .from('translated-contracts')
    //   .insert([{ id, ipfs_link, emails }]);

    // if (error) throw error;

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
