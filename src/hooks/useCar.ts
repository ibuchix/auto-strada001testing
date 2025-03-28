
/**
 * useCar hook
 * 
 * Provides functionality for fetching and working with car data
 * Includes type checking to ensure API responses match expected types
 */

import { useState, useEffect } from 'react';
import { CarEntity } from '@/types/forms';
import { fetchCarById, fetchCars } from '@/services/api/carApiService';

/**
 * Hook for fetching a single car by ID
 * @param id The ID of the car to fetch
 * @returns Object containing the car data, loading state, and error message
 */
export const useCar = (id: string) => {
  const [car, setCar] = useState<CarEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCar = async () => {
      try {
        setIsLoading(true);
        const carData = await fetchCarById(id);
        setCar(carData);
        setError(null);
      } catch (err) {
        console.error('Error loading car:', err);
        setError('Failed to load car details');
        setCar(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadCar();
    } else {
      setError('No car ID provided');
      setIsLoading(false);
    }
  }, [id]);
  
  return { car, isLoading, error };
};

/**
 * Hook for fetching multiple cars
 * @returns Object containing the cars array, loading state, and error message
 */
export const useCars = () => {
  const [cars, setCars] = useState<CarEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCars = async () => {
      try {
        setIsLoading(true);
        const carsData = await fetchCars();
        setCars(carsData);
        setError(null);
      } catch (err) {
        console.error('Error loading cars:', err);
        setError('Failed to load car listings');
        setCars([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCars();
  }, []);
  
  return { cars, isLoading, error };
};
