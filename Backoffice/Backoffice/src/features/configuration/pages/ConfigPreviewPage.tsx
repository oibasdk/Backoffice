import React, { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { PageHeader } from "../../../components/PageHeader";
import { PermissionGate } from "../../../auth/PermissionGate";
import { previewFrontendConfig } from "../api";

export const ConfigPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [identity, setIdentity] = useState("");
  const [screen, setScreen] = useState("");
  const [locale, setLocale] = useState("");
  const [country, setCountry] = useState("");
  const [segments, setSegments] = useState("");
  const [tags, setTags] = useState("");
  const [output, setOutput] = useState("{}");
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const payload = await previewFrontendConfig({
        identity: identity || undefined,
        screen: screen || undefined,
        locale: locale || undefined,
        country: country || undefined,
        segments: segments || undefined,
        tags: tags || undefined,
      });
      setOutput(JSON.stringify(payload, null, 2));
    } catch {
      setOutput(JSON.stringify({ error: true }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGate permissions={["app_setting.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("config_preview.title")} subtitle={t("config_preview.subtitle")} />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label={t("config_preview.screen")}
                value={screen}
                onChange={(event) => setScreen(event.target.value)}
              />
              <TextField
                label={t("config_preview.locale")}
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
              />
              <TextField
                label={t("config_preview.country")}
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
              <TextField
                label={t("config_preview.segments")}
                value={segments}
                onChange={(event) => setSegments(event.target.value)}
              />
              <TextField
                label={t("config_preview.tags")}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
              <TextField
                label={t("config_preview.identity")}
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
              />
              <Button variant="contained" onClick={handlePreview} disabled={loading}>
                {t("config_preview.load")}
              </Button>
            </Stack>
          </Paper>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h3" gutterBottom>
              {t("config_preview.payload")}
            </Typography>
            <Typography
              component="pre"
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", margin: 0 }}
            >
              {loading ? t("state.loading") : output}
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
