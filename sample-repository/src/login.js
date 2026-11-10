export function handleLogin(event, authenticate) {
  event.preventDefault();
  const email = String(event.target.email.value).trim();
  const password = String(event.target.password.value);
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required' };
  }
  if (event.defaultPrevented) {
    return null;
  }
  return authenticate(email, password);
}
