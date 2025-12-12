import axios from 'axios';

export function useApi() {
  const instance = axios.create({
    baseURL: '/api'
  });
  return instance;
}
