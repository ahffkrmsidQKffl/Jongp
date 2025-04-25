export async function apiRequest(endpoint, method = 'GET', data = null, userEmail = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // 👉 개발 모드일 때만 사용자 이메일 헤더 추가
  if (process.env.NODE_ENV === 'development' && userEmail) {
    headers['x-user-email'] = userEmail;
  }

  const options = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) }),
  };

  const response = await fetch(`${endpoint}`, options);
  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result.message || `API 요청 실패 (${response.status})`;
    throw new Error(errorMessage);
  }

  return result;
}
