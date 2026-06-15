// ChartDiagnosticsModal.tsx
// Full-screen diagnostic overlay showing the complete time conversion journey.
// Appears when the 📉 button is clicked on the AllTrades panel.
// Allows adjusting entry/exit times before continuing to the chart.

import React, { useState, useEffect, useCallback } from 'react';
import { marketApi } from '../../api/market';

interface ChartDiagnosticsModalProps {
  trade: {
    symbol: string;
    entryDate: string;
    entryTime?: string;
    entryPrice?: number;
    exitDate?: string | null;
    exitTime?: string | null;
    exitPrice?: number | null;
  };
  onContinue: (params: {
    symbol: string;
    entryDate: string;
    entryTime?: string;
    entryPrice?: number;
    exitDate?: string | null;
    exitTime?: string | null;
    exitPrice?: number | null;
  }) => void;
  onCancel: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────

function parseUkTime(dateStr: string, timeStr?: string): { iso: string; ts: number } | null {
  if (!timeStr) {
    // Try direct parse (ISO date)
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return { iso: d.toISOString(), ts: Math.floor(d.getTime() / 1000) };
  }
  const datePart = dateStr.split('T')[0];
  const d = new Date(`${datePart}T${timeStr}`);
  if (isNaN(d.getTime())) return null;
  return { iso: d.toISOString(), ts: Math.floor(d.getTime() / 1000) };
}

function tsToEastern(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' });
}

function tsToUtc(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

// ─── Component ───────────────────────────────────────────────

const ChartDiagnosticsModal: React.FC<ChartDiagnosticsModalProps> = ({
  trade,
  onContinue,
  onCancel,
}) => {
  const [entryTimeEdit, setEntryTimeEdit] = useState(trade.entryTime || '');
  const [exitTimeEdit, setExitTimeEdit] = useState(trade.exitTime || '');
  const [barSample, setBarSample] = useState<any[] | null>(null);
  const [barCount, setBarCount] = useState<number>(0);
  const [loadingBars, setLoadingBars] = useState(false);
  const [barError, setBarError] = useState<string | null>(null);

  // Parse current times
  const entryUk = parseUkTime(trade.entryDate, entryTimeEdit);
  const exitUk = trade.exitDate && exitTimeEdit ? parseUkTime(trade.exitDate!, exitTimeEdit) : null;

  // Fetch chart bars to show alignment
  useEffect(() => {
    if (!trade.symbol) return;
    const fetchBars = async () => {
      setLoadingBars(true);
      setBarError(null);
      try {
        const response: any = await marketApi.getChart(trade.symbol, '1m', '1d', trade.entryDate);
        if (response._diagnostics) {
          setBarSample(response._diagnostics.barSample);
          setBarCount(response._diagnostics.barCount);
        } else if (response.bars?.length > 0) {
          const bars = response.bars;
          const samples = bars.slice(0, 3).concat(bars.slice(-3));
          setBarSample(samples.map((b: any) => ({
            time: b.time,
            utc: new Date(b.time * 1000).toISOString(),
            et: new Date(b.time * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' }),
          })));
          setBarCount(bars.length);
        }
      } catch (err: any) {
        setBarError(err.message || 'Failed to fetch bar data');
      } finally {
        setLoadingBars(false);
      }
    };
    fetchBars();
  }, [trade.symbol, trade.entryDate]);

  // Find nearest bar to a timestamp
  const findNearestBar = useCallback((ts: number | null) => {
    if (ts === null || !barSample) return null;
    let nearest = barSample[0];
    let minDiff = Math.abs(ts - nearest.time);
    for (const b of barSample) {
      const diff = Math.abs(ts - b.time);
      if (diff < minDiff) {
        nearest = b;
        minDiff = diff;
      }
    }
    return nearest;
  }, [barSample]);

  const nearestEntryBar = entryUk ? findNearestBar(entryUk.ts) : null;
  const nearestExitBar = exitUk ? findNearestBar(exitUk.ts) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              📊 Chart Diagnostics — {trade.symbol}
            </h2>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
            >
              ✕ Cancel
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ─── [A] Trade Data from Database ─── */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-blue-400 font-bold text-sm mb-3">[A] Trade Data (Raw from Database)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              <div><span className="text-gray-500">symbol:</span> <span className="text-white">{trade.symbol}</span></div>
              <div><span className="text-gray-500">entryPrice:</span> <span className="text-green-400">{trade.entryPrice?.toFixed(4)}</span></div>
              <div><span className="text-gray-500">entryDate:</span> <span className="text-yellow-300">{trade.entryDate}</span></div>
              <div><span className="text-gray-500">entryTime:</span> <span className="text-yellow-300">{trade.entryTime || '(none)'}</span></div>
              <div><span className="text-gray-500">exitDate:</span> <span className="text-yellow-300">{trade.exitDate || '(none)'}</span></div>
              <div><span className="text-gray-500">exitTime:</span> <span className="text-yellow-300">{trade.exitTime || '(none)'}</span></div>
              <div className="col-span-2"><span className="text-gray-500">exitPrice:</span> <span className="text-red-400">{trade.exitPrice?.toFixed(4)}</span></div>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              ℹ️ entryDate is stored as UTC ISO (Z suffix). entryTime/exitTime are UK local time (HH:MM:SS).
            </p>
          </div>

          {/* ─── [B] Time Conversion Journey ─── */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-purple-400 font-bold text-sm mb-3">[B] Time Conversion Journey</h3>

            {/* Entry */}
            <div className="mb-4 bg-gray-800 rounded p-3">
              <h4 className="text-green-400 font-semibold text-xs mb-2">▶ ENTRY</h4>
              <div className="text-xs font-mono space-y-1">
                <div><span className="text-gray-500">Step 1 — DB entryDate:</span> <span className="text-yellow-300">{trade.entryDate}</span></div>
                <div><span className="text-gray-500">Step 2 — DB entryTime:</span> <span className="text-yellow-300">"{trade.entryTime}"</span> (UK local)</div>
                <div><span className="text-gray-500">Step 3 — Combined string:</span> <span className="text-white">"{trade.entryDate.split('T')[0]}T{entryTimeEdit}"</span></div>
                <div>
                  <span className="text-gray-500">Step 4 — new Date() in browser:</span>
                  {entryUk ? (
                    <>
                      <span className="text-cyan-300"> {entryUk.iso} (UTC)</span>
                      <br />
                      <span className="text-gray-500 ml-[11ch]">equals ts=</span>
                      <span className="text-orange-300">{entryUk.ts}</span>
                    </>
                  ) : (
                    <span className="text-red-400"> INVALID</span>
                  )}
                </div>
                <div><span className="text-gray-500">Step 5 — Marker ET:</span> <span className="text-white">{entryUk ? tsToEastern(entryUk.ts) : '—'}</span></div>
              </div>

              {/* Editable time */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-gray-400 text-xs font-bold">[E1] Edit Entry Time:</label>
                <input
                  type="text"
                  value={entryTimeEdit}
                  onChange={(e) => setEntryTimeEdit(e.target.value)}
                  className="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-xs font-mono w-28"
                  placeholder="HH:MM:SS"
                />
              </div>

              {/* Nearest chart bar */}
              <div className="mt-2 text-xs font-mono">
                <span className="text-gray-500">Nearest chart bar (sample):</span>
                {loadingBars ? (
                  <span className="text-gray-400"> Loading...</span>
                ) : nearestEntryBar ? (
                  <>
                    <span className="text-blue-300"> ts={nearestEntryBar.time}</span>
                    <span className="text-gray-400"> → </span>
                    <span className="text-gray-400">{nearestEntryBar.utc}</span>
                    <span className="text-gray-400"> → ET: {nearestEntryBar.et}</span>
                    <br />
                    <span className="text-gray-500">Marker sync:</span>
                    {entryUk ? (
                      <span className={Math.abs(entryUk.ts - nearestEntryBar.time) <= 60 ? 'text-green-400' : 'text-red-400'}>
                        {' '}{entryUk.ts === nearestEntryBar.time ? '✅ EXACT MATCH' : `±${(entryUk.ts - nearestEntryBar.time)}s`}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-red-400"> No bars available</span>
                )}
              </div>
            </div>

            {/* Exit */}
            {trade.exitDate && trade.exitDate !== 'null' && (
              <div className="mb-4 bg-gray-800 rounded p-3">
                <h4 className="text-red-400 font-semibold text-xs mb-2">▶ EXIT</h4>
                <div className="text-xs font-mono space-y-1">
                  <div><span className="text-gray-500">Step 1 — DB exitDate:</span> <span className="text-yellow-300">{trade.exitDate}</span></div>
                  <div><span className="text-gray-500">Step 2 — DB exitTime:</span> <span className="text-yellow-300">"{trade.exitTime}"</span> (UK local)</div>
                  <div><span className="text-gray-500">Step 3 — Combined string:</span> <span className="text-white">"{trade.exitDate!.split('T')[0]}T{exitTimeEdit}"</span></div>
                  <div>
                    <span className="text-gray-500">Step 4 — new Date() in browser:</span>
                    {exitUk ? (
                      <>
                        <span className="text-cyan-300"> {exitUk.iso} (UTC)</span>
                        <br />
                        <span className="text-gray-500 ml-[11ch]">equals ts=</span>
                        <span className="text-orange-300">{exitUk.ts}</span>
                      </>
                    ) : (
                      <span className="text-red-400"> INVALID</span>
                    )}
                  </div>
                  <div><span className="text-gray-500">Step 5 — Marker ET:</span> <span className="text-white">{exitUk ? tsToEastern(exitUk.ts) : '—'}</span></div>
                </div>

                {/* Editable time */}
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-gray-400 text-xs font-bold">[E2] Edit Exit Time:</label>
                  <input
                    type="text"
                    value={exitTimeEdit}
                    onChange={(e) => setExitTimeEdit(e.target.value)}
                    className="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-xs font-mono w-28"
                    placeholder="HH:MM:SS"
                  />
                </div>

                {/* Nearest chart bar */}
                <div className="mt-2 text-xs font-mono">
                  <span className="text-gray-500">Nearest chart bar (sample):</span>
                  {loadingBars ? (
                    <span className="text-gray-400"> Loading...</span>
                  ) : nearestExitBar ? (
                    <>
                      <span className="text-blue-300"> ts={nearestExitBar.time}</span>
                      <span className="text-gray-400"> → </span>
                      <span className="text-gray-400">{nearestExitBar.utc}</span>
                      <span className="text-gray-400"> → ET: {nearestExitBar.et}</span>
                      <br />
                      <span className="text-gray-500">Marker sync:</span>
                      {exitUk ? (
                        <span className={Math.abs(exitUk.ts - nearestExitBar.time) <= 60 ? 'text-green-400' : 'text-red-400'}>
                          {' '}{exitUk.ts === nearestExitBar.time ? '✅ EXACT MATCH' : `±${(exitUk.ts - nearestExitBar.time)}s`}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-red-400"> No bars available</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── [C] Chart Bar Data (from API) ─── */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-cyan-400 font-bold text-sm mb-3">[C] Chart Bar Data (from Twelve Data API)</h3>
            {loadingBars ? (
              <p className="text-gray-400 text-sm">Loading bars...</p>
            ) : barError ? (
              <p className="text-red-400 text-sm">Error: {barError}</p>
            ) : barSample ? (
              <>
                <p className="text-gray-500 text-xs mb-2">Total bars: {barCount} | Showing first 3 + last 3</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-1 pr-4">#</th>
                        <th className="text-left py-1 pr-4">Timestamp (Unix)</th>
                        <th className="text-left py-1 pr-4">UTC</th>
                        <th className="text-left py-1">ET</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barSample.map((b: any, i: number) => (
                        <tr key={i} className="border-b border-gray-800">
                          <td className="py-1 pr-4 text-gray-500">{i}</td>
                          <td className="py-1 pr-4 text-orange-300">{b.time}</td>
                          <td className="py-1 pr-4 text-cyan-300">{b.utc}</td>
                          <td className="py-1 text-green-300">{b.et}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  ⚠️ If bar UTC times don't match expected ET (e.g., 09:30 UTC should be 13:30 UTC for 9:30AM ET),
                  bars are mis-timed and will misalign with markers.
                </p>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No bar data available</p>
            )}
          </div>

          {/* ─── [D] Marker Preview ─── */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-green-400 font-bold text-sm mb-3">[D] Marker Preview (what gets passed to chart)</h3>
            <div className="space-y-2 text-xs font-mono">
              {entryUk && (
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-green-400">Entry Marker:</span>
                  <span className="text-gray-300"> time={entryUk.ts}</span>
                  <span className="text-gray-500"> → UTC: {entryUk.iso}</span>
                  <span className="text-gray-500"> → ET: {tsToEastern(entryUk.ts)}</span>
                  <br />
                  <span className="text-gray-500">text="Entry ${trade.entryPrice?.toFixed(2)}"</span>
                </div>
              )}
              {exitUk && (
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-red-400">Exit Marker:</span>
                  <span className="text-gray-300"> time={exitUk.ts}</span>
                  <span className="text-gray-500"> → UTC: {exitUk.iso}</span>
                  <span className="text-gray-500"> → ET: {tsToEastern(exitUk.ts)}</span>
                  <br />
                  <span className="text-gray-500">text="Exit ${trade.exitPrice?.toFixed(2)}"</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Actions ─── */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs">
              Adjust entry/exit times above if needed, then click Continue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onContinue({
                    symbol: trade.symbol,
                    entryDate: trade.entryDate,
                    entryTime: entryTimeEdit || undefined,
                    entryPrice: trade.entryPrice,
                    exitDate: trade.exitDate,
                    exitTime: exitTimeEdit || undefined,
                    exitPrice: trade.exitPrice,
                  });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
              >
                ✅ Continue to Chart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartDiagnosticsModal;