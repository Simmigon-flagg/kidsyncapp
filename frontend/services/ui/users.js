export async function getUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return await res.json();
}

export async function updateUser(id, updatedData) {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
}

export async function updateUserImage(id, file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`/api/users/images/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to update user image');
  return await res.json();
}

export async function fetchSessionAndSetRefreshCookie() {
  const sessionRes = await fetch('/api/auth/session');
  const session = await sessionRes.json();

  const refreshToken = session?.user?.refreshToken;

  if (refreshToken) {
    await fetch('/api/auth/set-refresh-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  }
}

export async function forgotPassword(email) {
  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Error sending reset link');
  }

  return true;
}

export async function checkUserExists(email) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to check user existence');
  }

  const data = await response.json();
  return data.userExists;
}

export async function signupUser(user) {
  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error('User registration failed');
  }

  return true;
}

// services/ui/users.js
export async function resetPassword(token, newPassword) {
  const res = await fetch('/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to reset password');
  }

  return res.json();
}

// services/ui/users.js
export async function signup({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error('Please fill in all fields');
  }

  // Check if user exists
  const resUserExists = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const { userExists } = await resUserExists.json();
  if (userExists) {
    throw new Error('User already exists');
  }

  // Create user
  const resSignup = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!resSignup.ok) {
    throw new Error('User registration failed');
  }

  return true;
}
