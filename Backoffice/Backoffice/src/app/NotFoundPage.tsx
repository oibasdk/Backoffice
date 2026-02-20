import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4" fontWeight={700}>
          404
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("route.notfound")}
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          {t("route.gohome")}
        </Button>
      </Stack>
    </Box>
  );
};
