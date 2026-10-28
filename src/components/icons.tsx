import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type BaseProps = IconProps & { children: ReactNode; fill?: string };

function Base({ size = 22, color = Colors.text, strokeWidth = 1.9, fill = 'none', children }: BaseProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function IconMarkets(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M3 17l5.5-5.5 4 4L21 7" />
      <Path d="M15.5 7H21v5.5" />
    </Base>
  );
}

export function IconStar({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Base {...props} fill={filled ? props.color ?? Colors.accent : 'none'}>
      <Path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9-4.3-4.1 5.9-.8L12 3.2z" />
    </Base>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx="11" cy="11" r="7.2" />
      <Path d="M16.3 16.3L21 21" />
    </Base>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M14.5 5.5L8 12l6.5 6.5" />
    </Base>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <Path d="M20.5 3.5V9H15" />
    </Base>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M7 17L17 7" />
      <Path d="M8 7h9v9" />
    </Base>
  );
}

export function IconTrendUp(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 15.5l5-5 3.5 3.5L20 6.5" />
      <Path d="M15.5 6.5H20V11" />
    </Base>
  );
}

export function IconTrendDown(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 8.5l5 5 3.5-3.5L20 17.5" />
      <Path d="M15.5 17.5H20V13" />
    </Base>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 11v5.5" />
      <Circle cx="12" cy="7.8" r="0.9" fill={props.color ?? Colors.text} stroke="none" />
    </Base>
  );
}

export function IconChartBar(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Base>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="21" fill="rgba(124, 92, 255, 0.16)" />
      <Circle cx="24" cy="24" r="13" stroke={Colors.accentLight} strokeWidth="3.2" />
      <Circle cx="34.5" cy="13.5" r="4.4" fill={Colors.cyan} />
      <Circle cx="24" cy="24" r="3" fill={Colors.accentLight} />
    </Svg>
  );
}
