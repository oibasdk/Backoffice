import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { useTranslation } from "react-i18next";

type SavedViewState = Record<string, unknown>;

type SavedView = {
  id: string;
  name: string;
  state: SavedViewState;
  createdAt: string;
};

type SavedViewsStorage = {
  views: SavedView[];
  selectedId?: string | null;
};

type SavedViewsProps = {
  storageKey: string;
  getState: () => SavedViewState;
  applyState: (state: SavedViewState) => void;
  defaultState?: SavedViewState;
};

const STORAGE_PREFIX = "backoffice.saved_views";

const loadStorage = (key: string): SavedViewsStorage => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { views: [] };
    }
    const parsed = JSON.parse(raw) as SavedViewsStorage;
    return {
      views: Array.isArray(parsed.views) ? parsed.views : [],
      selectedId: parsed.selectedId ?? null,
    };
  } catch {
    return { views: [] };
  }
};

const persistStorage = (key: string, data: SavedViewsStorage) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const SavedViews: React.FC<SavedViewsProps> = ({
  storageKey,
  getState,
  applyState,
  defaultState,
}) => {
  const { t } = useTranslation();
  const storageId = `${STORAGE_PREFIX}.${storageKey}`;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [views, setViews] = useState<SavedView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");

  useEffect(() => {
    const stored = loadStorage(storageId);
    setViews(stored.views);
    setSelectedId(stored.selectedId ?? null);
  }, [storageId]);

  const selectedView = useMemo(
    () => views.find((view) => view.id === selectedId) || null,
    [views, selectedId]
  );

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleApply = (view: SavedView) => {
    applyState(view.state);
    setSelectedId(view.id);
    persistStorage(storageId, { views, selectedId: view.id });
    handleClose();
  };

  const handleDelete = (event: React.MouseEvent, view: SavedView) => {
    event.stopPropagation();
    const nextViews = views.filter((item) => item.id !== view.id);
    const nextSelected = selectedId === view.id ? null : selectedId;
    setViews(nextViews);
    setSelectedId(nextSelected);
    persistStorage(storageId, { views: nextViews, selectedId: nextSelected });
  };

  const handleSave = () => {
    const name = viewName.trim();
    if (!name) {
      return;
    }
    const newView: SavedView = {
      id: generateId(),
      name,
      state: getState(),
      createdAt: new Date().toISOString(),
    };
    const nextViews = [newView, ...views];
    setViews(nextViews);
    setSelectedId(newView.id);
    persistStorage(storageId, { views: nextViews, selectedId: newView.id });
    setSaveOpen(false);
    setViewName("");
  };

  const handleReset = () => {
    if (!defaultState) {
      return;
    }
    applyState(defaultState);
    setSelectedId(null);
    persistStorage(storageId, { views, selectedId: null });
    handleClose();
  };

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<ViewListRoundedIcon />} onClick={handleOpen}>
        {selectedView ? `${t("filter.saved_views")}: ${selectedView.name}` : t("filter.saved_views")}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => setSaveOpen(true)}>
          <SaveRoundedIcon fontSize="small" />
          <Typography variant="body2" ml={1}>
            {t("filter.save_view")}
          </Typography>
        </MenuItem>
        {defaultState && (
          <MenuItem onClick={handleReset}>
            <RestartAltRoundedIcon fontSize="small" />
            <Typography variant="body2" ml={1}>
              {t("filter.reset_view")}
            </Typography>
          </MenuItem>
        )}
        {views.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {t("filter.saved_views.empty")}
            </Typography>
          </MenuItem>
        )}
        {views.map((view) => (
          <MenuItem key={view.id} onClick={() => handleApply(view)}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
              <Typography variant="body2">{view.name}</Typography>
              <IconButton size="small" onClick={(event) => handleDelete(event, view)}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("filter.save_view_title")}</DialogTitle>
        <DialogContent>
          <TextField
            label={t("filter.save_view_name")}
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            fullWidth
            autoFocus
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>{t("action.dismiss")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!viewName.trim()}>
            {t("action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
