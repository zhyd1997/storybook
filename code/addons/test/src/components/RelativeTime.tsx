import { useCallback, useEffect, useState } from 'react';

export function getRelativeTimeString(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export const RelativeTime = ({ timestamp, testCount }: { timestamp: Date; testCount: number }) => {
  const [relativeTimeString, setRelativeTimeString] = useState(null);
  const updateRelativeTimeString = useCallback(
    () => timestamp && setRelativeTimeString(getRelativeTimeString(timestamp)),
    [timestamp]
  );

  useEffect(() => {
    updateRelativeTimeString();
    const interval = setInterval(updateRelativeTimeString, 10000);
    return () => clearInterval(interval);
  }, [updateRelativeTimeString]);

  return (
    relativeTimeString &&
    `Ran ${testCount} ${testCount === 1 ? 'test' : 'tests'} ${relativeTimeString}`
  );
};
