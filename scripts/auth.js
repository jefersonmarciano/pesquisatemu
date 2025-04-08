// Function to check authentication
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  const email = localStorage.getItem('userEmail');
  
  if (!token || !email) {
    return null;
  }
  
  const validEmail = await verifyToken(token);
  if (!validEmail || validEmail !== email) {
    logout();
    return null;
  }
  
  return email;
}

// Function to logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
}