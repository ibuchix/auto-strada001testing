
/**
 * Hook for fetching cars using React Query and our robust API client
 * 
 * Changes made:
 * - 2025-11-05: Created new hook for simplified car data fetching with React Query
 * - Integrated with apiClientService for automatic retries
 * - Added proper error handling and loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CarEntity, CarListingFormData } from '@/types/forms';
import { apiClient } from '@/services/api/apiClientService';
import { toast } from 'sonner';

/**
 * Hook for fetching a car by ID
 */
export function useCarQuery(carId: string | undefined) {
  return useQuery({
    queryKey: ['car', carId],
    queryFn: async () => {
      if (!carId) return null;
      
      const response = await apiClient.get<CarEntity>(`/api/cars/${carId}`, {
        silent: true
      });
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    enabled: !!carId,
    retry: 1
  });
}

/**
 * Hook for fetching multiple cars
 */
export function useCarsQuery(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: async () => {
      const queryParams = filters ? new URLSearchParams(filters).toString() : '';
      const url = `/api/cars${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiClient.get<CarEntity[]>(url, {
        silent: true
      });
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data || [];
    },
    retry: 1
  });
}

/**
 * Hook for creating a car listing
 */
export function useCreateCarListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (carData: CarListingFormData) => {
      const response = await apiClient.post<CarEntity>('/api/cars', carData, {
        silent: true
      });
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate the cars query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      
      // Add the new car to the cache
      if (data?.id) {
        queryClient.setQueryData(['car', data.id], data);
      }
      
      toast.success('Car listing created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create car listing', {
        description: error.message
      });
    }
  });
}

/**
 * Hook for updating a car listing
 */
export function useUpdateCarListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CarListingFormData> }) => {
      const response = await apiClient.put<CarEntity>(`/api/cars/${id}`, data, {
        silent: true
      });
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and update queries
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['cars'] });
        queryClient.setQueryData(['car', data.id], data);
      }
      
      toast.success('Car listing updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update car listing', {
        description: error.message
      });
    }
  });
}
