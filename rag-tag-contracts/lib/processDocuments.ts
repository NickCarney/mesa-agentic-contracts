import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export const processDocuments = async (docsPath: string) => {
  const files = fs.readdirSync(path.join(process.cwd(), docsPath));
  const texts: string[] = [];

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(path.join(docsPath, file));
      const pdfData = await pdfParse(dataBuffer);
      texts.push(pdfData.text);
    }
  }
  return texts;
};
