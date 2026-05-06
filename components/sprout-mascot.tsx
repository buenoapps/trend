import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  size?: number;
  mood?: 'idle' | 'happy';
};

export function SproutMascot({ size = 140, mood = 'idle' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const ink = scheme === 'dark' ? palette.text : '#2E3A2C';
  const smile =
    mood === 'happy' ? 'M48 82 Q60 96 72 82' : 'M50 84 Q60 92 70 84';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path d="M52 30 Q40 14 30 22 Q34 36 50 38 Z" fill={palette.leaf} />
      <Path d="M68 30 Q80 14 90 22 Q86 36 70 38 Z" fill={palette.leaf} />
      <Rect x={58} y={30} width={4} height={10} rx={2} fill={palette.leaf} />

      <Circle cx={60} cy={72} r={40} fill={palette.sprout} />
      <Ellipse cx={60} cy={82} rx={28} ry={20} fill={palette.sproutSoft} opacity={0.55} />

      <Circle cx={40} cy={78} r={5} fill={palette.cheek} opacity={0.85} />
      <Circle cx={80} cy={78} r={5} fill={palette.cheek} opacity={0.85} />

      <Circle cx={48} cy={68} r={3} fill={ink} />
      <Circle cx={72} cy={68} r={3} fill={ink} />

      <Path d={smile} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />

      <Path
        d="M44 96 Q52 88 60 92 T78 86"
        stroke={palette.leaf}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
