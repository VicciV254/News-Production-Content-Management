export function StoryCardSkeleton() {
  return <div className="skeleton skeleton-card" aria-hidden="true" />;
}

export function StoryGridSkeleton({ count = 6 }) {
  return (
    <div className="story-grid">
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
