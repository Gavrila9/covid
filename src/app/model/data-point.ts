export interface DataPoint {
  age: number;
  city: string;
  confirmed_date: string;
  latitude: string;
  longitude: string;
  name: string;
  province: string;
  sex: string;
  status: string;
}

export enum Status {
  confirmed= 'confirmed',
  death= 'death',
  suspected= 'suspected',
  cured= 'cured',
}
