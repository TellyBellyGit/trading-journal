// frontend/src/types/Trade.ts

export interface Broker {
  id: number;
  name: string;
  displayName: string;
  accountType?: string;
  accountId?: string;
  isActive: boolean;
  defaultCommission?: number;
  commissionType?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    trades: number;
  };
}

export interface Trade {
  id: number;
  symbol: string;
  direction: string;
  quantity: number;
  entryDate: string; // ISO date string
  entryTime: string;
  entryPrice: number;
  exitDate: string; // ISO date string
  exitTime: string;
  exitPrice: number;
  duration: string;
  pnl: number;
  percentChange: number;
  orderType: string;
  assessment?: string;
  capital: number;
  status?: string;
  // 🔥 NEW: Broker relationship
  brokerId: number;
  broker?: Broker;
  // 🔥 NEW: Journal fields
  notes?: string;          // Rich text HTML content
  strategy?: string;       // Trading strategy
  riskReward?: string;     // Risk:Reward ratio
  commission?: number;     // Commission/fees
  tags?: string;           // Comma-separated tags
  // 🔥 NEW: Additional trade metadata
  tradeId?: string;        // Broker's trade confirmation number
  executionVenue?: string; // Where trade was executed
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface NewTrade {
  symbol: string;
  direction: string;
  quantity: number;
  entryDate: string;
  entryTime: string;
  entryPrice: number;
  exitDate: string;
  exitTime: string;
  exitPrice: number;
  duration: string;
  pnl: number;
  percentChange: number;
  orderType: string;
  assessment?: string;
  capital: number;
  status?: string;  
  // Broker is required for new trades
  brokerId: number;
  // Journal fields (optional for new trades)
  notes?: string;
  strategy?: string;
  riskReward?: string;
  commission?: number;
  tags?: string;
  // Additional metadata
  tradeId?: string;
  executionVenue?: string;
}

// 🔥 NEW: Filter interface for search
//export interface TradeFilters {
 // symbol?: string;
 // direction?: string;
 // strategy?: string;
 // dateFrom?: string;
 // dateTo?: string;
 // minPnL?: string;
 // maxPnL?: string;
 // tags?: string;
 // brokerId?: string;  // Filter by broker
  //status?: string;   // Filter by trade status
//}

export interface TradeFilters {
  symbol?: string;
  direction?: string;
  strategy?: string;
  fromDate?: string;
  //dateFrom?: string;
  //dateTo?: string;
  //startDate?: string;      // 🔥 ADD
  //endDate?: string;        // 🔥 ADD
  //minPnL?: string;
  //maxPnL?: string;
  tags?: string;
  brokerId?: string;
  status?: string;         // 🔥 ADD
  hasNotes?: boolean;      // 🔥 ADD
  hasAssessment?: boolean; // 🔥 ADD
  
}

// 🔥 NEW: Statistics interface
//export interface TradeStats {
 // totalTrades: number;
 // totalPnL: number;
 // netPnL: number;
 // winningTrades: number;
 // losingTrades: number;
 // winRate: number;
 // avgPnL: number;
 // totalCommission: number;
 // brokerBreakdown?: Array<{
 //   brokerId: number;
 //   _sum: { pnl: number; commission: number };
 //   _count: { id: number };
  //  broker: { name: string; displayName: string };
  //}>;
//}

export interface TradeStats {
  totalTrades: number;
  totalPnL: number;
  netPnL: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgPnL: number;
  totalCommission: number;
  openTrades: number;        // ← Make sure this line exists
  closedTrades?: number;     // ← Optional since you might not be using it everywhere
  brokerBreakdown?: Array<{
    brokerId: number;
    _sum: { pnl: number; commission: number };
    _count: { id: number };
    broker: { name: string; displayName: string };
  }>;
}



// 🔥 NEW: Broker-specific statistics
export interface BrokerStats {
  broker: Broker;
  stats: {
    totalTrades: number;
    totalPnL: number;
    netPnL: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgPnL: number;
    totalCommission: number;
    avgDuration: number;
  };
}