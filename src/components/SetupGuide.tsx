type SetupGuideProps = {
  transactionCount: number;
  isUsingSample: boolean;
  onStartFresh: () => void;
  onLoadSample: () => void;
  onClearAllData: () => void;
};

export const SetupGuide = ({
  transactionCount,
  isUsingSample,
  onStartFresh,
  onLoadSample,
  onClearAllData,
}: SetupGuideProps) => {
  return (
    <section className="panel setup-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Personal setup</p>
          <h2>Make this your budget, not just a demo</h2>
        </div>
      </div>
      <div className="setup-status">
        <strong>{isUsingSample ? "Demo mode" : "Personal mode"}</strong>
        <p className="muted">
          {isUsingSample
            ? "You are currently seeing seeded transactions."
            : `You currently have ${transactionCount} transactions in your personal local ledger.`}
        </p>
      </div>
      <div className="setup-checklist">
        <div>
          <span>1</span>
          <p>Export a CSV from your bank or card portal and upload it here.</p>
        </div>
        <div>
          <span>2</span>
          <p>Use quick add for everyday purchases so the dashboard reflects your real habits.</p>
        </div>
        <div>
          <span>3</span>
          <p>Keep everything local for now. No paid API is needed unless you want automatic syncing later.</p>
        </div>
      </div>
      <div className="upload-actions">
        <button type="button" className="button button-secondary" onClick={onStartFresh}>
          Start with my own data
        </button>
        <button type="button" className="button ghost-button" onClick={onLoadSample}>
          Reload sample data
        </button>
        <button type="button" className="button danger-button" onClick={onClearAllData}>
          Clear all saved data
        </button>
      </div>
    </section>
  );
};
