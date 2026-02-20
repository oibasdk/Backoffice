import React, { useCallback, useMemo } from "react";
import { Box, Chip, Stack, Typography, Paper } from "@mui/material";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { PermissionGate } from "../../../auth/PermissionGate";
import { EntityHeader } from "../../../components/EntityHeader";
import { FullPageError, FullPageLoader } from "../../../components/StateViews";
import { RightPanel } from "../../../components/RightPanel";
import { ChatComposer } from "../components/ChatComposer";
import { ChatMessageList } from "../components/ChatMessageList";
import {
  ChatMessage,
  createChatMessage,
  getChatThread,
  listChatMessages,
  moderateChatMessage,
} from "../api";
import { useChatSocket } from "../hooks/useChatSocket";

export const ChatThreadDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const canModerate = Boolean(access?.is_superuser || access?.permissions?.includes("chat_message.update"));
  const canSend = Boolean(access?.is_superuser || access?.permissions?.includes("chat_message.create"));

  const { data: thread, isLoading, isError } = useQuery({
    queryKey: ["chat-thread", id, tokens?.accessToken],
    queryFn: () => getChatThread(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const queryKey = useMemo(() => ["chat-messages", id, tokens?.accessToken], [id, tokens?.accessToken]);
  const { data: messagesData } = useQuery({
    queryKey,
    queryFn: () => listChatMessages(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const upsertMessage = useCallback(
    (message: ChatMessage) => {
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) {
          return old;
        }
        const results = old.results || [];
        const index = results.findIndex((item: ChatMessage) => item.id === message.id);
        if (index >= 0) {
          const next = [...results];
          next[index] = message;
          return { ...old, results: next };
        }
        return { ...old, results: [...results, message] };
      });
    },
    [queryClient, queryKey]
  );

  const { connected, sendMessage, sendModeration } = useChatSocket({
    threadId: id || null,
    token: tokens?.accessToken || null,
    onEvent: (event) => {
      if (event.type === "message" && event.message) {
        upsertMessage(event.message as ChatMessage);
      }
      if (event.type === "moderation" && event.message) {
        upsertMessage(event.message as ChatMessage);
      }
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      createChatMessage(tokens?.accessToken || "", { thread: id || "", content }),
    onSuccess: (message) => {
      upsertMessage(message);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ messageId, action }: { messageId: string; action: string }) =>
      moderateChatMessage(tokens?.accessToken || "", messageId, { action }),
    onSuccess: (message) => {
      upsertMessage(message);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const handleSend = (content: string) => {
    if (!canSend) {
      pushToast({ message: t("route.forbidden"), severity: "error" });
      return;
    }
    const sent = sendMessage(content);
    if (!sent) {
      sendMutation.mutate(content);
    }
  };

  const handleModerate = (messageId: string, action: string) => {
    const sent = sendModeration(messageId, action);
    if (!sent) {
      moderateMutation.mutate({ messageId, action });
    }
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !thread) {
    return <FullPageError />;
  }

  const messages = messagesData?.results || [];

  return (
    <PermissionGate permissions={["chat_thread.view"]}>
      <Stack spacing={3}>
        <EntityHeader
          title={t("chat.thread.title")}
          subtitle={thread.ticket_title || thread.ticket}
          meta={
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("label.status")}: ${t(`chat.thread.status.${thread.status}`)}`} />
              <Chip
                size="small"
                color={connected ? "success" : "default"}
                label={connected ? t("chat.thread.connected") : t("chat.thread.disconnected")}
              />
            </Stack>
          }
        />

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Box flex={1}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Typography variant="h3">{t("chat.thread.messages")}</Typography>
                <ChatMessageList messages={messages} onModerate={handleModerate} canModerate={canModerate} />
                <ChatComposer onSend={handleSend} disabled={!canSend || sendMutation.isPending} />
              </Stack>
            </Paper>
          </Box>

          <Box width={{ xs: "100%", lg: 320 }}>
            <RightPanel title={t("chat.thread.summary")}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  {t("chat.thread.last_message")}:{" "}
                  {thread.last_message_at ? new Date(thread.last_message_at).toLocaleString() : "-"}
                </Typography>
                <Typography variant="body2">
                  {t("chat.thread.created_at")}: {new Date(thread.created_at).toLocaleString()}
                </Typography>
              </Stack>
            </RightPanel>
          </Box>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
