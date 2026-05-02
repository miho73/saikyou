import axios, {type AxiosInstance} from "axios";
import {getPrinciple} from "./principle";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_AXIOS_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(config => {
  const principle = getPrinciple();
  if (principle) config.headers["X-Principle"] = principle;
  return config;
});

export default api;
