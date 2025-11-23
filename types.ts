export interface RateData {
  code: string;
  label: string;
  price: number;
}

export interface ApiResponse {
  current: RateData[];
  previous: RateData[];
  lastUpdated: string;
  previousUpdated?: string;
}

export interface DigitCounts {
  [digit: string]: number;
}
