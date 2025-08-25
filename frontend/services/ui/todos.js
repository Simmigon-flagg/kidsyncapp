export async function fetchTodos(params) {
  const urlParams = new URLSearchParams(params).toString();
  const res = await fetch(`/api/todos?${urlParams}`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(todoData) {
  const res = await fetch(`/api/todos`, {
    method: 'POST',
    body: todoData,
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function updateTodo(todoId, updatedData) {
  const res = await fetch(`/api/todos/${todoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function deleteTodo(todoId) {
  const res = await fetch(`/api/todos/${todoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete todo');
  return res.json();
}

export async function toggleFavorite(todoId, todo) {
  const res = await fetch(`/api/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fav: !todo.fav }),
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
}

export async function saveUploadedFileService(todoId, file) {
  if (!file) return { success: false, error: 'No file provided' };

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    // Upload file
    const res = await fetch(`/api/todos/${todoId}/upload`, {
      method: 'POST',
      body: formDataToSend,
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Upload error:', error);
      return { success: false, error };
    }

    // Fetch updated todo
    const updatedRes = await fetch(`/api/todos/${todoId}`);
    if (!updatedRes.ok) throw new Error('Failed to fetch updated todo');

    const updatedTodoData = await updatedRes.json();

    return { success: true, todo: updatedTodoData.todo };
  } catch (err) {
    console.error('Error uploading file:', err);
    return { success: false, error: err };
  }
}
