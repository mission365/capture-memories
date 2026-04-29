'use client';

import dynamic from 'next/dynamic';

const ChitroStyle = dynamic(() => import('@/components/chitro-style'));

export default function ChitroShell() {
  return <ChitroStyle />;
}
