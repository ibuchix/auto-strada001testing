import { md5 } from "js-md5";

export const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  return md5(apiId + apiSecret + vin);
};

export const isValidVin = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
};

export const isValidMileage = (mileage: string): boolean => {
  const mileageNum = Number(mileage);
  return (
    !isNaN(mileageNum) &&
    mileageNum > 0 &&
    mileageNum < 1000000 &&
    Number.isInteger(mileageNum) &&
    /^\d+$/.test(mileage)
  );
};