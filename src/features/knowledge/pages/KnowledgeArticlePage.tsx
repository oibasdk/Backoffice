import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { FullPageError, FullPageLoader } from "../../../components/StateViews";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { KNOWLEDGE_ARTICLES, type KnowledgeArticle as LegacyArticle } from "../content";
import {
  listKnowledgeArticles,
  listKnowledgeCategories,
  type KnowledgeArticle,
} from "../api";

type KnowledgeArticlePageProps = {
  slug: string;
  legacyId: LegacyArticle["id"];
  testId: string;
};

const resolveLanguage = (locale: string) => (locale?.startsWith("ar") ? "ar" : "en");

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

export const KnowledgeArticlePage: React.FC<KnowledgeArticlePageProps> = ({
  slug,
  legacyId,
  testId,
}) => {
  const { tokens } = useAuth();
  const { t, i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  const legacyArticle = useMemo(
    () => KNOWLEDGE_ARTICLES.find((item) => item.id === legacyId) || null,
    [legacyId]
  );

  const { data: categoriesData } = useQuery({
    queryKey: ["knowledge-categories", tokens?.accessToken],
    queryFn: () => listKnowledgeCategories(tokens?.accessToken || ""),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["knowledge-article", slug, language, tokens?.accessToken],
    queryFn: async () => {
      const response = await listKnowledgeArticles(tokens?.accessToken || "", {
        slug,
        language,
        page_size: 1,
      });
      return response.results?.[0] || null;
    },
    enabled: Boolean(tokens?.accessToken),
  });

  const categoryLabel = useMemo(() => {
    if (!data?.category) {
      return null;
    }
    const match = categoriesData?.results?.find((item) => item.id === data.category);
    return match?.name || `Category #${data.category}`;
  }, [categoriesData, data?.category]);

  const ownerLabel = useMemo(() => getOwnerLabel(data), [data]);
  const updatedAtLabel = data?.updated_at
    ? new Date(data.updated_at).toLocaleDateString()
    : null;

  const tags = data?.tags?.map((tag) => tag.name) || [];

  if (isLoading && !legacyArticle) {
    return <FullPageLoader />;
  }

  const resolvedTitle = data?.title || (legacyArticle ? t(legacyArticle.titleKey) : "");
  const resolvedSubtitle = legacyArticle
    ? t(`knowledge.${legacyId.replace("-", "_")}.subtitle`)
    : t("knowledge.index.subtitle");
  const resolvedSummary =
    data?.summary || (legacyArticle ? t(legacyArticle.summaryKey) : t("knowledge.index.summary"));

  const resolvedSections =
    !data?.content && legacyArticle
      ? legacyArticle.sections.map((section) => ({
          title: t(section.titleKey),
          body: t(section.bodyKey),
        }))
      : [];

  const resolvedHighlights =
    data?.tags && data.tags.length > 0
      ? []
      : legacyArticle?.highlights?.map((item) => t(item)) || [];

  if (!resolvedTitle) {
    return <FullPageError message={t("state.empty")} />;
  }

  return (
    <div data-testid={testId}>
      <KnowledgeLayout
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
        summary={resolvedSummary}
        content={data?.content}
        sections={resolvedSections}
        highlights={resolvedHighlights}
        tags={tags}
        metadata={{
          category: categoryLabel,
          owner: ownerLabel,
          updatedAt: updatedAtLabel,
        }}
      />
    </div>
  );
};
