import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export const processDocuments = async (docsPath: string) => {
  const absoluteDocsPath = path.resolve(process.cwd(), docsPath);
  const files = fs.readdirSync(absoluteDocsPath);
  const texts: string[] = [];

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(process.cwd(), docsPath, file);
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      texts.push(pdfData.text);
    }
  }
  return texts;
};