const config = {
  apiUrl: import.meta.env.VITE_NODE_ENV === 'development'
    ? import.meta.env.VITE_API_URL
    : '/api',
  // ... other configurations
};

export default config; 