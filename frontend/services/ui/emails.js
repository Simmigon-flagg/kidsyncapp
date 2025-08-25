const API_URL = process.env.NEXT_PUBLIC_BASE_URL + '/emails'; // safer than hardcoding localhost

export async function fetchEmails() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Error Retrieving data');
  return res.json();
}

export async function updateEmailById(id, updatedEmail) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedEmail),
  });
  if (!res.ok) throw new Error('Failed to update Favorite');
  return res.json();
}
