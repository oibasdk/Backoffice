import { useMemo } from "react";

import { useAuth } from "../app/providers/AuthProvider";
import { useAdminAccess } from "./useAdminAccess";

export const useFeatureFlags = () => {
  const { tokens } = useAuth();
  const { data } = useAdminAccess(tokens?.accessToken || null);

  const flags = useMemo(() => new Set(data?.feature_flags || []), [data?.feature_flags]);

  const isEnabled = (flag?: string) => {
    if (!flag) {
      return true;
    }
    if (flags.size === 0) {
      return true;
    }
    return flags.has(flag);
  };

  return { flags, isEnabled };
};
