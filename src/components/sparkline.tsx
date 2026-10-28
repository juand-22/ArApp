import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { sparklinePath } from '@/lib/chart';

type Props = {
  values?: number[] | null;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

function SparklineBase({
  values,
  width = 60,
  height = 30,
  color = '#3DDC97',
  strokeWidth = 1.8,
}: Props) {
  const path = useMemo(() => {
    if (!values || values.length < 2) return '';
    return sparklinePath(values, width, height, strokeWidth);
  }, [values, width, height, strokeWidth]);

  if (!path) {
    return <View style={{ width, height }} />;
  }

  return (
    <Svg width={width} height={height}>
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const Sparkline = memo(SparklineBase);
