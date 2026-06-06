import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatDateShort(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

export function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || '';
}

export function countWords(html) {
  const text = stripHtml(html);
  return text.split(/\s+/).filter(Boolean).length;
}

export function getCountdown(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  if (diff <= 0) return { expired: true, text: 'Past deadline', hours: 0, minutes: 0 };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return {
    expired: false,
    text: `${hours}h ${minutes}m`,
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}
