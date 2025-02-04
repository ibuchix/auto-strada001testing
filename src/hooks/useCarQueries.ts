import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCarQueries = () => {
  const queryClient = useQueryClient();

  // Query for fetching cars with caching and error logging
  const useCarsList = () => {
    return useQuery({
      queryKey: ['cars'],
      queryFn: async () => {
        console.log('Fetching cars from database...');
        const session = await supabase.auth.getSession();
        console.log('Current Session:', session);

        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('is_draft', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase Error:', error);
          console.log('Auth Status:', await supabase.auth.getUser());
          throw error;
        }

        return data;
      },
      staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
      retry: 2,
      meta: {
        errorMessage: 'Failed to fetch cars'
      }
    });
  };

  // Query for fetching a single car with caching and error logging
  const useCarDetails = (carId: string | undefined) => {
    return useQuery({
      queryKey: ['car', carId],
      queryFn: async () => {
        if (!carId) return null;
        
        console.log('Fetching car details from database...');
        const session = await supabase.auth.getSession();
        console.log('Current Session:', session);

        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', carId)
          .single();

        if (error) {
          console.error('Supabase Error:', error);
          console.log('Auth Status:', await supabase.auth.getUser());
          throw error;
        }

        return data;
      },
      enabled: !!carId,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      meta: {
        errorMessage: 'Failed to fetch car details'
      }
    });
  };

  // Mutation for updating car data with error logging
  const useUpdateCar = () => {
    return useMutation({
      mutationFn: async ({ carId, data }: { carId: string; data: any }) => {
        console.log('Updating car in database...');
        const session = await supabase.auth.getSession();
        console.log('Current Session:', session);

        const { data: updatedCar, error } = await supabase
          .from('cars')
          .update(data)
          .eq('id', carId)
          .select()
          .single();

        if (error) {
          console.error('Supabase Error:', error);
          console.log('Auth Status:', await supabase.auth.getUser());
          throw error;
        }

        return updatedCar;
      },
      onSuccess: (_, variables) => {
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

  // Prefetch car details with error logging
  const prefetchCarDetails = async (carId: string) => {
    try {
      const session = await supabase.auth.getSession();
      console.log('Current Session for prefetch:', session);

      await queryClient.prefetchQuery({
        queryKey: ['car', carId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('cars')
            .select('*')
            .eq('id', carId)
            .single();

          if (error) {
            console.error('Supabase Prefetch Error:', error);
            console.log('Auth Status:', await supabase.auth.getUser());
            throw error;
          }

          return data;
        },
        staleTime: 1000 * 60 * 5
      });
    } catch (error) {
      console.error('Prefetch Error:', error);
    }
  };

  return {
    useCarsList,
    useCarDetails,
    useUpdateCar,
    prefetchCarDetails
  };
};