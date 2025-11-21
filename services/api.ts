import { ApiResponse } from '../types';

export const fetchRates = async (key: string): Promise<ApiResponse> => {
  // We call our own API route which acts as a proxy + DB manager
  const response = await fetch(`/api/rates?key=${encodeURIComponent(key)}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}: Failed to fetch rates`);
  }

  return response.json();
};