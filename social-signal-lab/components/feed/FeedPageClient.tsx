'use client';

import React, { useState } from 'react';
import XLayout from '@/components/layout/XLayout';
import XTimeline from '@/components/feed/XTimeline';

export default function FeedPageClient() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectTrend = (topic: string) => {
    setSearchQuery(topic);
  };

  return (
    <XLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelectTrend={handleSelectTrend}
    >
      <XTimeline
        searchQuery={searchQuery}
        onClearSearch={handleClearSearch}
        onTagClick={handleSelectTrend}
      />
    </XLayout>
  );
}
