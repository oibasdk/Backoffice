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
import { queryAI } from "../../api/ai";

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

  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; route?: string }>>([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (query.length > 2) {
          const res = await queryAI(query);
          if (!mounted) return;
          setAiSuggestions(res.results || []);
        } else {
          setAiSuggestions([]);
        }
      } catch (e) {
        // swallow AI errors; suggestions are optional
        setAiSuggestions([]);
      }
    };
    const tId = setTimeout(run, 120);
    return () => {
      mounted = false;
      clearTimeout(tId);
    };
  }, [query]);

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

          {/* AI-driven suggestions */}
          {aiSuggestions.map((s, i) => (
            <ListItemButton
              key={`ai-${i}`}
              onClick={() => {
                if (s.route) navigate(s.route);
                onClose();
              }}
            >
              <ListItemText primary={s.title} secondary="AI suggestion" />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};
