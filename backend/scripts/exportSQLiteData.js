const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Exporting SQLite data...');
    
    // Export brokers
    const brokers = await prisma.broker.findMany();
    console.log(`Found ${brokers.length} brokers`);
    
    // Export trades
    const trades = await prisma.trade.findMany();
    console.log(`Found ${trades.length} trades`);
    
    // Export notes
    const notes = await prisma.note.findMany();
    console.log(`Found ${notes.length} notes`);
    
    // Create export data
    const exportData = {
      brokers,
      trades,
      notes,
      exportDate: new Date().toISOString()
    };
    
    // Write to file
    const exportPath = path.join(__dirname, 'sqlite-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`Data exported to: ${exportPath}`);
    console.log('Export completed successfully!');
    
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();