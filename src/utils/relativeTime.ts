export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'Last message just now';
  if (diffMin < 60) return `Last message ${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `Last message ${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `Last message ${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffWeek < 4) return `Last message ${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
  return `Last message ${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) === 1 ? '' : 's'} ago`;
}
