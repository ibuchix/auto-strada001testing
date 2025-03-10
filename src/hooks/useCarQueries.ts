import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCarQueries = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cars, setCars] = useState<any[]>([]);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')  // Changed from car_listings to cars
        .select('*')
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  };

  const fetchCarById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching car by ID:', error);
      throw error;
    }
  };

  const updateQuery = async (filters: any) => {
    try {
      let query = supabase
        .from('cars')  // Changed from car_listings to cars
        .select('*')
        .eq('is_draft', false);

      if (filters.make && filters.make !== 'all') {
        query = query.eq('make', filters.make);
      }

      if (filters.model && filters.model !== 'all') {
        query = query.eq('model', filters.model);
      }

      if (filters.minYear) {
        query = query.gte('year', filters.minYear);
      }

      if (filters.maxYear) {
        query = query.lte('year', filters.maxYear);
      }

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.transmission && filters.transmission !== 'all') {
        query = query.eq('transmission', filters.transmission);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating query:', error);
      throw error;
    }
  };

  const executeQuery = async (filters: any = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await updateQuery(filters);
      setCars(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching cars');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cars,
    isLoading,
    error,
    executeQuery,
    fetchCars,
    fetchCarById
  };
};
