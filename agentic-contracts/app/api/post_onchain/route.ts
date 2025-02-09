import { NextResponse } from 'next/server';

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
    console.log(id,ipfs_link,emails)

    if (!id || !ipfs_link || !emails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    sendEmail(emails,id);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
