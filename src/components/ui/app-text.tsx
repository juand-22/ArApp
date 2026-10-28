import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type TextVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'title'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption'
  | 'micro'
  | 'priceLarge';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  tabular?: boolean;
};

export function AppText({
  variant = 'body',
  color = Colors.text,
  align,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        variants[variant],
        { color },
        tabular && styles.tabular,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.medium,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});

const variants = StyleSheet.create({
  hero: {
    fontFamily: Fonts.extrabold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.6,
  },
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  micro: {
    fontFamily: Fonts.semibold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  priceLarge: {
    fontFamily: Fonts.extrabold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.8,
    fontVariant: ['tabular-nums'],
  },
});
