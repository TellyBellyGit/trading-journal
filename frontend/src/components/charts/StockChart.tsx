// StockChart.tsx
// Candlestick + volume chart using TradingView lightweight-charts v5.
// Never early-returns — chart container always mounts so hooks stay consistent.
// Supports entry/exit trade markers via setMarkers().

import React, { useRef, useEffect } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CandlestickData,
  HistogramData,
  LineData,
  SeriesMarker,
  Time,
  ColorType,
  CrosshairMode,
  createSeriesMarkers,
} from 'lightweight-charts';
import type { OhlcvBar, FreshnessInfo, TradeMarker } from '../../types/Market';
import type { EmaLine } from '../../utils/emaCalculator';

interface StockChartProps {
  bars: OhlcvBar[];
  symbol: string;
  interval: string;
  freshness: FreshnessInfo;
  loading?: boolean;
  markers?: TradeMarker[];
  ema50?: EmaLine[];
  ema200?: EmaLine[];
}

const CHART_COLORS = {
  background: '#1f2937',
  text: '#9ca3af',
  grid: '#374151',
  border: '#4b5563',
  candleUp: '#22c55e',
  candleDown: '#ef4444',
  volumeUp: 'rgba(34, 197, 94, 0.3)',
  volumeDown: 'rgba(239, 68, 68, 0.3)',
};

function toMarkerPosition(pos: TradeMarker['position']): SeriesMarker<Time>['position'] {
  return pos as SeriesMarker<Time>['position'];
}

function toMarkerShape(shape: TradeMarker['shape']): SeriesMarker<Time>['shape'] {
  return shape as SeriesMarker<Time>['shape'];
}

const StockChart: React.FC<StockChartProps> = ({
  bars,
  symbol,
  interval,
  freshness,
  loading = false,
  markers = [],
  ema50,
  ema200,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Create chart once (only on mount or symbol change)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width || 600, 400);
    const h = Math.max(rect.height || 400, 300);

    const chart = createChart(container, {
      width: w,
      height: h,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid, style: 1 },
        horzLines: { color: CHART_COLORS.grid, style: 1 },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: CHART_COLORS.border,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: CHART_COLORS.border,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.candleUp,
      downColor: CHART_COLORS.candleDown,
      borderUpColor: CHART_COLORS.candleUp,
      borderDownColor: CHART_COLORS.candleDown,
      wickUpColor: CHART_COLORS.candleUp,
      wickDownColor: CHART_COLORS.candleDown,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: CHART_COLORS.volumeUp,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: false,
    });

    // EMA line series (added on top of price pane)
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#60a5fa',       // blue-400
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ema200Series = chart.addSeries(LineSeries, {
      color: '#fbbf24',       // amber-400
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema50SeriesRef.current = ema50Series;
    ema200SeriesRef.current = ema200Series;

    const handleResize = () => {
      const r = container.getBoundingClientRect();
      chart.applyOptions({ width: r.width, height: r.height });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [symbol]);

  // Update candlestick + volume data when bars change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    if (bars.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    const candleData: CandlestickData[] = bars.map((bar) => ({
      time: bar.time as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    const volumeData: HistogramData[] = bars.map((bar) => ({
      time: bar.time as Time,
      value: bar.volume,
      color: bar.close >= bar.open
        ? CHART_COLORS.volumeUp
        : CHART_COLORS.volumeDown,
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [bars]);

  // Set markers when they change
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const seriesMarkers: SeriesMarker<Time>[] = markers.map((m) => ({
      time: m.time as Time,
      position: toMarkerPosition(m.position),
      color: m.color,
      shape: toMarkerShape(m.shape),
      text: m.text,
      size: m.size ?? 2,
    }));

    // v5 lightweight-charts: use standalone createSeriesMarkers to set markers
    // Cast to any to work around strict TS SeriesMarker union types
    try {
      createSeriesMarkers(candleSeriesRef.current as any, seriesMarkers as any);
    } catch {
      // Fallback: attach markers directly for other v5 builds
      (candleSeriesRef.current as any).setMarkers?.(seriesMarkers as any);
    }
  }, [markers]);

  // Update EMA line series when computed data changes
  useEffect(() => {
    if (ema50SeriesRef.current) {
      if (ema50 && ema50.length > 0) {
        const lineData: LineData[] = ema50.map(e => ({
          time: e.time as Time,
          value: e.value,
        }));
        ema50SeriesRef.current.setData(lineData);
      } else {
        ema50SeriesRef.current.setData([]);
      }
    }
  }, [ema50]);

  useEffect(() => {
    if (ema200SeriesRef.current) {
      if (ema200 && ema200.length > 0) {
        const lineData: LineData[] = ema200.map(e => ({
          time: e.time as Time,
          value: e.value,
        }));
        ema200SeriesRef.current.setData(lineData);
      } else {
        ema200SeriesRef.current.setData([]);
      }
    }
  }, [ema200]);

  // Determine overlay state
  const showLoading = loading;
  const showEmpty = !loading && bars.length === 0 && !freshness.isDelayed;

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      {/* Chart container — ALWAYS rendered for hook stability */}
      <div
        ref={chartContainerRef}
        className="absolute inset-0"
      />

      {/* Freshness warning overlay */}
      {freshness.isDelayed && freshness.message && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-yellow-900/80 border border-yellow-600 rounded-lg px-4 py-2">
          <p className="text-yellow-200 text-sm flex items-center">
            <span className="mr-2">⚠</span>
            {freshness.message}
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/70 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading chart data...</p>
            <p className="text-gray-500 text-sm mt-1">{symbol} - {interval}</p>
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {showEmpty && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/70 rounded-lg">
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">No chart data available</p>
            <p className="text-gray-500 text-sm">Try a different symbol or date range</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockChart;