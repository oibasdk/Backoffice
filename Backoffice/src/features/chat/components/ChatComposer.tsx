import React, { useState } from "react";
import { Box, Button, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

type ChatComposerProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export const ChatComposer: React.FC<ChatComposerProps> = ({ onSend, disabled }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) {
      return;
    }
    onSend(message.trim());
    setMessage("");
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
      <TextField
        fullWidth
        label={t("chat.composer.label")}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        multiline
        minRows={2}
        disabled={disabled}
      />
      <Box>
        <Button variant="contained" onClick={handleSend} disabled={disabled || !message.trim()}>
          {t("action.send")}
        </Button>
      </Box>
    </Stack>
  );
};
