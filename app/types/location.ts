export interface Place {
  id: string
  name: string
  address: string
  area: string
  city: string
  state: string
  lat: number
  lng: number
  type?: 'home' | 'work' | 'other'
}
