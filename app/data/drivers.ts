import type { Driver } from '~/types/driver'

// Demo drivers. Each vehicle serves only the categories it fits.
export const DRIVERS: Driver[] = [
  { id: 'drv_001', name: 'Rajesh Kumar', avatar: 'RK', rating: 4.8, vehicle: 'Maruti Swift Dzire', vehicleNumber: 'UP 78 AB 1234', vehicleColor: 'White', totalRides: 1245, eta: 4, phone: '+919988776655', rideTypes: ['sedan'] },
  { id: 'drv_002', name: 'Suresh Verma', avatar: 'SV', rating: 4.7, vehicle: 'Toyota Etios', vehicleNumber: 'UP 32 CD 5678', vehicleColor: 'Silver', totalRides: 892, eta: 5, phone: '+919876543221', rideTypes: ['sedan'] },
  { id: 'drv_003', name: 'Amit Patel', avatar: 'AP', rating: 4.9, vehicle: 'Honda City', vehicleNumber: 'UP 65 EF 9012', vehicleColor: 'Black', totalRides: 2341, eta: 5, phone: '+919765432110', rideTypes: ['sedan'] },
  { id: 'drv_004', name: 'Vikram Singh', avatar: 'VS', rating: 4.6, vehicle: 'Maruti Alto', vehicleNumber: 'UP 78 GH 3456', vehicleColor: 'Red', totalRides: 567, eta: 4, phone: '+919654321009', rideTypes: ['mini'] },
  { id: 'drv_005', name: 'Deepak Gupta', avatar: 'DG', rating: 4.8, vehicle: 'Hyundai Xcent', vehicleNumber: 'UP 32 IJ 7890', vehicleColor: 'Blue', totalRides: 1678, eta: 5, phone: '+919543210998', rideTypes: ['sedan', 'mini'] },
  { id: 'drv_006', name: 'Mohit Sharma', avatar: 'MS', rating: 4.5, vehicle: 'Suzuki Access 125', vehicleNumber: 'UP 65 KL 2345', vehicleColor: 'Black', totalRides: 3456, eta: 2, phone: '+919432109887', rideTypes: ['bike'] },
  { id: 'drv_007', name: 'Ravi Tiwari', avatar: 'RT', rating: 4.7, vehicle: 'Bajaj RE Auto', vehicleNumber: 'UP 78 MN 6789', vehicleColor: 'Yellow-Green', totalRides: 2134, eta: 3, phone: '+919321098776', rideTypes: ['auto'] },
  { id: 'drv_008', name: 'Karan Yadav', avatar: 'KY', rating: 4.8, vehicle: 'Toyota Innova Crysta', vehicleNumber: 'UP 32 OP 0123', vehicleColor: 'White', totalRides: 987, eta: 7, phone: '+919210987665', rideTypes: ['suv'] },
  { id: 'drv_009', name: 'Arjun Mishra', avatar: 'AM', rating: 4.9, vehicle: 'Mercedes-Benz E-Class', vehicleNumber: 'UP 65 QR 4567', vehicleColor: 'Black', totalRides: 456, eta: 9, phone: '+919109876554', rideTypes: ['premium'] },
  { id: 'drv_010', name: 'Santosh Kumar', avatar: 'SK', rating: 4.6, vehicle: 'Honda Activa 6G', vehicleNumber: 'UP 78 ST 8901', vehicleColor: 'Red', totalRides: 4567, eta: 2, phone: '+919098765443', rideTypes: ['bike'] },
  { id: 'drv_011', name: 'Manish Dubey', avatar: 'MD', rating: 4.7, vehicle: 'Maruti Wagon R', vehicleNumber: 'UP 32 UV 2345', vehicleColor: 'White', totalRides: 1123, eta: 4, phone: '+918987654332', rideTypes: ['mini'] },
  { id: 'drv_012', name: 'Ajay Pandey', avatar: 'AJ', rating: 4.8, vehicle: 'Mahindra XUV700', vehicleNumber: 'UP 65 WX 6789', vehicleColor: 'Silver', totalRides: 789, eta: 8, phone: '+918876543221', rideTypes: ['suv'] },
  { id: 'drv_013', name: 'Imran Khan', avatar: 'IK', rating: 4.7, vehicle: 'Piaggio Ape Auto', vehicleNumber: 'UP 78 YZ 1122', vehicleColor: 'Yellow', totalRides: 1890, eta: 3, phone: '+918765432110', rideTypes: ['auto'] },
  { id: 'drv_014', name: 'Rohit Saxena', avatar: 'RS', rating: 4.9, vehicle: 'BMW 5 Series', vehicleNumber: 'UP 32 AA 7777', vehicleColor: 'Grey', totalRides: 312, eta: 10, phone: '+918654321009', rideTypes: ['premium'] },
]

export function driversFor(rideType: string | undefined): Driver[] {
  const pool = DRIVERS.filter(d => rideType && d.rideTypes.includes(rideType as Driver['rideTypes'][number]))
  return pool.length ? pool : DRIVERS
}

/** Masked display number for the simulated call screen, e.g. "+91 ••••• ••655". */
export function maskedDriverPhone(phone?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits.length >= 3 ? `+91 ••••• ••${digits.slice(-3)}` : '+91 ••••• •••••'
}
