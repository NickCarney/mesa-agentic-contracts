import * as React from "react";

interface EmailTemplateProps {
  id: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  id,
}) => (
  <div>
    <p>Check out this link: https://mesa-agentic-contracts.vercel.app/{id}</p>
  </div>
);
