import React from "react";

import { useFeatureFlags } from "./useFeatureFlags";
import { FullPageError } from "../components/StateViews";

export const FeatureFlagGate: React.FC<{ flag?: string; children: React.ReactNode }> = ({
  flag,
  children,
}) => {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled(flag)) {
    return <FullPageError />;
  }

  return <>{children}</>;
};
