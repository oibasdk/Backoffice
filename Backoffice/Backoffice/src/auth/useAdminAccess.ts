import { useQuery } from "@tanstack/react-query";

import { ApiError } from "../api/client";
import { getAdminAccess, refreshAccessToken, type AdminAccess } from "./api";
import { useAuth } from "../app/providers/AuthProvider";

declare global {
  interface Window {
    __BACKOFFICE_TEST_ACCESS__?: AdminAccess;
    __BACKOFFICE_TEST_BYPASS__?: boolean;
  }
}

export const useAdminAccess = (tokenOverride?: string | null) => {
  const { tokens, updateTokens } = useAuth();
  const token = tokenOverride ?? tokens?.accessToken ?? null;
  const refreshToken = tokens?.refreshToken;
  const testAccess =
    import.meta.env.MODE !== "production" ? window.__BACKOFFICE_TEST_ACCESS__ : undefined;

  return useQuery({
    queryKey: ["admin-access", token],
    queryFn: async () => {
      if (!token) {
        throw new Error("Missing token");
      }
      try {
        return await getAdminAccess(token);
      } catch (error) {
        if (error instanceof ApiError && error.code === 401 && refreshToken) {
          const refreshed = await refreshAccessToken(refreshToken);
          const nextTokens = {
            accessToken: refreshed.access,
            refreshToken: refreshed.refresh ?? refreshToken,
          };
          updateTokens(nextTokens);
          return await getAdminAccess(refreshed.access);
        }
        throw error;
      }
    },
    enabled: !testAccess && Boolean(token),
    initialData: testAccess,
  });
};
