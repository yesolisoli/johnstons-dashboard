"use client";

import { useState } from "react";
import { DEFAULT_STATUS_CONFIGS, type StatusConfig } from "../components/status-select";

export function useStatusConfigs() {
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>(DEFAULT_STATUS_CONFIGS);

  const handleUpdateConfig = (code: string, updates: Partial<StatusConfig>) =>
    setStatusConfigs((prev) => prev.map((c) => c.code === code ? { ...c, ...updates } : c));

  const handleDeleteConfig = (code: string) =>
    setStatusConfigs((prev) => prev.filter((c) => c.code !== code));

  const handleAddConfig = (label: string, colorHex: string) => {
    const code = `status_${Date.now()}`;
    setStatusConfigs((prev) => [...prev, { code, label, className: "", colorHex }]);
  };

  const handleReorderConfig = (newConfigs: StatusConfig[]) =>
    setStatusConfigs(newConfigs);

  return {
    statusConfigs,
    handleUpdateConfig,
    handleDeleteConfig,
    handleAddConfig,
    handleReorderConfig,
  };
}
