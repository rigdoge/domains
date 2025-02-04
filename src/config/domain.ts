export interface DomainInfo {
  name: string;
  price: number;
  description: string;
}

// You can add multiple domains here
export const domains: Record<string, DomainInfo> = {
  facesome: {
    name: 'facesome.com',
    price: 50000,
    description: 'A premium social networking domain name.'
  },
  example: {
    name: 'example.com',
    price: 1000,
    description: 'Premium domain name available for purchase',
  },
  // Add more domains as needed
}; 