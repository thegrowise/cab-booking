export interface Driver {
  id: string
  name: string
  avatar: string
  rating: number
  vehicle: string
  vehicleNumber: string
  vehicleColor: string
  totalRides: number
  eta: number
  phone?: string
  /** Ride categories this driver's vehicle serves */
  rideTypes: import('./ride').RideType[]
}
