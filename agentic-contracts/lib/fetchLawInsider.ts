import axios from 'axios';

export const fetchLawInsider = async (query: string) => {
  const API_KEY = process.env.LAW_INSIDER_API_KEY;
  const response = await axios.get('https://api.lawinsider.com/v1/search', {
    headers: { Authorization: `Bearer ${API_KEY}` },
    params: { q: query },
  });
  return response.data.snippets.join(' ');
};