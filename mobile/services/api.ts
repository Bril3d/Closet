import axios from 'axios';

// For Android emulator, localhost is 10.0.2.2. For iOS it's localhost.
// We'll use a dynamic approach or just hardcode for now as it's a dev environment.
const BASE_URL = 'http://10.0.2.2:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;
