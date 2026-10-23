import PlaceholderView from '@/components/common/PlaceholderView';

export default function CommunitiesPage() {
  return (
    <PlaceholderView
      title="Communities"
      subtitle="Sub-group narrative clusters, echo-chamber analysis, and topic spaces."
      iconType="communities"
      plannedFeatures={[
        'Simulated community sub-feeds (e.g. Science Consensus, Tech Devs, Municipal Watch)',
        'Echo chamber polarization index and narrative reinforcement metrics',
        'Cross-community narrative bridge and vector diffusion tracking'
      ]}
    />
  );
}
