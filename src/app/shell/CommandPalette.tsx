import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export type CommandItem = {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
};

export const CommandPalette: React.FC<{
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  items: CommandItem[];
}> = ({ open, onClose, onOpen, items }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          onClose();
        } else {
          onOpen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onOpen]);

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return items.filter((item) => t(item.labelKey).toLowerCase().includes(lower));
  }, [items, query, t]);

  useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          {t("command.title")}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          placeholder={t("command.hint")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <List sx={{ mt: 2 }}>
          {filtered.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};
