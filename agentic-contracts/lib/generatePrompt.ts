export const generatePrompt = (userQuery: string, apiContext: string, docContext: string) => `
You are an expert legal assistant. Here's a relevant legal contract that you will translate:

The document you are using as a template is:
${docContext}

Please answer the following user query:
${userQuery}
`;
