import type { ChangeEvent } from "react";

type UploadPanelProps = {
  onSampleLoad: () => void;
  onFilesLoaded: (files: Array<{ name: string; contents: string }>) => void;
  isUsingSample: boolean;
  importMessage?: string;
};

export const UploadPanel = ({
  onSampleLoad,
  onFilesLoaded,
  isUsingSample,
  importMessage,
}: UploadPanelProps) => {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const loadedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        contents: await file.text(),
      })),
    );

    onFilesLoaded(loadedFiles);
  };

  return (
    <section className="panel upload-panel">
      <div>
        <p className="eyebrow">Import data</p>
        <h2>Bring in a CSV from your bank or card portal</h2>
        <p className="muted">
          {isUsingSample
            ? "Start by replacing the seeded dataset with your own export. The app will categorize spending, detect recurring charges, and generate coaching insights from your real transactions."
            : "Upload your latest card or bank CSV any time to keep the dashboard aligned with your actual spending."}
        </p>
      </div>
      <div className="upload-actions">
        <label className="button button-primary">
          Upload CSVs
          <input type="file" accept=".csv,text/csv" multiple onChange={handleFileChange} hidden />
        </label>
        <button type="button" className="button button-secondary" onClick={onSampleLoad}>
          Load demo dataset
        </button>
      </div>
      {importMessage ? <p className="import-message muted">{importMessage}</p> : null}
    </section>
  );
};
