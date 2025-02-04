export interface DomainInfo {
  name: string;
  minBid: number;  // 最低出价
  currentBid?: number;  // 当前最高出价
  description: string;
}

export const domains: Record<string, DomainInfo> = {
  facesome: {
    name: 'facesome.com',
    minBid: 50000,
    description: 'A premium social networking domain name.'
  },
  example: {
    name: 'tqdi.com',
    minBid: 9999,
    description: 'Premium domain name available for purchase',
  },
  // Add more domains as needed
}; 