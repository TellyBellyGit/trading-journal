// utils/csvProcessor.ts

export class CSVProcessor {
  /**
   * Extract trade history section from broker statement CSV
   * Mimics the Python extract_trade_history function
   */
  public static extractTradeHistory(csvContent: string): string {
    const lines = csvContent.split('\n');
    let foundTradeHistory = false;
    let nextIsHeader = false;
    const rowsToWrite: string[] = [];

    for (const line of lines) {
      // Check if this line contains "Account Trade History"
      //if (line.includes('Account Trade History')) {
      const cells = line.split(',');
      if (cells.some(cell => cell.includes('Account Trade History'))) {
        console.log("🔍 Found Account Trade History section!");
        foundTradeHistory = true;
        nextIsHeader = true;
        continue;
      }

      // If we found the trade history section
      if (nextIsHeader) {
        rowsToWrite.push(line);
        nextIsHeader = false;
        continue;
      }

      // Continue collecting rows until we hit an empty line
      if (foundTradeHistory) {
        // Check if line is empty or contains only whitespace/commas
        if (line.trim() === '' || line.replace(/,/g, '').trim() === '') {
          break;
        }
        rowsToWrite.push(line);
      }
    }

    return rowsToWrite.join('\n');
  }

  /**
   * Validate CSV format and required columns
   */
  public static validateCSVFormat(csvContent: string): {
    isValid: boolean;
    error?: string;
    missingColumns?: string[];
  } {
    try {
      const extractedContent = this.extractTradeHistory(csvContent);
      const lines = extractedContent.trim().split('\n');
      
      if (lines.length === 0) {
        return {
          isValid: false,
          error: 'No trade history section found in CSV file'
        };
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredColumns = [
        'symbol',
        'side', 
        'qty',
        'pos effect',
        'net price',
        'exec time'
      ];

      const missingColumns = requiredColumns.filter(col => 
        !headers.some(header => header.includes(col))
      );

      if (missingColumns.length > 0) {
        return {
          isValid: false,
          error: 'Missing required columns',
          missingColumns
        };
      }

      // Check if we have data rows
      if (lines.length < 2) {
        return {
          isValid: false,
          error: 'No trade data found in CSV file'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `CSV validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get preview of trades for validation
   */
  public static getTradePreview(csvContent: string, maxRows: number = 5): {
    headers: string[];
    rows: string[][];
    totalRows: number;
  } {
    const extractedContent = this.extractTradeHistory(csvContent);
    const lines = extractedContent.trim().split('\n');
    
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);
    const previewRows = dataLines.slice(0, maxRows).map(line => 
      line.split(',').map(cell => cell.trim())
    );

    return {
      headers,
      rows: previewRows,
      totalRows: dataLines.length
    };
  }

  /**
   * Clean and standardize CSV data
   */
  public static cleanCSVData(csvContent: string): string {
    let extractedContent = this.extractTradeHistory(csvContent);
    
    // Split into lines and clean each line
    const lines = extractedContent.split('\n');
    const cleanedLines = lines.map(line => {
      // Remove extra whitespace and standardize
      return line.split(',').map(cell => cell.trim()).join(',');
    }).filter(line => line.length > 0); // Remove empty lines

    return cleanedLines.join('\n');
  }

  /**
   * Detect duplicate trades based on symbol, time, and quantity
   */
  public static detectDuplicates(trades: any[]): {
    duplicates: any[];
    unique: any[];
  } {
    const seen = new Set<string>();
    const duplicates: any[] = [];
    const unique: any[] = [];

    for (const trade of trades) {
      // Create a unique key for each trade
      const key = `${trade.symbol}-${trade.execTime}-${trade.qty}-${trade.netPrice}`;
      
      if (seen.has(key)) {
        duplicates.push(trade);
      } else {
        seen.add(key);
        unique.push(trade);
      }
    }

    return { duplicates, unique };
  }

  /**
   * Process file and return structured data
   */
  public static async processFile(file: File): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    details?: string[];
  }> {
    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error: 'File too large',
          details: ['Please select a file smaller than 10MB']
        };
      }

      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return {
          success: false,
          error: 'Invalid file format',
          details: ['Please select a CSV file']
        };
      }

      // Read file content
      const content = await this.readFileAsText(file);
      
      // Validate format
      const validation = this.validateCSVFormat(content);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid CSV format',
          details: validation.missingColumns ? 
            [`Missing columns: ${validation.missingColumns.join(', ')}`] : undefined
        };
      }

      // Clean and return data
      const cleanedData = this.cleanCSVData(content);
      return {
        success: true,
        data: cleanedData
      };

    } catch (error) {
      return {
        success: false,
        error: 'Failed to process file',
        details: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Helper to read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Convert trades to database preview format
   */
  public static createPreviewData(trades: any[]): {
    symbol: string;
    direction: string;
    quantity: number;
    entryDate: string;
    entryPrice: number;
    exitPrice: number | null;
    pnl: number;
    status: string;
  }[] {
    return trades.slice(0, 10).map(trade => ({
      symbol: trade.symbol,
      direction: trade.direction,
      quantity: trade.quantity,
      entryDate: new Date(trade.entryTime).toLocaleDateString(),
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      status: trade.status
    }));
  }
}