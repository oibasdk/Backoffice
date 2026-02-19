import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { PageHeader } from "../../../components/PageHeader";
import {
  listContentTemplateBlocks,
  listContentTemplates,
  type ContentTemplate,
  type ContentTemplateBlock,
} from "../api";

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

export const ContentTemplateOutputPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const parsedId = params.templateId ? Number(params.templateId) : NaN;
  const initialId = Number.isFinite(parsedId) ? parsedId : null;

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialId);

  useEffect(() => {
    if (initialId && initialId !== selectedTemplateId) {
      setSelectedTemplateId(initialId);
    }
  }, [initialId, selectedTemplateId]);

  const { data: templatesData } = useQuery({
    queryKey: ["content-templates", tokens?.accessToken],
    queryFn: () => listContentTemplates(tokens?.accessToken || "", { page_size: 200, ordering: "name" }),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: blocksData, isLoading } = useQuery({
    queryKey: ["content-template-blocks", selectedTemplateId, tokens?.accessToken],
    queryFn: () =>
      listContentTemplateBlocks(tokens?.accessToken || "", {
        template: selectedTemplateId || undefined,
        page_size: 200,
        ordering: "sort_order",
      }),
    enabled: Boolean(tokens?.accessToken) && Boolean(selectedTemplateId),
  });

  const templates = (templatesData?.results || []) as ContentTemplate[];
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;
  const blocks = (blocksData?.results || []) as ContentTemplateBlock[];

  const outputPayload = useMemo(() => {
    if (!selectedTemplate) {
      return null;
    }
    return {
      template: {
        id: selectedTemplate.id,
        key: selectedTemplate.key,
        name: selectedTemplate.name,
        section_type: selectedTemplate.section_type,
        default_screen: selectedTemplate.default_screen,
      },
      blocks: blocks.map((block) => ({
        id: block.id,
        key: block.key,
        block_type: block.block_type,
        sort_order: block.sort_order,
        is_active: block.is_active,
        payload: block.payload ?? {},
      })),
    };
  }, [blocks, selectedTemplate]);

  return (
    <PermissionGate permissions={["content_template.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("content_template_output.title")}
          subtitle={t("content_template_output.subtitle")}
          actions={
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/configuration/content-templates" variant="outlined">
                {t("content_template_output.back_to_templates")}
              </Button>
              <Button
                variant="contained"
                disabled={!selectedTemplateId}
                onClick={() => selectedTemplateId && navigate(`/configuration/content-templates/builder/${selectedTemplateId}`)}
              >
                {t("content_template_output.open_builder")}
              </Button>
            </Stack>
          }
        />

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h3">{t("content_template_output.select")}</Typography>
            <TextField
              select
              label={t("content_templates.column.name")}
              value={selectedTemplateId ?? ""}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSelectedTemplateId(value);
                navigate(`/configuration/content-templates/output/${value}`);
              }}
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {selectedTemplate ? (
          <Grid container spacing={2}>
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h3">{t("content_template_output.summary")}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={selectedTemplate.section_type} />
                    <Chip label={selectedTemplate.is_active ? t("label.active") : t("label.inactive")} />
                  </Stack>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.description || t("content_template_output.no_description")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("content_template_output.block_count", { count: blocks.length })}
                  </Typography>
                </Stack>
              </Paper>
              <Paper sx={{ p: 3, mt: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h3">{t("content_template_output.rendered")}</Typography>
                  {blocks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("content_template_output.empty")}
                    </Typography>
                  ) : (
                    blocks.map((block) => (
                      <Paper key={block.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="overline" color="text.secondary">
                            {block.block_type} · {block.key}
                          </Typography>
                          <Typography variant="body2">
                            {typeof block.payload === "string" ? block.payload : stringify(block.payload).slice(0, 200)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t("content_template_output.order", { order: block.sort_order })}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h3">{t("content_template_output.payload")}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("content_template_output.payload_hint")}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: "background.default" }}>
                    <Typography component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                      {outputPayload ? stringify(outputPayload) : t("content_template_output.empty")}
                    </Typography>
                  </Paper>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (!outputPayload) {
                        return;
                      }
                      const blob = new Blob([stringify(outputPayload)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `content_template_${selectedTemplateId || "output"}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    {t("content_template_output.download")}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t("content_template_output.select_hint")}
            </Typography>
          </Paper>
        )}
      </Stack>
    </PermissionGate>
  );
};
