import React from "react";
import { Box, Chip, Divider, Paper, Stack, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ChatMessage } from "../api";

type ChatMessageListProps = {
  messages: ChatMessage[];
  onModerate?: (messageId: string, action: string) => void;
  canModerate?: boolean;
};

const moderationActions = [
  { key: "visible", labelKey: "chat.moderation.restore" },
  { key: "flagged", labelKey: "chat.moderation.flag" },
  { key: "hidden", labelKey: "chat.moderation.hide" },
];

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  onModerate,
  canModerate,
}) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={2}>
      {messages.map((message) => (
        <Paper key={message.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={600}>
                  {message.sender_role}
                </Typography>
                <Chip size="small" label={message.moderation_state} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {new Date(message.created_at).toLocaleString()}
              </Typography>
            </Stack>
            <Typography variant="body2">{message.content}</Typography>
            {canModerate && onModerate && (
              <>
                <Divider />
                <Box display="flex" gap={1} flexWrap="wrap">
                  {moderationActions.map((action) => (
                    <Button
                      key={action.key}
                      size="small"
                      variant="outlined"
                      onClick={() => onModerate(message.id, action.key)}
                    >
                      {t(action.labelKey)}
                    </Button>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        </Paper>
      ))}
      {messages.length === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t("chat.messages.empty")}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
};
