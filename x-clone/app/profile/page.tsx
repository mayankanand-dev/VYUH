import PlaceholderView from '@/components/common/PlaceholderView';

export default function ProfilePage() {
  return (
    <PlaceholderView
      title="Evaluator Profile & Preferences"
      subtitle="Manage testbed analyst identity, sandbox flags, and model calibration keys."
      iconType="profile"
      plannedFeatures={[
        'Evaluator persona switcher (Observer, Fact-checker, Automated Model Probe)',
        'Local model endpoint configuration for zero-shot detection plugins',
        'Export test run history and labeled ground-truth datasets'
      ]}
    />
  );
}
