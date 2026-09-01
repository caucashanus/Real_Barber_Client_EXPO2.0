import React, { useMemo } from 'react';
import { Text } from 'react-native';

import ThemedText from '@/components/ThemedText';
import {
  emailToMailtoUrl,
  openRbicekHostUrl,
  phoneToTelUrl,
} from '@/lib/rbicek/openLinkUrl';

const LINK_PATTERN =
  /(\+?\d[\d\s]{7,}\d|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

type Segment =
  | { type: 'text'; value: string }
  | { type: 'phone'; value: string }
  | { type: 'email'; value: string };

function parseLinkableSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, start) });
    }
    const value = match[0];
    segments.push({
      type: value.includes('@') ? 'email' : 'phone',
      value,
    });
    lastIndex = start + value.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: text }];
}

interface RbicekLinkableTextProps {
  text: string;
  isSent: boolean;
  accentColor: string;
}

export function RbicekLinkableText({ text, isSent, accentColor }: RbicekLinkableTextProps) {
  const segments = useMemo(() => parseLinkableSegments(text), [text]);

  const handlePress = (segment: Extract<Segment, { type: 'phone' | 'email' }>) => {
    const url =
      segment.type === 'phone'
        ? phoneToTelUrl(segment.value)
        : emailToMailtoUrl(segment.value);
    void openRbicekHostUrl(url);
  };

  return (
    <ThemedText className={isSent ? 'text-white' : ''}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Text key={index}>{segment.value}</Text>;
        }

        return (
          <Text
            key={index}
            className="underline"
            style={{ color: isSent ? '#ffffff' : accentColor }}
            onPress={() => handlePress(segment)}>
            {segment.value}
          </Text>
        );
      })}
    </ThemedText>
  );
}
