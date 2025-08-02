import axios, { AxiosResponse, AxiosRequestConfig, AxiosPromise } from 'axios';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const request = <TRequest, TResponse>(
  options: AxiosRequestConfig,
  data?: TRequest,
): AxiosPromise<TResponse> => {
  const onSuccess = (response: AxiosResponse<TResponse>) => response;
  const onError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('Whoops! there is an error');
  };

  return axiosClient({
    ...options,
    data,
  })
    .then(onSuccess)
    .catch(onError);
};
