export const generatePrompt = (userQuery: string, apiContext: string, docContext: string) => `
You are an expert legal assistant. Here's relevant legal context in varying languages that you will translate to in the form of the template:
From Law Insider API:
${apiContext}

The document you are using as a template is:
${docContext}

Please answer the following user query:
${userQuery}
`;
