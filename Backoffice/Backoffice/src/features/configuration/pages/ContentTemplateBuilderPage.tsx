import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { PageHeader } from "../../../components/PageHeader";
import {
  createContentTemplateBlock,
  deleteContentTemplateBlock,
  listContentTemplateBlocks,
  listContentTemplates,
  updateContentTemplateBlock,
  type ContentTemplate,
  type ContentTemplateBlock,
} from "../api";

type TemplateFormState = {
  key: string;
  block_type: string;
  payload: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm: TemplateFormState = {
  key: "",
  block_type: "text",
  payload: "{}",
  sort_order: 0,
  is_active: true,
};

const parseJson = (raw: string) => {
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
};

const buildPreview = (block: ContentTemplateBlock) => {
  if (!block.payload) {
    return "-";
  }
  if (typeof block.payload === "string") {
    return block.payload.slice(0, 120);
  }
  return JSON.stringify(block.payload).slice(0, 120);
};

export const ContentTemplateBuilderPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();
  const parsedId = params.templateId ? Number(params.templateId) : NaN;
  const initialId = Number.isFinite(parsedId) ? parsedId : null;

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentTemplateBlock | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyForm);

  useEffect(() => {
    if (initialId && initialId !== selectedTemplateId) {
      setSelectedTemplateId(initialId);
    }
  }, [initialId, selectedTemplateId]);

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["content-templates", tokens?.accessToken],
    queryFn: () => listContentTemplates(tokens?.accessToken || "", { page_size: 200, ordering: "name" }),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: blocksData, isLoading: blocksLoading, isError: blocksError } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        template: selectedTemplateId,
        key: form.key,
        block_type: form.block_type,
        payload: parseJson(form.payload),
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      };
      if (editing) {
        return updateContentTemplateBlock(tokens?.accessToken || "", editing.id, payload);
      }
      return createContentTemplateBlock(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-template-blocks"] });
      pushToast({ message: t(editing ? "content_template_blocks.updated" : "content_template_blocks.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: () => pushToast({ message: t("content_template_blocks.invalid_payload"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (blockId: number) => deleteContentTemplateBlock(tokens?.accessToken || "", blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-template-blocks"] });
      pushToast({ message: t("content_template_blocks.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const templateRows = templates.map((template) => ({
    id: template.id,
    name: template.name,
    key: template.key,
    type: template.section_type,
    status: (
      <Chip
        size="small"
        label={template.is_active ? t("label.active") : t("label.inactive")}
        color={template.is_active ? "success" : "default"}
      />
    ),
  }));

  const blockRows = blocks.map((block) => ({
    id: block.id,
    key: block.key,
    type: block.block_type,
    order: block.sort_order,
    active: (
      <Chip
        size="small"
        label={block.is_active ? t("label.active") : t("label.inactive")}
        color={block.is_active ? "success" : "default"}
      />
    ),
    preview: buildPreview(block),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setEditing(block);
            setForm({
              key: block.key,
              block_type: block.block_type,
              payload: JSON.stringify(block.payload || {}, null, 2),
              sort_order: block.sort_order,
              is_active: block.is_active,
            });
            setDialogOpen(true);
          }}
        >
          {t("action.edit")}
        </Button>
        <Button size="small" color="error" variant="text" onClick={() => deleteMutation.mutate(block.id)}>
          {t("action.delete")}
        </Button>
      </Stack>
    ),
  }));

  const blockColumns = [
    { key: "key", label: t("content_template_blocks.column.key") },
    { key: "type", label: t("content_template_blocks.column.type") },
    { key: "order", label: t("content_template_blocks.column.order") },
    { key: "active", label: t("label.status") },
    { key: "preview", label: t("content_template_builder.preview") },
    { key: "actions", label: t("label.action") },
  ];

  const selectedSummary = useMemo(() => {
    if (!selectedTemplate) {
      return [];
    }
    return [
      { label: t("content_templates.column.key"), value: selectedTemplate.key },
      { label: t("content_templates.column.type"), value: selectedTemplate.section_type },
      { label: t("content_templates.column.name"), value: selectedTemplate.name },
      { label: t("label.status"), value: selectedTemplate.is_active ? t("label.active") : t("label.inactive") },
    ];
  }, [selectedTemplate, t]);

  return (
    <PermissionGate permissions={["content_template.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("content_template_builder.title")}
          subtitle={t("content_template_builder.subtitle")}
          actions={
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/configuration/content-templates" variant="outlined">
                {t("content_template_builder.back_to_templates")}
              </Button>
              <Button
                variant="contained"
                disabled={!selectedTemplateId}
                onClick={() => selectedTemplateId && navigate(`/configuration/content-templates/output/${selectedTemplateId}`)}
              >
                {t("content_template_builder.preview_output")}
              </Button>
            </Stack>
          }
        />

        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h3">{t("content_template_builder.library")}</Typography>
                <DataTable
                  columns={[
                    { key: "name", label: t("content_templates.column.name") },
                    { key: "key", label: t("content_templates.column.key") },
                    { key: "status", label: t("label.status") },
                  ]}
                  rows={templateRows}
                  loading={templatesLoading}
                  rowsPerPage={5}
                  totalCount={templates.length}
                  showToolbar={false}
                  onRowClick={(row) => {
                    setSelectedTemplateId(Number(row.id));
                    navigate(`/configuration/content-templates/builder/${row.id}`);
                  }}
                />
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h3">{t("content_template_builder.canvas")}</Typography>
                {selectedTemplate ? (
                  <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                      {selectedSummary.map((item) => (
                        <Paper key={item.label} variant="outlined" sx={{ px: 2, py: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {item.value}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h4">{t("content_template_builder.blocks")}</Typography>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setEditing(null);
                          setForm(emptyForm);
                          setDialogOpen(true);
                        }}
                      >
                        {t("content_template_builder.add_block")}
                      </Button>
                    </Stack>
                    <DataTable
                      columns={blockColumns}
                      rows={blockRows}
                      loading={blocksLoading}
                      error={blocksError}
                      totalCount={blockRows.length}
                      rowsPerPage={5}
                      showToolbar={false}
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("content_template_builder.select_hint")}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? t("content_template_builder.edit_block") : t("content_template_builder.new_block")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("content_template_blocks.column.key")}
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
            />
            <TextField
              label={t("content_template_blocks.column.type")}
              value={form.block_type}
              onChange={(event) => setForm({ ...form, block_type: event.target.value })}
            />
            <TextField
              label={t("content_template_blocks.column.payload")}
              value={form.payload}
              onChange={(event) => setForm({ ...form, payload: event.target.value })}
              multiline
              minRows={6}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("content_template_blocks.column.order")}
                type="number"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
              />
              <TextField
                select
                label={t("label.status")}
                value={form.is_active ? "active" : "inactive"}
                onChange={(event) => setForm({ ...form, is_active: event.target.value === "active" })}
              >
                <MenuItem value="active">{t("label.active")}</MenuItem>
                <MenuItem value="inactive">{t("label.inactive")}</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              <Typography variant="body2">{t("content_template_builder.active_hint")}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.key || !selectedTemplateId}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
