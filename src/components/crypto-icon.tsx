import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

type Props = {
  symbol: string;
  image?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function symbolHue(symbol: string): number {
  let hash = 0;
  for (let index = 0; index < symbol.length; index += 1) {
    hash = (hash * 31 + symbol.charCodeAt(index)) % 360;
  }
  return hash;
}

export function CryptoIcon({ symbol, image, size = 40, style }: Props) {
  const hue = symbolHue(symbol);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsla(${hue}, 65%, 55%, 0.16)`,
        },
        style,
      ]}>
      <CryptoIconContent key={image ?? symbol} symbol={symbol} image={image} size={size} hue={hue} />
    </View>
  );
}

function CryptoIconContent({
  symbol,
  image,
  size,
  hue,
}: {
  symbol: string;
  image?: string;
  size: number;
  hue: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <>
      {!imageLoaded ? (
        <AppText
          variant="caption"
          style={{
            color: `hsl(${hue}, 75%, 74%)`,
            fontFamily: 'Manrope_700Bold',
            fontSize: size * 0.34,
          }}>
          {symbol.slice(0, 3).toUpperCase()}
        </AppText>
      ) : null}
      {showImage ? (
        <Image
          source={{ uri: image }}
          style={[StyleSheet.absoluteFill, { opacity: imageLoaded ? 1 : 0 }]}
          contentFit="contain"
          transition={160}
          cachePolicy="memory-disk"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
});
