import { memo, useCallback, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  formatChartTime,
  formatCompactCurrency,
  formatPercent,
  formatTooltipTime,
} from '@/lib/format';
import type { Candle, RangeKey } from '@/lib/types';

const CHART_HEIGHT = 248;
const PLOT_TOP = 18;
const AXIS_WIDTH = 64;
const PLOT_LEFT = 4;
const X_AXIS_HEIGHT = 24;
const VOLUME_RATIO = 0.16;
const VOLUME_GAP = 10;
const GRID_LINES = 3;

type Props = {
  candles: Candle[];
  range: RangeKey;
  height?: number;
};

function PriceChartBase({ candles, range, height = CHART_HEIGHT }: Props) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasVolume = useMemo(
    () => candles.some((candle) => candle.volume > 0),
    [candles]
  );
  const volumeHeight = hasVolume ? Math.max(28, Math.round(height * VOLUME_RATIO)) : 0;
  const priceBottom = height - X_AXIS_HEIGHT - (hasVolume ? volumeHeight + VOLUME_GAP : 0);
  const volumeTop = priceBottom + VOLUME_GAP;
  const volumeBaseline = height - X_AXIS_HEIGHT;

  const scale = useMemo(() => {
    if (candles.length === 0) return null;
    let low = Math.min(...candles.map((candle) => candle.low));
    let high = Math.max(...candles.map((candle) => candle.high));
    if (low === high) {
      const padding = Math.abs(low) * 0.005 || 1;
      low -= padding;
      high += padding;
    } else {
      const padding = (high - low) * 0.08;
      low -= padding;
      high += padding;
    }

    const plotWidth = Math.max(width - AXIS_WIDTH - PLOT_LEFT, 0);
    const plotHeight = Math.max(priceBottom - PLOT_TOP, 0);
    const maxVolume = Math.max(...candles.map((candle) => candle.volume), 1);
    return {
      low,
      high,
      plotWidth,
      plotHeight,
      maxVolume,
      yForPrice: (price: number) =>
        PLOT_TOP + ((high - price) / (high - low)) * plotHeight,
      xForIndex: (index: number) =>
        PLOT_LEFT + ((index + 0.5) / candles.length) * plotWidth,
      yForVolume: (volume: number) =>
        volumeBaseline - (volume / maxVolume) * volumeHeight,
    };
  }, [candles, priceBottom, volumeBaseline, volumeHeight, width]);

  const updateFromX = useCallback(
    (x: number) => {
      if (candles.length === 0 || !width) return;
      const plotWidth = width - AXIS_WIDTH - PLOT_LEFT;
      const normalized = Math.min(1, Math.max(0, (x - PLOT_LEFT) / plotWidth));
      setActiveIndex(Math.min(candles.length - 1, Math.floor(normalized * candles.length)));
    },
    [candles.length, width]
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => updateFromX(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateFromX(event.nativeEvent.locationX),
        onPanResponderRelease: () => setActiveIndex(null),
        onPanResponderTerminate: () => setActiveIndex(null),
        onPanResponderTerminationRequest: () => true,
      }),
    [updateFromX]
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const lastCandle = candles[candles.length - 1];
  const selectedCandle =
    activeIndex === null ? lastCandle : candles[activeIndex];
  const selectedX =
    activeIndex !== null && scale ? scale.xForIndex(activeIndex) : undefined;
  const selectedY =
    selectedCandle && scale ? scale.yForPrice(selectedCandle.close) : undefined;
  const step = scale && candles.length > 0 ? scale.plotWidth / candles.length : 0;
  const bodyWidth = Math.max(2, Math.min(10, step * 0.62));
  const lastY = lastCandle && scale ? scale.yForPrice(lastCandle.close) : undefined;
  const lastColor =
    lastCandle && lastCandle.close >= lastCandle.open ? Colors.positive : Colors.negative;
  const selectedChange =
    selectedCandle && selectedCandle.open > 0
      ? ((selectedCandle.close - selectedCandle.open) / selectedCandle.open) * 100
      : 0;

  const timeMarks = useMemo(() => {
    if (!scale || candles.length < 2) return [];
    const lastIndex = candles.length - 1;
    const indexes =
      candles.length >= 3 ? [0, Math.floor(lastIndex / 2), lastIndex] : [0, lastIndex];
    return indexes.map((index, position) => ({
      key: candles[index].time,
      x: scale.xForIndex(index),
      time: candles[index].time,
      anchor:
        position === 0
          ? ('start' as const)
          : position === indexes.length - 1
            ? ('end' as const)
            : ('middle' as const),
    }));
  }, [candles, scale]);

  if (candles.length < 2) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <AppText variant="caption" color={Colors.textMuted}>
          Aún no hay suficientes velas para este período
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.readout, width > 0 && width < 420 && styles.readoutCompact]}>
        <View style={styles.readoutTime}>
          <AppText variant="caption" color={Colors.textMuted}>
            {selectedCandle ? formatTooltipTime(selectedCandle.time, range) : ''}
          </AppText>
          {selectedCandle ? (
            <AppText
              variant="micro"
              tabular
              color={selectedChange >= 0 ? Colors.positive : Colors.negative}>
              {formatPercent(selectedChange)}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.ohlc, width > 0 && width < 420 && styles.ohlcCompact]}>
          <PriceStat label="O" value={selectedCandle?.open} />
          <PriceStat label="H" value={selectedCandle?.high} color={Colors.positive} />
          <PriceStat label="L" value={selectedCandle?.low} color={Colors.negative} />
          <PriceStat label="C" value={selectedCandle?.close} />
        </View>
      </View>

      <View
        accessibilityLabel={`Gráfico de velas ${range}`}
        accessible
        onLayout={onLayout}
        style={{ height }}
        {...responder.panHandlers}>
        {width > 0 && scale ? (
          <Svg width={width} height={height}>
            {[0, 1, 2, 3].map((line) => {
              const y = PLOT_TOP + (scale.plotHeight / GRID_LINES) * line;
              const price = scale.high - ((scale.high - scale.low) / GRID_LINES) * line;
              return (
                <G key={line}>
                  <Line
                    x1={PLOT_LEFT}
                    x2={PLOT_LEFT + scale.plotWidth}
                    y1={y}
                    y2={y}
                    stroke={Colors.borderSoft}
                    strokeWidth={1}
                    strokeDasharray="3 6"
                  />
                  <SvgText
                    x={width - 4}
                    y={y + 3}
                    fill={Colors.textMuted}
                    fontFamily={Fonts.medium}
                    fontSize={9}
                    textAnchor="end">
                    {formatCompactCurrency(price)}
                  </SvgText>
                </G>
              );
            })}

            {candles.map((candle, index) => {
              const x = scale.xForIndex(index);
              const highY = scale.yForPrice(candle.high);
              const lowY = scale.yForPrice(candle.low);
              const openY = scale.yForPrice(candle.open);
              const closeY = scale.yForPrice(candle.close);
              const isUp = candle.close >= candle.open;
              const color = isUp ? Colors.positive : Colors.negative;
              const bodyHeight = Math.max(1.7, Math.abs(openY - closeY));
              const isActive = activeIndex === index;

              return (
                <G key={candle.time}>
                  <Line
                    x1={x}
                    x2={x}
                    y1={highY}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={isActive ? 1.8 : 1.2}
                  />
                  <Rect
                    x={x - bodyWidth / 2}
                    y={Math.min(openY, closeY)}
                    width={bodyWidth}
                    height={bodyHeight}
                    rx={1.2}
                    fill={color}
                    opacity={isUp ? 0.95 : 0.85}
                    stroke={color}
                    strokeWidth={1}
                  />
                </G>
              );
            })}

            {hasVolume ? (
              <G>
                <SvgText
                  x={width - 4}
                  y={volumeTop + 9}
                  fill={Colors.textMuted}
                  fontFamily={Fonts.medium}
                  fontSize={8}
                  textAnchor="end">
                  VOL
                </SvgText>
                {candles.map((candle, index) => {
                  if (candle.volume <= 0) return null;
                  const y = scale.yForVolume(candle.volume);
                  const barHeight = Math.max(1, volumeBaseline - y);
                  const isUp = candle.close >= candle.open;
                  return (
                    <Rect
                      key={`volume-${candle.time}`}
                      x={scale.xForIndex(index) - bodyWidth / 2}
                      y={y}
                      width={bodyWidth}
                      height={barHeight}
                      rx={1.5}
                      fill={isUp ? Colors.positive : Colors.negative}
                      opacity={activeIndex === null || activeIndex === index ? 0.34 : 0.2}
                    />
                  );
                })}
              </G>
            ) : null}

            {selectedX !== undefined && selectedY !== undefined ? (
              <G>
                <Line
                  x1={selectedX}
                  x2={selectedX}
                  y1={PLOT_TOP}
                  y2={volumeBaseline}
                  stroke={Colors.textSecondary}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  opacity={0.55}
                />
                <Line
                  x1={PLOT_LEFT}
                  x2={PLOT_LEFT + scale.plotWidth}
                  y1={selectedY}
                  y2={selectedY}
                  stroke={Colors.textSecondary}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  opacity={0.4}
                />
                <Circle
                  cx={selectedX}
                  cy={selectedY}
                  r={4}
                  fill={Colors.background}
                  stroke={Colors.text}
                  strokeWidth={1.6}
                />
              </G>
            ) : null}

            {lastY !== undefined ? (
              <G>
                <Line
                  x1={PLOT_LEFT}
                  x2={PLOT_LEFT + scale.plotWidth}
                  y1={lastY}
                  y2={lastY}
                  stroke={lastColor}
                  strokeWidth={1}
                  strokeDasharray="4 5"
                  opacity={0.5}
                />
                <Rect
                  x={width - AXIS_WIDTH + 3}
                  y={lastY - 8}
                  width={AXIS_WIDTH - 7}
                  height={16}
                  rx={5}
                  fill={lastColor}
                />
                <SvgText
                  x={width - AXIS_WIDTH / 2 - 0.5}
                  y={lastY + 3.5}
                  fill={Colors.background}
                  fontFamily={Fonts.bold}
                  fontSize={9}
                  textAnchor="middle">
                  {formatCompactCurrency(lastCandle.close)}
                </SvgText>
              </G>
            ) : null}

            {timeMarks.map((mark) => (
              <SvgText
                key={mark.key}
                x={mark.x}
                y={height - 6}
                fill={Colors.textMuted}
                fontFamily={Fonts.medium}
                fontSize={9}
                textAnchor={mark.anchor}>
                {formatChartTime(mark.time, range)}
              </SvgText>
            ))}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

export const PriceChart = memo(PriceChartBase);

function PriceStat({
  label,
  value,
  color = Colors.textSecondary,
}: {
  label: string;
  value?: number;
  color?: string;
}) {
  return (
    <View style={styles.priceStat}>
      <AppText variant="micro" color={Colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="micro" color={color} tabular>
        {value === undefined ? '—' : formatCandlePrice(value)}
      </AppText>
    </View>
  );
}

function formatCandlePrice(value: number): string {
  const digits = Math.abs(value) >= 1 ? 2 : Math.abs(value) >= 0.01 ? 4 : 6;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  readout: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  readoutTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ohlc: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  readoutCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  ohlcCompact: {
    width: '100%',
    justifyContent: 'space-between',
  },
  priceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    backgroundColor: Colors.surfaceHigh,
  },
});
