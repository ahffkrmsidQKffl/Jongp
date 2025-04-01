export async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
  
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  
    const options = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    };
  
    const response = await fetch(endpoint, options);
    const result = await response.json();
  
    if (!response.ok) {
      throw new Error(result.message || 'API 요청 실패');
    }
  
    return result;
  }
  