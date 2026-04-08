'use client';

import dynamic from 'next/dynamic';

const ChitroStyle = dynamic(() => import('@/components/chitro-style'), {
  ssr: false,
});

export default function ChitroShell() {
  return <ChitroStyle />;
}
