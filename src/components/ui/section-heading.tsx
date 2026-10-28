import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeading({ title, subtitle, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="#9AA4B8">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
});
