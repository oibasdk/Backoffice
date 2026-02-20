import React, { useMemo } from "react";
import { Box, Chip, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { PageHeader } from "../../../components/PageHeader";
import { radiusTokens, elevationTokens } from "../../../design-system/tokens";

type KnowledgeSection = {
  title: string;
  body: string;
};

type KnowledgeLayoutProps = {
  title: string;
  subtitle: string;
  summary: string;
  sections?: KnowledgeSection[];
  highlights?: string[];
  content?: string;
  tags?: string[];
  metadata?: {
    category?: string | null;
    owner?: string | null;
    updatedAt?: string | null;
  };
};

export const KnowledgeLayout: React.FC<KnowledgeLayoutProps> = ({
  title,
  subtitle,
  summary,
  sections = [],
  highlights = [],
  content,
  tags = [],
  metadata,
}) => {
  const paragraphs = useMemo(() => {
    if (!content) {
      return [];
    }
    return content
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [content]);

  const showContent = paragraphs.length > 0 && sections.length === 0;

  return (
    <Stack spacing={3}>
      <PageHeader title={title} subtitle={subtitle} />
      <Paper
        sx={(theme) => ({
          p: { xs: 2.5, md: 3.5 },
          borderRadius: radiusTokens.large,
          backgroundImage:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, rgba(14,124,120,0.18) 0%, rgba(33,64,153,0.12) 45%, rgba(255,255,255,0.8) 100%)"
              : "linear-gradient(135deg, rgba(14,124,120,0.28) 0%, rgba(33,64,153,0.2) 45%, rgba(15,18,15,0.8) 100%)",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: elevationTokens.level3,
        })}
      >
        <Stack spacing={1.5}>
          <Typography variant="overline" color="text.secondary">
            {subtitle}
          </Typography>
          <Typography variant="h1">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {summary}
          </Typography>
          {(metadata?.category || metadata?.owner || metadata?.updatedAt) && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {metadata?.category && <Chip size="small" label={metadata.category} variant="outlined" />}
              {metadata?.owner && <Chip size="small" label={metadata.owner} variant="outlined" />}
              {metadata?.updatedAt && <Chip size="small" label={metadata.updatedAt} variant="outlined" />}
            </Stack>
          )}
          {tags.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {tags.map((tag) => (
                <Chip key={tag} size="small" label={tag} />
              ))}
            </Stack>
          )}
          {highlights.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {highlights.map((item) => (
                <Box
                  key={item}
                  sx={(theme) => ({
                    px: 1.25,
                    py: 0.5,
                    borderRadius: radiusTokens.pill,
                    backgroundColor: theme.palette.action.hover,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography variant="caption">{item}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      {showContent ? (
        <Paper
          sx={(theme) => ({
            p: { xs: 2.5, md: 3 },
            borderRadius: radiusTokens.large,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: elevationTokens.level2,
          })}
        >
          <Stack spacing={2}>
            {paragraphs.map((paragraph, index) => (
              <Stack spacing={1} key={`${index}-${paragraph.slice(0, 12)}`}>
                {index > 0 && <Divider />}
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                  {paragraph}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {sections.map((section) => (
            <Grid item xs={12} md={6} key={section.title}>
              <Paper
                sx={(theme) => ({
                  p: 2.5,
                  borderRadius: radiusTokens.large,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: elevationTokens.level2,
                })}
              >
                <Stack spacing={1}>
                  <Typography variant="h3">{section.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.body}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
};
