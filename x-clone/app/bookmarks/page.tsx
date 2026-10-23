import PlaceholderView from '@/components/common/PlaceholderView';

export default function BookmarksPage() {
  return (
    <PlaceholderView
      title="Bookmarks"
      subtitle="Saved synthetic signals and flagged case evidence for dossier compilation."
      iconType="bookmarks"
      plannedFeatures={[
        'Personal bookmark archive for bookmarked timeline posts',
        'Export bookmarked signals as structured JSON-L datasets',
        'One-click dossier transfer to the Investigation Dashboard'
      ]}
    />
  );
}
