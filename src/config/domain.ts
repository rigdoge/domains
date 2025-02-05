export interface DomainInfo {
  name: string;
  minBid: number;  // Reference price
  currentBid?: number;  // Current highest bid
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
    minBid: 999,
    description: 'Premium domain name available for purchase',
  },
  // Add more domains as needed
};

export function getDomainInfo(): DomainInfo {
  // 不再从 hostname 获取域名信息
  // 而是从 URL 参数或者其他方式获取要销售的域名
  return {
    name: 'tqdi.com',
    minBid: 999,
    description: 'Premium domain name available for purchase'
  };
} 