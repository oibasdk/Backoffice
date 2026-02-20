import React, { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
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
  createProfession,
  deleteProfession,
  listProfessions,
  updateProfession,
  type Profession,
} from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const resolveResults = <T,>(payload: PaginatedLike<T> | T[] | null | undefined) => {
  if (Array.isArray(payload)) {
    return { count: payload.length, results: payload };
  }
  if (payload && Array.isArray(payload.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results };
  }
  return { count: 0, results: [] as T[] };
};

export const ProfessionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profession | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [noteEn, setNoteEn] = useState("");
  const [noteAr, setNoteAr] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      ordering: "name_en",
    }),
    [page, rowsPerPage, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-professions", queryParams, tokens?.accessToken],
    queryFn: () => listProfessions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<Profession>(data);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name_en: nameEn,
        name_ar: nameAr,
        note_en: noteEn || undefined,
        note_ar: noteAr || undefined,
      };
      if (editing) {
        return updateProfession(tokens?.accessToken || "", editing.id, payload);
      }
      return createProfession(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-professions"] });
      pushToast({ message: t(editing ? "catalog.professions.updated" : "catalog.professions.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setNameEn("");
      setNameAr("");
      setNoteEn("");
      setNoteAr("");
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (professionId: number) => deleteProfession(tokens?.accessToken || "", professionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-professions"] });
      pushToast({ message: t("catalog.professions.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((profession) => ({
    id: profession.id,
    exportData: {
      name_en: profession.name_en,
      name_ar: profession.name_ar,
      note_en: profession.note_en || "",
      note_ar: profession.note_ar || "",
    },
    name_en: profession.name_en,
    name_ar: profession.name_ar,
    note_en: profession.note_en || "-",
    note_ar: profession.note_ar || "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["catalog_profession.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(profession);
              setNameEn(profession.name_en);
              setNameAr(profession.name_ar);
              setNoteEn(profession.note_en || "");
              setNoteAr(profession.note_ar || "");
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["catalog_profession.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(profession.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "name_en", label: t("catalog.professions.column.name_en") },
    { key: "name_ar", label: t("catalog.professions.column.name_ar") },
    { key: "note_en", label: t("catalog.professions.column.note_en") },
    { key: "note_ar", label: t("catalog.professions.column.note_ar") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["catalog_profession.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("catalog.professions.title")}
          subtitle={t("catalog.professions.subtitle")}
          actions={
            <PermissionGate permissions={["catalog_profession.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setNameEn("");
                  setNameAr("");
                  setNoteEn("");
                  setNoteAr("");
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
            storageKey: "catalog.professions",
            getState: () => ({ search }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { search: "" },
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
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="catalog_professions.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? t("catalog.professions.edit") : t("catalog.professions.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("catalog.professions.column.name_en")}
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
            />
            <TextField
              label={t("catalog.professions.column.name_ar")}
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
            />
            <TextField
              label={t("catalog.professions.column.note_en")}
              value={noteEn}
              onChange={(event) => setNoteEn(event.target.value)}
              multiline
              minRows={2}
            />
            <TextField
              label={t("catalog.professions.column.note_ar")}
              value={noteAr}
              onChange={(event) => setNoteAr(event.target.value)}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!nameEn || !nameAr}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
