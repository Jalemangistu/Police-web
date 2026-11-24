const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = res.status === 204 ? null : await res.json();
    if (!res.ok) throw new Error(data?.message || 'Request failed');
    return data;
};

export default API;
