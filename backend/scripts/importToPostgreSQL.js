const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('Importing data to PostgreSQL...');
    
    // Read exported data
    const exportPath = path.join(__dirname, 'sqlite-export.json');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    console.log(`Found ${exportData.brokers.length} brokers, ${exportData.trades.length} trades, ${exportData.notes.length} notes`);
    
    // Clear existing data (optional - be careful!)
    console.log('Clearing existing data...');
    await prisma.trade.deleteMany();
    await prisma.broker.deleteMany();
    await prisma.note.deleteMany();
    
    // Import brokers first (due to foreign key relationship)
    console.log('Importing brokers...');
    for (const broker of exportData.brokers) {
      await prisma.broker.create({
        data: {
          id: broker.id,
          name: broker.name,
          displayName: broker.displayName,
          accountType: broker.accountType,
          accountId: broker.accountId,
          isActive: broker.isActive,
          defaultCommission: broker.defaultCommission,
          commissionType: broker.commissionType,
          createdAt: new Date(broker.createdAt),
          updatedAt: new Date(broker.updatedAt)
        }
      });
    }
    
    // Import trades
    console.log('Importing trades...');
    for (const trade of exportData.trades) {
      await prisma.trade.create({
        data: {
          id: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          quantity: trade.quantity,
          entryDate: new Date(trade.entryDate),
          entryTime: trade.entryTime,
          entryPrice: trade.entryPrice,
          exitDate: new Date(trade.exitDate),
          exitTime: trade.exitTime,
          exitPrice: trade.exitPrice,
          duration: trade.duration,
          pnl: trade.pnl,
          percentChange: trade.percentChange,
          orderType: trade.orderType,
          assessment: trade.assessment,
          capital: trade.capital,
          status: trade.status,
          brokerId: trade.brokerId,
          notes: trade.notes,
          strategy: trade.strategy,
          riskReward: trade.riskReward,
          commission: trade.commission,
          tags: trade.tags,
          tradeId: trade.tradeId,
          executionVenue: trade.executionVenue,
          createdAt: new Date(trade.createdAt),
          updatedAt: new Date(trade.updatedAt)
        }
      });
    }
    
    // Import notes
    console.log('Importing notes...');
    for (const note of exportData.notes) {
      await prisma.note.create({
        data: {
          id: note.id,
          title: note.title,
          content: note.content,
          category: note.category,
          tags: note.tags,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }
      });
    }
    
    console.log('Data import completed successfully!');
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();