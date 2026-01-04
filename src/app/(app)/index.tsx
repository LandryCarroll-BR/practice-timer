import React from 'react';

import Timer from '@/components/timer';
import { FocusAwareStatusBar, View } from '@/components/ui';

export default function Feed() {
  return (
    <View className="flex-1 ">
      <FocusAwareStatusBar />
      <Timer />
    </View>
  );
}
