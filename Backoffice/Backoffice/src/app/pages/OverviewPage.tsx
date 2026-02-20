import React from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { radiusTokens } from "../../design-system/tokens";

const kpis = [
  { key: "overview.kpi.tickets", value: "42" },
  { key: "overview.kpi.sla", value: "3" },
  { key: "overview.kpi.sessions", value: "9" },
  { key: "overview.kpi.revenue", value: "$12.4k" },
];

export const OverviewPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1" gutterBottom>
          {t("overview.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Snapshot of critical operations and service health.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {kpis.map((item) => (
          <Grid item xs={12} md={3} key={item.key}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {t(item.key)}
                </Typography>
                <Typography variant="h2" fontWeight={700} mt={1}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card sx={{ minHeight: 260 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                {t("overview.alerts")}
              </Typography>
              <Box sx={{ p: 2, borderRadius: radiusTokens.small, bgcolor: "background.default" }}>
                <Typography variant="body2" color="text.secondary">
                  No alerts in the last 24 hours.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ minHeight: 260 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                {t("overview.activity")}
              </Typography>
              <Stack spacing={2}>
                {[
                  "SupportAgent assigned ticket #4921",
                  "Ops acknowledged SLA breach on RAS-118",
                  "SuperAdmin updated feature flag rollout",
                ].map((activity) => (
                  <Box key={activity} sx={{ p: 2, borderRadius: radiusTokens.small, bgcolor: "background.default" }}>
                    <Typography variant="body2">{activity}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};
