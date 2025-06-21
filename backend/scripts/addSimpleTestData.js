"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/scripts/addSimpleTestData.ts
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// Simple closed trades only (no null values to avoid Prisma issues)
var testTrades = [
    {
        symbol: 'AAAA',
        direction: 'Long',
        quantity: 100,
        entryDate: new Date('2025-01-15'),
        entryTime: '09:30',
        entryPrice: 175.50,
        exitDate: new Date('2025-01-20'),
        exitTime: '15:45',
        exitPrice: 182.30,
        duration: '5 days',
        pnl: 680.00,
        percentChange: 3.87,
        orderType: 'Market',
        assessment: 'Good breakout trade',
        capital: 17550.00,
        brokerId: 1
    },
    {
        symbol: 'BBBB',
        direction: 'Short',
        quantity: 50,
        entryDate: new Date('2025-01-18'),
        entryTime: '10:15',
        entryPrice: 250.00,
        exitDate: new Date('2025-01-22'),
        exitTime: '14:20',
        exitPrice: 245.50,
        duration: '4 days',
        pnl: 225.00,
        percentChange: 1.8,
        orderType: 'Limit',
        assessment: 'Successful short',
        capital: 12500.00,
        brokerId: 2
    },
    {
        symbol: 'CCCC',
        direction: 'Long',
        quantity: 60,
        entryDate: new Date('2025-01-12'),
        entryTime: '09:45',
        entryPrice: 142.80,
        exitDate: new Date('2025-01-16'),
        exitTime: '13:30',
        exitPrice: 147.90,
        duration: '4 days',
        pnl: 306.00,
        percentChange: 3.57,
        orderType: 'Market',
        assessment: 'Solid swing trade',
        capital: 8568.00,
        brokerId: 3
    },
    {
        symbol: 'DDDD',
        direction: 'Short',
        quantity: 80,
        entryDate: new Date('2025-01-20'),
        entryTime: '14:00',
        entryPrice: 155.00,
        exitDate: new Date('2025-01-24'),
        exitTime: '10:30',
        exitPrice: 152.30,
        duration: '4 days',
        pnl: 216.00,
        percentChange: 1.74,
        orderType: 'Stop',
        assessment: 'Good timing on weakness',
        capital: 12400.00,
        brokerId: 2
    },
    {
        symbol: 'EEEE',
        direction: 'Long',
        quantity: 25,
        entryDate: new Date('2025-01-10'),
        entryTime: '09:30',
        entryPrice: 875.00,
        exitDate: new Date('2025-01-14'),
        exitTime: '15:00',
        exitPrice: 920.50,
        duration: '4 days',
        pnl: 1137.50,
        percentChange: 5.2,
        orderType: 'Market',
        assessment: 'Excellent AI momentum play',
        capital: 21875.00,
        brokerId: 1
    },
    {
        symbol: 'FFFF',
        direction: 'Long',
        quantity: 200,
        entryDate: new Date('2025-01-22'),
        entryTime: '10:00',
        entryPrice: 475.20,
        exitDate: new Date('2025-01-26'),
        exitTime: '15:30',
        exitPrice: 478.90,
        duration: '4 days',
        pnl: 740.00,
        percentChange: 0.78,
        orderType: 'Market',
        assessment: 'Safe index play',
        capital: 95040.00,
        brokerId: 3
    }
];
function addSimpleTestData() {
    return __awaiter(this, void 0, void 0, function () {
        var brokerCount, existingTrades, _i, testTrades_1, trade, createdTrade, error_1, totalTrades, totalPnL, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 13, 14, 16]);
                    console.log('🚀 Starting to add simple test data...');
                    return [4 /*yield*/, prisma.broker.count()];
                case 1:
                    brokerCount = _b.sent();
                    if (brokerCount === 0) {
                        console.log('❌ No brokers found! Run the broker seed first: npx ts-node prisma/seed.ts');
                        return [2 /*return*/];
                    }
                    console.log("\u2705 Found ".concat(brokerCount, " brokers"));
                    return [4 /*yield*/, prisma.trade.count()];
                case 2:
                    existingTrades = _b.sent();
                    if (!(existingTrades > 0)) return [3 /*break*/, 4];
                    console.log("\u26A0\uFE0F  Found ".concat(existingTrades, " existing trades. Deleting them first..."));
                    return [4 /*yield*/, prisma.trade.deleteMany()];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    // Add test trades one by one
                    console.log('📊 Adding test trades...');
                    _i = 0, testTrades_1 = testTrades;
                    _b.label = 5;
                case 5:
                    if (!(_i < testTrades_1.length)) return [3 /*break*/, 10];
                    trade = testTrades_1[_i];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, prisma.trade.create({
                            data: trade
                        })];
                case 7:
                    createdTrade = _b.sent();
                    console.log("\u2705 Added trade: ".concat(createdTrade.symbol, " (").concat(createdTrade.direction, ") - P&L: $").concat(createdTrade.pnl));
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _b.sent();
                    console.error("\u274C Error adding trade ".concat(trade.symbol, ":"), error_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10: return [4 /*yield*/, prisma.trade.count()];
                case 11:
                    totalTrades = _b.sent();
                    return [4 /*yield*/, prisma.trade.aggregate({
                            _sum: { pnl: true }
                        })];
                case 12:
                    totalPnL = _b.sent();
                    console.log('\n🎉 Test data added successfully!');
                    console.log("\uD83D\uDCCA Total trades: ".concat(totalTrades));
                    console.log("\uD83D\uDCB0 Total P&L: $".concat(((_a = totalPnL._sum.pnl) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 0));
                    console.log('\n🚀 You can now test your trading journal!');
                    console.log('💡 All trades are closed trades - you can add open trades manually via Prisma Studio if needed');
                    return [3 /*break*/, 16];
                case 13:
                    error_2 = _b.sent();
                    console.error('❌ Error adding test data:', error_2);
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, prisma.$disconnect()];
                case 15:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 16: return [2 /*return*/];
            }
        });
    });
}
// Run the script
addSimpleTestData();
