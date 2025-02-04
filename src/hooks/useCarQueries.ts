import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCarQueries = () => {
  const queryClient = useQueryClient();

  // Query for fetching cars with caching
  const useCarsList = () => {
    return useQuery({
      queryKey: ['cars'],
      queryFn: async () => {
        console.log('Fetching cars from database...');
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('is_draft', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching cars:', error);
          throw error;
        }

        return data;
      },
      staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
      retry: 2,
      onError: (error: any) => {
        toast.error('Failed to fetch cars', {
          description: error.message
        });
      }
    });
  };

  // Query for fetching a single car with caching
  const useCarDetails = (carId: string | undefined) => {
    return useQuery({
      queryKey: ['car', carId],
      queryFn: async () => {
        if (!carId) return null;
        
        console.log('Fetching car details from database...');
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', carId)
          .single();

        if (error) {
          console.error('Error fetching car details:', error);
          throw error;
        }

        return data;
      },
      enabled: !!carId,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      onError: (error: any) => {
        toast.error('Failed to fetch car details', {
          description: error.message
        });
      }
    });
  };

  // Mutation for updating car data with cache invalidation
  const useUpdateCar = () => {
    return useMutation({
      mutationFn: async ({ carId, data }: { carId: string; data: any }) => {
        console.log('Updating car in database...');
        const { data: updatedCar, error } = await supabase
          .from('cars')
          .update(data)
          .eq('id', carId)
          .select()
          .single();

        if (error) {
          console.error('Error updating car:', error);
          throw error;
        }

        return updatedCar;
      },
      onSuccess: (_, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['cars'] });
        queryClient.invalidateQueries({ queryKey: ['car', variables.carId] });
        toast.success('Car updated successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to update car', {
          description: error.message
        });
      }
    });
  };

  // Prefetch car details
  const prefetchCarDetails = async (carId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['car', carId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', carId)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5
    });
  };

  return {
    useCarsList,
    useCarDetails,
    useUpdateCar,
    prefetchCarDetails
  };
};