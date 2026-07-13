async function callBitrix24API(endpoint, data) {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1s initial delay
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(endpoint, data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 503 || error.code === 'QUERY_LIMIT_EXCEEDED') {
        await new Promise(resolve => setTimeout(resolve, BASE_DELAY * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Bitrix24 API unavailable after retries');
}
