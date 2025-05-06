
/**
 * VIN Reservation Service Index
 * Created: 2025-05-06 - Consolidated export of VIN reservation services
 */

export * from "./vinStatusChecker";

// Re-export the existing vinReservationService functions for backwards compatibility
export { reserveVin, checkVinReservation, extendVinReservation, cancelVinReservation, useVinReservation } from "../vinReservationService";
