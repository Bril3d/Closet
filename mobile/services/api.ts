import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (__DEV__) {
    // Get the machine's IP where the Expo Metro bundler is running
    const debuggerHost = Constants.expoConfig?.hostUri;

    if (debuggerHost) {
      // Extract the IP and append the FastAPI port (8000)
      const localhost = debuggerHost.split(':')[0];
      return `http://${localhost}:8000/api/v1`;
    }

    // Fallback
    return Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://127.0.0.1:8000/api/v1';
  }

  return 'https://api.yourdomain.com/api/v1'; // Placeholder for production
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

console.log('Final API Base URL:', api.defaults.baseURL);

export default api;
