import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PageHeader } from "../../../components/PageHeader";
import { FullPageLoader } from "../../../components/StateViews";
import { radiusTokens, elevationTokens } from "../../../design-system/tokens";
import { KNOWLEDGE_ARTICLES } from "../content";
import {
  listKnowledgeArticles,
  listKnowledgeCategories,
  listKnowledgeTags,
  type KnowledgeArticle,
  type KnowledgeCategory,
  type KnowledgeTag,
} from "../api";

const resolveLanguage = (locale: string) => (locale?.startsWith("ar") ? "ar" : "en");

const updatedRanges = [
  { value: "any", days: null },
  { value: "7", days: 7 },
  { value: "30", days: 30 },
  { value: "90", days: 90 },
];

type ArticleCard = {
  id: string | number;
  title: string;
  subtitle: string;
  summary: string;
  route: string;
  badge?: string;
  tags?: string[];
  category?: string | null;
  owner?: string | null;
  updatedAt?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString();
};

const getOwnerLabel = (article?: KnowledgeArticle | null) => {
  if (!article) {
    return null;
  }
  const meta = article.metadata || {};
  const label =
    meta.author_name || meta.author_email || meta.owner_name || meta.owner_email || null;
  if (label) {
    return String(label);
  }
  if (article.author) {
    return `Owner #${article.author}`;
  }
  return null;
};

const mapLegacyArticles = (t: (key: string) => string): ArticleCard[] =>
  KNOWLEDGE_ARTICLES.map((article) => ({
    id: article.id,
    title: t(article.titleKey),
    subtitle: t(article.subtitleKey),
    summary: t(article.summaryKey),
    route: article.route,
    badge: t(article.badgeKey),
    tags: article.highlights.map((key) => t(key)),
  }));

const mapLiveArticles = (
  articles: KnowledgeArticle[],
  categories: KnowledgeCategory[],
  tags: KnowledgeTag[]
): ArticleCard[] => {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const tagMap = new Map(tags.map((tag) => [tag.id, tag.name]));

  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.summary || "",
    summary: article.content?.slice(0, 140) || article.summary || "",
    route: `/knowledge/${article.slug}`,
    badge: article.article_type,
    tags: article.tags?.map((tag) => tag.name || tagMap.get(tag.id)).filter(Boolean) as string[],
    category: article.category ? categoryMap.get(article.category) || `Category #${article.category}` : null,
    owner: getOwnerLabel(article),
    updatedAt: article.updated_at,
  }));
};

export const KnowledgeIndexPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { tokens } = useAuth();
  const language = resolveLanguage(i18n.language);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState("any");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const { data: categoriesData } = useQuery({
    queryKey: ["knowledge-categories", tokens?.accessToken],
    queryFn: () => listKnowledgeCategories(tokens?.accessToken || ""),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: tagsData } = useQuery({
    queryKey: ["knowledge-tags", tokens?.accessToken],
    queryFn: () => listKnowledgeTags(tokens?.accessToken || ""),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: articlesData, isLoading } = useQuery({
    queryKey: [
      "knowledge-articles",
      debouncedQuery,
      selectedCategory,
      selectedOwner,
      language,
      tokens?.accessToken,
    ],
    queryFn: () =>
      listKnowledgeArticles(tokens?.accessToken || "", {
        q: debouncedQuery || undefined,
        category: selectedCategory || undefined,
        author: selectedOwner || undefined,
        language,
        page_size: 200,
      }),
    enabled: Boolean(tokens?.accessToken),
  });

  const categories = categoriesData?.results || [];
  const tags = tagsData?.results || [];
  const liveArticles = articlesData?.results || [];

  const ownerOptions = useMemo(() => {
    const ownerMap = new Map<string, string>();
    liveArticles.forEach((article) => {
      const ownerLabel = getOwnerLabel(article);
      if (ownerLabel && article.author !== null && article.author !== undefined) {
        ownerMap.set(String(article.author), ownerLabel);
      }
    });
    return Array.from(ownerMap.entries()).map(([id, label]) => ({ id, label }));
  }, [liveArticles]);

  const noFiltersApplied =
    !debouncedQuery &&
    !selectedCategory &&
    !selectedOwner &&
    selectedTags.length === 0 &&
    lastUpdated === "any";

  const baseCards = useMemo(() => {
    if (liveArticles.length > 0) {
      return mapLiveArticles(liveArticles, categories, tags);
    }
    if (!isLoading && noFiltersApplied) {
      return mapLegacyArticles(t);
    }
    return [];
  }, [categories, isLoading, liveArticles, noFiltersApplied, t, tags]);

  const cards = useMemo(() => {
    const range = updatedRanges.find((item) => item.value === lastUpdated);
    const cutoff =
      range?.days && range.days > 0
        ? new Date(Date.now() - range.days * 24 * 60 * 60 * 1000)
        : null;

    const normalizedTags = selectedTags.map((tag) => tag.toLowerCase());
    const filtered = baseCards.filter((card) => {
      if (cutoff && card.updatedAt) {
        const updated = new Date(card.updatedAt);
        if (Number.isNaN(updated.getTime()) || updated < cutoff) {
          return false;
        }
      }
      if (normalizedTags.length > 0) {
        const cardTags = (card.tags || []).map((tag) => tag.toLowerCase());
        const matches = normalizedTags.some((tag) => cardTags.includes(tag));
        if (!matches) {
          return false;
        }
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  }, [baseCards, lastUpdated, selectedTags, sortOrder]);

  const tagOptions = tags.length > 0 ? tags : [];

  return (
    <Stack spacing={3} data-testid="knowledge-index">
      <PageHeader title={t("knowledge.index.title")} subtitle={t("knowledge.index.subtitle")} />

      <Paper
        sx={(theme) => ({
          p: { xs: 2.5, md: 3.5 },
          borderRadius: radiusTokens.large,
          backgroundImage:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, rgba(14,124,120,0.18) 0%, rgba(33,64,153,0.12) 45%, rgba(255,255,255,0.85) 100%)"
              : "linear-gradient(135deg, rgba(14,124,120,0.28) 0%, rgba(33,64,153,0.2) 45%, rgba(15,18,15,0.8) 100%)",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: elevationTokens.level3,
        })}
      >
        <Stack spacing={2}>
          <Typography variant="overline" color="text.secondary">
            {t("knowledge.index.kicker")}
          </Typography>
          <Typography variant="h1">{t("knowledge.index.hero_title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("knowledge.index.summary")}
          </Typography>
          <TextField
            label={t("knowledge.index.search_label")}
            placeholder={t("knowledge.index.search_placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Stack>
      </Paper>

      <Paper
        sx={(theme) => ({
          p: { xs: 2, md: 2.5 },
          borderRadius: radiusTokens.large,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: elevationTokens.level2,
        })}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2">{t("knowledge.index.filters.title")}</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
            <TextField
              select
              label={t("knowledge.index.filters.category")}
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">{t("label.all")}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("knowledge.index.filters.owner")}
              value={selectedOwner}
              onChange={(event) => setSelectedOwner(event.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">{t("label.all")}</MenuItem>
              {ownerOptions.map((owner) => (
                <MenuItem key={owner.id} value={owner.id}>
                  {owner.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("knowledge.index.filters.last_updated")}
              value={lastUpdated}
              onChange={(event) => setLastUpdated(event.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              {updatedRanges.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(`knowledge.index.filters.updated_${option.value}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("knowledge.index.filters.sort")}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="newest">{t("knowledge.index.filters.sort_newest")}</MenuItem>
              <MenuItem value="oldest">{t("knowledge.index.filters.sort_oldest")}</MenuItem>
            </TextField>
          </Stack>
          {tagOptions.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {t("knowledge.index.filters.tags")}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {tagOptions.map((tag) => {
                  const selected = selectedTags.includes(tag.name);
                  return (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          selected ? prev.filter((item) => item !== tag.name) : [...prev, tag.name]
                        )
                      }
                    />
                  );
                })}
                {selectedTags.length > 0 && (
                  <Chip
                    label={t("action.reset")}
                    variant="outlined"
                    onClick={() => setSelectedTags([])}
                  />
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>

      {isLoading && cards.length === 0 ? (
        <FullPageLoader />
      ) : (
        <Grid container spacing={2}>
          {cards.length === 0 ? (
            <Grid item xs={12}>
              <Paper
                sx={(theme) => ({
                  p: 3,
                  borderRadius: radiusTokens.large,
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("knowledge.index.empty")}
                </Typography>
              </Paper>
            </Grid>
          ) : (
            cards.map((article) => (
              <Grid item xs={12} md={4} key={article.id}>
                <Paper
                  sx={(theme) => ({
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    borderRadius: radiusTokens.large,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: elevationTokens.level2,
                  })}
                >
                  {article.badge && (
                    <Box
                      sx={(theme) => ({
                        display: "inline-flex",
                        alignSelf: "flex-start",
                        px: 1.2,
                        py: 0.3,
                        borderRadius: radiusTokens.pill,
                        backgroundColor: theme.palette.action.hover,
                        border: `1px solid ${theme.palette.divider}`,
                      })}
                    >
                      <Typography variant="caption">{article.badge}</Typography>
                    </Box>
                  )}
                  <Typography variant="h3">{article.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {article.subtitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {article.summary}
                  </Typography>
                  {(article.category || article.owner || article.updatedAt) && (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {article.category && (
                        <Chip size="small" label={article.category} variant="outlined" />
                      )}
                      {article.owner && (
                        <Chip size="small" label={article.owner} variant="outlined" />
                      )}
                      {article.updatedAt && (
                        <Chip
                          size="small"
                          label={`${t("knowledge.index.filters.last_updated")}: ${formatDate(
                            article.updatedAt
                          )}`}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  )}
                  {article.tags && article.tags.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {article.tags.slice(0, 4).map((tag) => (
                        <Chip key={tag} size="small" label={tag} />
                      ))}
                    </Stack>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Button component={RouterLink} to={article.route} variant="outlined">
                    {t("knowledge.index.read_more")}
                  </Button>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Stack>
  );
};
