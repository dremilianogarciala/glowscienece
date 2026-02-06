interface Window {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
    clearSelectedApiKey: () => Promise<void>;
  };
}
