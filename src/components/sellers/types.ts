import { ChangeEvent, FormEvent } from "react";

export interface SellerFormProps {
  vin: string;
  mileage: string;
  gearbox: string;
  isLoading: boolean;
  onVinChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onMileageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onGearboxChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}