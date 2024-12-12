import { useCallback, useEffect, useState } from 'react';

export function getRelativeTimeString(date: Date): string {
  const delta = Math.round((Date.now() - date.getTime()) / 1000);
  if (delta < 60) {
    return 'just now';
  }
  if (delta < 60 * 60) {
    const minutes = Math.floor(delta / 60);
    return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
  }
  if (delta < 60 * 60 * 24) {
    const hours = Math.floor(delta / 60 / 60);
    return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  }
  const days = Math.floor(delta / 60 / 60 / 24);
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
