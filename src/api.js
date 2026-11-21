async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed with status ${response.status}.`);
  return result;
}

export const getProducts = () => request('/products');
export const sendContact = values => request('/contact', {
  method: 'POST',
  body: JSON.stringify(values)
});
export const createOrder = items => request('/orders', {
  method: 'POST',
  body: JSON.stringify({ items })
});
