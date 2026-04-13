import type { AiConfig } from "../lib/ai";

type AiSettingsPanelProps = {
  config: AiConfig;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onConfigChange: (config: AiConfig) => void;
};

export const AiSettingsPanel = ({
  config,
  enabled,
  onEnabledChange,
  onConfigChange,
}: AiSettingsPanelProps) => {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Real AI mode</p>
          <h2>Connect a free LLM API</h2>
        </div>
        <p className="muted compact">
          Your API key stays in local browser storage on this machine. It is not committed to the
          repo.
        </p>
      </div>
      <div className="ai-settings-grid">
        <label className="toggle-row">
          <span>Enable live API answers</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
        </label>
        <label>
          <span>Provider</span>
          <input type="text" value="OpenRouter" disabled />
        </label>
        <label>
          <span>Model</span>
          <input
            type="text"
            value={config.model}
            onChange={(event) => onConfigChange({ ...config, model: event.target.value })}
          />
        </label>
        <label className="api-key-field">
          <span>API key</span>
          <input
            type="password"
            placeholder="Paste your OpenRouter API key"
            value={config.apiKey}
            onChange={(event) => onConfigChange({ ...config, apiKey: event.target.value })}
          />
        </label>
      </div>
      <p className="muted small-text">
        Recommended free model route: <code>openrouter/free</code>. Free-model availability and
        daily limits can change.
      </p>
    </section>
  );
};
