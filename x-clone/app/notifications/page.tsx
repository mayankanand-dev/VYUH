import PlaceholderView from '@/components/common/PlaceholderView';

export default function NotificationsPage() {
  return (
    <PlaceholderView
      title="Detection Notifications & Alerts"
      subtitle="Real-time alert dispatch for anomalous narrative spikes and cluster detections."
      iconType="notifications"
      plannedFeatures={[
        'Configurable alert thresholds for sudden lexical duplication spikes',
        'Triage dispatch queue for analyst verification',
        'Webhook integrations for external disinfo benchmark pipelines'
      ]}
    />
  );
}
