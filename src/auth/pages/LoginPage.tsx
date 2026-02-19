import React, { useContext, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { login, getPublicReady } from "../api";
import { useAuth } from "../../app/providers/AuthProvider";
import { useToast } from "../../app/providers/ToastProvider";
import { ColorModeContext } from "../../design-system/theme";

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { pushToast } = useToast();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: readyData, isFetching: readyFetching, refetch: refetchReady } = useQuery({
    queryKey: ["login-ready"],
    queryFn: getPublicReady,
    refetchInterval: 30000,
    retry: 1,
  });

  const languageValue = useMemo(() => {
    if (i18n.language?.startsWith("ar")) {
      return "ar";
    }
    return "en";
  }, [i18n.language]);

  const healthStatus = readyData?.status === "ok"
    ? "ok"
    : readyData?.status === "degraded"
    ? "degraded"
    : "unavailable";

  const readyPending = !readyData && readyFetching;

  const healthLabel = readyPending
    ? t("state.loading")
    : healthStatus === "ok"
    ? t("login.kpi.health_ok")
    : healthStatus === "degraded"
    ? t("login.kpi.health_degraded")
    : t("login.kpi.health_unavailable");

  const healthColor = readyPending
    ? "info"
    : healthStatus === "ok"
    ? "success"
    : healthStatus === "degraded"
    ? "warning"
    : "error";

  const redisLabel = readyPending
    ? t("state.loading")
    : readyData?.redis === false
    ? t("login.kpi.redis_unavailable")
    : t("login.kpi.redis_ok");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await login(identifier, password);
      if (!response.access || !response.refresh) {
        const message =
          response.message ||
          response.error ||
          (response.requires_2fa ? t("login.error") : undefined) ||
          t("login.error");
        pushToast({ message, severity: "error" });
        return;
      }
      setAuth(
        { accessToken: response.access, refreshToken: response.refresh },
        response.user ? { email: response.user.email, role: response.user.role } : null
      );
      navigate("/");
    } catch (error) {
      pushToast({ message: t("login.error"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (next !== mode) {
      toggleColorMode();
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" py={{ xs: 4, md: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: { xs: 3, md: 4 }, height: "100%" }} elevation={4}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h1" gutterBottom>
                    {t("login.title")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("login.subtitle")}
                  </Typography>
                </Box>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    <TextField
                      label={t("login.identifier")}
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      autoComplete="username"
                    />
                    <TextField
                      label={t("login.password")}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                    >
                      {t("login.submit")}
                    </Button>
                  </Stack>
                </Box>
                <Divider />
                <Stack spacing={2}>
                  <TextField
                    select
                    label={t("login.theme.label")}
                    size="small"
                    value={mode}
                    onChange={handleThemeChange}
                  >
                    <MenuItem value="light">{t("login.theme.light")}</MenuItem>
                    <MenuItem value="dark">{t("login.theme.dark")}</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label={t("login.language.label")}
                    size="small"
                    value={languageValue}
                    onChange={(event) => i18n.changeLanguage(event.target.value)}
                  >
                    <MenuItem value="en">{t("login.language.english")}</MenuItem>
                    <MenuItem value="ar">{t("login.language.arabic")}</MenuItem>
                  </TextField>
                  <Typography variant="caption" color="text.secondary">
                    {t("login.note")}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper
              sx={(theme) => ({
                p: { xs: 3, md: 4 },
                height: "100%",
                backgroundImage:
                  theme.palette.mode === "light"
                    ? "linear-gradient(145deg, rgba(14,124,120,0.14) 0%, rgba(255,255,255,0.9) 55%, rgba(217,131,31,0.12) 100%)"
                    : "linear-gradient(145deg, rgba(14,124,120,0.2) 0%, rgba(15,18,15,0.92) 55%, rgba(217,131,31,0.18) 100%)",
              })}
              elevation={4}
            >
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h2">{t("login.panel.title")}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("login.panel.subtitle")}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={() => refetchReady()}
                    disabled={readyFetching}
                  >
                    {t("login.kpi.refresh")}
                  </Button>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, height: "100%" }}>
                      <Stack spacing={1.5}>
                        <Typography variant="overline" color="text.secondary">
                          {t("login.kpi.health")}
                        </Typography>
                        <Chip label={healthLabel} color={healthColor} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {redisLabel}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, height: "100%" }}>
                      <Stack spacing={1.5}>
                        <Typography variant="overline" color="text.secondary">
                          {t("login.kpi.ops")}
                        </Typography>
                        <Chip label={t("login.kpi.required")} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {t("login.kpi.ops_hint")}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, height: "100%" }}>
                      <Stack spacing={1.5}>
                        <Typography variant="overline" color="text.secondary">
                          {t("login.kpi.tracing")}
                        </Typography>
                        <Chip label={t("login.kpi.required")} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {t("login.kpi.tracing_hint")}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
                <Divider />
                <Stack spacing={2}>
                  {[
                    {
                      title: t("login.list.security"),
                      body: t("login.list.security_desc"),
                    },
                    {
                      title: t("login.list.ops"),
                      body: t("login.list.ops_desc"),
                    },
                    {
                      title: t("login.list.insights"),
                      body: t("login.list.insights_desc"),
                    },
                  ].map((item) => (
                    <Stack key={item.title} direction="row" spacing={2}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          mt: 0.8,
                          bgcolor: "primary.main",
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle1">{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.body}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
