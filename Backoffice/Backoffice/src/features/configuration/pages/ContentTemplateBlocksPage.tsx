import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
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

export const ContentTemplateBlocksPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [blockType, setBlockType] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentTemplateBlock | null>(null);
  const [form, setForm] = useState({
    template: "",
    key: "",
    block_type: "text",
    payload: "{}",
    sort_order: 0,
    is_active: true,
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      block_type: blockType || undefined,
      template: templateId || undefined,
      ordering: "sort_order",
    }),
    [page, rowsPerPage, search, blockType, templateId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-template-blocks", queryParams, tokens?.accessToken],
    queryFn: () => listContentTemplateBlocks(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: templates } = useQuery({
    queryKey: ["content-templates", tokens?.accessToken],
    queryFn: () => listContentTemplates(tokens?.accessToken || "", { page_size: 200 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const templateMap = useMemo(() => {
    const map = new Map<number, ContentTemplate>();
    (templates?.results || []).forEach((tpl) => map.set(tpl.id, tpl));
    return map;
  }, [templates?.results]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        template: Number(form.template),
        key: form.key,
        block_type: form.block_type,
        payload: form.payload ? JSON.parse(form.payload) : {},
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
      pushToast({
        message: t(editing ? "content_template_blocks.updated" : "content_template_blocks.created"),
        severity: "success",
      });
      setDialogOpen(false);
      setEditing(null);
      setForm({
        template: "",
        key: "",
        block_type: "text",
        payload: "{}",
        sort_order: 0,
        is_active: true,
      });
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

  const rows = (data?.results || []).map((block) => ({
    id: block.id,
    exportData: {
      key: block.key,
      type: block.block_type,
      template: block.template,
      order: block.sort_order,
      active: block.is_active ? "true" : "false",
    },
    key: block.key,
    type: block.block_type,
    template: templateMap.get(block.template)?.name || block.template,
    order: block.sort_order,
    status: (
      <Chip
        size="small"
        label={block.is_active ? t("label.active") : t("label.inactive")}
        color={block.is_active ? "success" : "default"}
      />
    ),
    updated: block.updated_at ? new Date(block.updated_at).toLocaleString() : "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["content_template_block.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(block);
              setForm({
                template: String(block.template),
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
        </PermissionGate>
        <PermissionGate permissions={["content_template_block.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(block.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "key", label: t("content_template_blocks.column.key") },
    { key: "type", label: t("content_template_blocks.column.type") },
    { key: "template", label: t("content_template_blocks.column.template") },
    { key: "order", label: t("content_template_blocks.column.order") },
    { key: "status", label: t("label.status") },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["content_template_block.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("content_template_blocks.title")}
          subtitle={t("content_template_blocks.subtitle")}
          actions={
            <PermissionGate permissions={["content_template_block.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    template: "",
                    key: "",
                    block_type: "text",
                    payload: "{}",
                    sort_order: 0,
                    is_active: true,
                  });
                  setDialogOpen(true);
                }}
              >
                {t("action.create")}
              </Button>
            </PermissionGate>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "configuration.content_template_blocks",
            getState: () => ({ search, blockType, templateId }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setBlockType(String(state.blockType || ""));
              setTemplateId(String(state.templateId || ""));
              setPage(0);
            },
            defaultState: { search: "", blockType: "", templateId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("content_template_blocks.filter.type")}
                  value={blockType}
                  onChange={(event) => setBlockType(event.target.value)}
                  size="small"
                />
                <TextField
                  select
                  label={t("content_template_blocks.filter.template")}
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {(templates?.results || []).map((tpl) => (
                    <MenuItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setBlockType("");
              setTemplateId("");
            },
          }}
        >
          <TextField
            label={t("label.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
          />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="content_template_blocks.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {editing ? t("content_template_blocks.edit") : t("content_template_blocks.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label={t("content_template_blocks.column.template")}
              value={form.template}
              onChange={(event) => setForm({ ...form, template: event.target.value })}
            >
              {(templates?.results || []).map((tpl) => (
                <MenuItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </MenuItem>
              ))}
            </TextField>
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
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                />
              }
              label={t("content_template_blocks.column.active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.key || !form.template}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
