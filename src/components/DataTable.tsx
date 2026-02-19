import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import DensitySmallRoundedIcon from "@mui/icons-material/DensitySmallRounded";
import DensityMediumRoundedIcon from "@mui/icons-material/DensityMediumRounded";
import { useTranslation } from "react-i18next";

import { paletteTokens } from "../design-system/tokens";

export type DataTableColumn = {
  key: string;
  label: string;
  exportValue?: (row: DataTableRow) => string | number | boolean | null;
};

export type DataTableRow = {
  id: string | number;
  exportData?: Record<string, string | number | boolean | null>;
  [key: string]: React.ReactNode;
};

export const DataTable: React.FC<{
  title?: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  loading?: boolean;
  error?: boolean;
  totalCount?: number;
  page?: number;
  rowsPerPage?: number;
  showToolbar?: boolean;
  showPagination?: boolean;
  actions?: React.ReactNode;
  lastUpdated?: string;
  exportFilename?: string;
  exportEnabled?: boolean;
  onExport?: () => void;
  density?: "comfortable" | "compact";
  onDensityChange?: (density: "comfortable" | "compact") => void;
  selectable?: boolean;
  selectedIds?: Array<string | number>;
  onSelectionChange?: (ids: Array<string | number>) => void;
  onRowClick?: (row: DataTableRow) => void;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (size: number) => void;
}> = ({
  title,
  columns,
  rows,
  loading = false,
  error = false,
  totalCount,
  page = 0,
  rowsPerPage = 5,
  showToolbar = true,
  showPagination = true,
  actions,
  lastUpdated,
  exportFilename = "export.csv",
  exportEnabled = true,
  onExport,
  density = "comfortable",
  onDensityChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const { t } = useTranslation();
  const isCompact = density === "compact";
  const rowCount = rows.length;
  const selectedCount = selectedIds.length;
  const allSelected = selectable && rowCount > 0 && selectedCount === rowCount;
  const someSelected = selectable && selectedCount > 0 && selectedCount < rowCount;
  const canExport = exportEnabled && (Boolean(onExport) || rowCount > 0);
  const showTitle = Boolean(title);
  const [fallbackUpdated, setFallbackUpdated] = useState<string | null>(null);
  const resolvedLastUpdated = lastUpdated || fallbackUpdated;

  useEffect(() => {
    if (!loading) {
      setFallbackUpdated(new Date().toLocaleString());
    }
  }, [loading, rowCount]);

  const resolveExportValue = (column: DataTableColumn, row: DataTableRow) => {
    if (column.exportValue) {
      return column.exportValue(row);
    }
    if (row.exportData && column.key in row.exportData) {
      return row.exportData[column.key];
    }
    const raw = row[column.key];
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      return raw;
    }
    return "";
  };

  const downloadCsv = () => {
    if (!rowCount) {
      return;
    }
    const headers = columns.map((column) => column.label);
    const escapeValue = (value: string | number | boolean | null) => {
      if (value === null || value === undefined) {
        return "";
      }
      const text = String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = rows.map((row) =>
      columns.map((column) => escapeValue(resolveExportValue(column, row))).join(",")
    );
    const csv = [`${headers.map((header) => escapeValue(header)).join(",")}`, ...lines].join(
      "\n"
    );
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleRow = (rowId: string | number) => {
    if (!onSelectionChange) {
      return;
    }
    if (selectedIds.includes(rowId)) {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    } else {
      onSelectionChange([...selectedIds, rowId]);
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) {
      return;
    }
    if (allSelected) {
      onSelectionChange([]);
      return;
    }
    onSelectionChange(rows.map((row) => row.id));
  };

  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: "var(--app-surface)",
        backdropFilter: "blur(10px)",
        border: "1px solid",
        borderColor: "var(--app-card-border)",
      }}
    >
      {showToolbar && (
        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
            <Box display="flex" flexDirection="column" gap={1}>
              {(showTitle || (selectable && selectedCount > 0)) && (
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  {showTitle && <Typography variant="h3">{title}</Typography>}
                  {selectable && selectedCount > 0 && (
                    <Chip size="small" label={t("table.selected", { count: selectedCount })} />
                  )}
                </Box>
              )}
              {resolvedLastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  {t("table.last_updated")} · {resolvedLastUpdated}
                </Typography>
              )}
            </Box>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              {actions || (
                <>
                  <Button size="small" variant="outlined" startIcon={<FilterListRoundedIcon />}>
                    {t("table.filter")}
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<SortRoundedIcon />}>
                    {t("table.sort")}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<FileDownloadRoundedIcon />}
                    disabled={!canExport}
                    onClick={() => (onExport ? onExport() : downloadCsv())}
                  >
                    {t("table.export")}
                  </Button>
                </>
              )}
              <IconButton
                size="small"
                onClick={() => onDensityChange?.("comfortable")}
                color={!isCompact ? "primary" : "default"}
              >
                <DensityMediumRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDensityChange?.("compact")}
                color={isCompact ? "primary" : "default"}
              >
                <DensitySmallRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
      <TableContainer
        sx={{
          borderRadius: (theme) => theme.shape.borderRadius,
          border: 1,
          borderColor: "var(--app-card-border)",
          overflow: "hidden",
        }}
      >
        <Table size={isCompact ? "small" : "medium"}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? "rgba(14,124,120,0.08)"
                    : "rgba(14,124,120,0.18)",
              }}
            >
              {selectable && (
                <TableCell padding="checkbox" sx={{ py: isCompact ? 1 : 2 }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ py: isCompact ? 1 : 2 }}>
                  <Typography variant="overline" color="text.secondary">
                    {column.label}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {selectable && (
                    <TableCell padding="checkbox" sx={{ py: isCompact ? 1 : 2 }}>
                      <Skeleton variant="circular" width={18} height={18} />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ py: isCompact ? 1 : 2 }}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                  <Typography variant="body2" color="error">
                    {t("table.error")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                  <Typography variant="body2" color="text.secondary">
                    {t("table.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error &&
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background-color 160ms ease",
                    "&:hover": {
                      backgroundColor: "rgba(14,124,120,0.06)",
                    },
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <TableCell
                      padding="checkbox"
                      onClick={(event) => event.stopPropagation()}
                      sx={{ py: isCompact ? 1 : 2 }}
                    >
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ py: isCompact ? 1 : 2 }}>
                      {row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {showPagination && (
        <TablePagination
          component="div"
          count={totalCount ?? rows.length}
          page={page}
          onPageChange={(_, newPage) => onPageChange && onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) =>
            onRowsPerPageChange && onRowsPerPageChange(Number(event.target.value))
          }
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            borderTop: 1,
            borderColor: "var(--app-card-border)",
            backgroundColor: "rgba(14,124,120,0.03)",
          }}
        />
      )}
    </Paper>
  );
};
