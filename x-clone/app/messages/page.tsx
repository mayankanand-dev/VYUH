import PlaceholderView from '@/components/common/PlaceholderView';

export default function MessagesPage() {
  return (
    <PlaceholderView
      title="Messages"
      subtitle="Synthetic private communication and peer-to-peer signal relay."
      iconType="messages"
      plannedFeatures={[
        'Simulated direct message dispatch between testbed evaluator handles',
        'Private narrative propagation analysis',
        'End-to-end simulated encrypted message log inspection'
      ]}
    />
  );
}
