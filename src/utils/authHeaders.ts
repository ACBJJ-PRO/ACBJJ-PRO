export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  try {
    const sessionStr = localStorage.getItem('arena_session') || sessionStorage.getItem('arena_session');
    if (sessionStr) {
      const user = JSON.parse(sessionStr);
      if (user) {
        const token = user.token || (user.uid ? `token-${user.uid}` : (user.id ? `token-${user.id}` : ''));
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
  } catch (err) {
    console.warn('[authHeaders] Error reading session from storage:', err);
  }

  return headers;
}
