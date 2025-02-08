import { EmailTemplate } from "../../components/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { emails, id } = await request.json(); // Assuming the name is sent in the request body
  console.log(emails,id)

  try {
    const { data, error } = await resend.emails.send({
      from: "Mesa <contracts@mesawallet.io>",
      to: emails,
      subject: "Translated Contract",
      react: await EmailTemplate( id ),
    });

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Resend error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
