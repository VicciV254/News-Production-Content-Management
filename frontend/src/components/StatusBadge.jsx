const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
};

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`status-badge status-${status}`} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
