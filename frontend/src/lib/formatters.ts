import type { AccessStatus, NeedType } from '@/types/domain';

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? isoString
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? isoString
      : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

export const formatCoordinates = (lat?: number, lng?: number): string => {
  if (lat === undefined || lng === undefined) return 'Unknown coordinates';
  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
};

export const formatConfidence = (score?: number): string => {
  if (score === undefined || score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
};

export const getAccessStatusLabel = (status: AccessStatus) => {
  switch (status) {
    case 'open':
      return { label: 'Road Open', color: '#22c55e' };
    case 'partially_blocked':
      return { label: 'Partially Blocked', color: '#f59e0b' };
    case 'blocked':
      return { label: 'Road Blocked', color: '#ef4444' };
    case 'submerged':
      return { label: 'Submerged (Inundated)', color: '#dc2626' };
    case 'unknown':
    default:
      return { label: 'Access Unknown', color: '#94a3b8' };
  }
};

export const getNeedTypeIcon = (type: NeedType): string => {
  switch (type) {
    case 'rescue':
      return '🛟';
    case 'medical':
      return '🏥';
    case 'food':
      return '🍞';
    case 'water':
      return '💧';
    case 'shelter':
      return '⛺';
    case 'transport':
      return '🚐';
    case 'other':
    default:
      return '📦';
  }
};
