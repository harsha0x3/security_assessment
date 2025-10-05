export function getCSRFToken() {
  const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
  console.log(
    ":::::::::::::::::CSRF TOKEN IN UTILS:::::::::::::::",
    document.cookie
  );
  return match ? match[2] : null;
}
