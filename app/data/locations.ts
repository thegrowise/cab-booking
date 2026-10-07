import type { Place } from '~/types/location'

export const KANPUR_LOCATIONS: Place[] = [
  { id: 'loc_001', name: 'Kanpur Central Railway Station', address: 'Station Rd, Kanpur Central', area: 'Kanpur Central', city: 'Kanpur', state: 'UP', lat: 26.4499, lng: 80.3319 },
  { id: 'loc_002', name: 'Swaroop Nagar', address: 'Swaroop Nagar Main Market', area: 'Swaroop Nagar', city: 'Kanpur', state: 'UP', lat: 26.4833, lng: 80.3497 },
  { id: 'loc_003', name: 'Kidwai Nagar', address: 'Kidwai Nagar Crossing', area: 'Kidwai Nagar', city: 'Kanpur', state: 'UP', lat: 26.4717, lng: 80.3322 },
  { id: 'loc_004', name: 'Govind Nagar', address: 'Govind Nagar Bus Stand', area: 'Govind Nagar', city: 'Kanpur', state: 'UP', lat: 26.4532, lng: 80.3178 },
  { id: 'loc_005', name: 'Civil Lines', address: 'Civil Lines, Kanpur', area: 'Civil Lines', city: 'Kanpur', state: 'UP', lat: 26.4695, lng: 80.3464 },
  { id: 'loc_006', name: 'Kalyanpur', address: 'Kalyanpur Main Road', area: 'Kalyanpur', city: 'Kanpur', state: 'UP', lat: 26.5064, lng: 80.2981 },
  { id: 'loc_007', name: 'Rawatpur', address: 'Rawatpur Colony, Kanpur', area: 'Rawatpur', city: 'Kanpur', state: 'UP', lat: 26.4937, lng: 80.3142 },
  { id: 'loc_008', name: 'Barra', address: 'Barra 8, Kanpur', area: 'Barra', city: 'Kanpur', state: 'UP', lat: 26.4167, lng: 80.3333 },
  { id: 'loc_009', name: 'Shastri Nagar', address: 'Shastri Nagar Market', area: 'Shastri Nagar', city: 'Kanpur', state: 'UP', lat: 26.4588, lng: 80.3248 },
  { id: 'loc_010', name: 'Kakadeo', address: 'Kakadeo Crossing', area: 'Kakadeo', city: 'Kanpur', state: 'UP', lat: 26.4642, lng: 80.2909 },
  { id: 'loc_011', name: 'LNMIIT Campus', address: 'LNM Institute, Kanpur', area: 'Raipur', city: 'Kanpur', state: 'UP', lat: 26.5123, lng: 80.2856 },
  { id: 'loc_012', name: 'IIT Kanpur', address: 'IIT Kanpur Main Gate', area: 'Kalyanpur', city: 'Kanpur', state: 'UP', lat: 26.5123, lng: 80.2329 },
  { id: 'loc_013', name: 'Armapur', address: 'Armapur Estate', area: 'Armapur', city: 'Kanpur', state: 'UP', lat: 26.4843, lng: 80.2784 },
  { id: 'loc_014', name: 'Panki Industrial Area', address: 'Panki Power House Road', area: 'Panki', city: 'Kanpur', state: 'UP', lat: 26.4386, lng: 80.2752 },
  { id: 'loc_015', name: 'Naubasta', address: 'Naubasta Market', area: 'Naubasta', city: 'Kanpur', state: 'UP', lat: 26.5321, lng: 80.3456 },
  { id: 'loc_016', name: 'GT Road Kanpur', address: 'Grand Trunk Road, Kanpur', area: 'GT Road', city: 'Kanpur', state: 'UP', lat: 26.4214, lng: 80.3645 },
  { id: 'loc_017', name: 'Fazalganj', address: 'Fazalganj Market', area: 'Fazalganj', city: 'Kanpur', state: 'UP', lat: 26.4381, lng: 80.3512 },
  { id: 'loc_018', name: 'Colonelganj', address: 'Colonelganj Chowk', area: 'Colonelganj', city: 'Kanpur', state: 'UP', lat: 26.4612, lng: 80.3421 },
  { id: 'loc_019', name: 'Juhi', address: 'Juhi Purwa, Kanpur', area: 'Juhi', city: 'Kanpur', state: 'UP', lat: 26.5134, lng: 80.3789 },
  { id: 'loc_020', name: 'Lal Bangla', address: 'Lal Bangla Chowk', area: 'Lal Bangla', city: 'Kanpur', state: 'UP', lat: 26.4723, lng: 80.3621 },
  { id: 'loc_021', name: 'Vikas Nagar', address: 'Vikas Nagar Colony', area: 'Vikas Nagar', city: 'Kanpur', state: 'UP', lat: 26.4912, lng: 80.3234 },
  { id: 'loc_022', name: 'Harsh Nagar', address: 'Harsh Nagar Market', area: 'Harsh Nagar', city: 'Kanpur', state: 'UP', lat: 26.4543, lng: 80.3081 },
]

export function searchLocations(query: string): Place[] {
  if (!query || query.length < 2) return KANPUR_LOCATIONS.slice(0, 8)
  const q = query.toLowerCase()
  return KANPUR_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.area.toLowerCase().includes(q) ||
    l.address.toLowerCase().includes(q)
  )
}
