export type KnowledgeArticle = {
  id: "getting-started" | "security" | "payments";
  titleKey: string;
  subtitleKey: string;
  badgeKey: string;
  route: string;
  summaryKey: string;
  highlights: string[];
  sections: { titleKey: string; bodyKey: string }[];
};

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: "getting-started",
    titleKey: "knowledge.article.getting_started.title",
    subtitleKey: "knowledge.article.getting_started.subtitle",
    badgeKey: "knowledge.article.getting_started.badge",
    route: "/knowledge/getting-started",
    summaryKey: "knowledge.getting_started.summary",
    highlights: [
      "knowledge.highlight.access",
      "knowledge.highlight.navigation",
      "knowledge.highlight.ops",
    ],
    sections: [
      {
        titleKey: "knowledge.getting_started.section.1.title",
        bodyKey: "knowledge.getting_started.section.1.body",
      },
      {
        titleKey: "knowledge.getting_started.section.2.title",
        bodyKey: "knowledge.getting_started.section.2.body",
      },
      {
        titleKey: "knowledge.getting_started.section.3.title",
        bodyKey: "knowledge.getting_started.section.3.body",
      },
      {
        titleKey: "knowledge.getting_started.section.4.title",
        bodyKey: "knowledge.getting_started.section.4.body",
      },
    ],
  },
  {
    id: "security",
    titleKey: "knowledge.article.security.title",
    subtitleKey: "knowledge.article.security.subtitle",
    badgeKey: "knowledge.article.security.badge",
    route: "/knowledge/security",
    summaryKey: "knowledge.security.summary",
    highlights: [
      "knowledge.highlight.rbac",
      "knowledge.highlight.audit",
      "knowledge.highlight.session",
    ],
    sections: [
      {
        titleKey: "knowledge.security.section.1.title",
        bodyKey: "knowledge.security.section.1.body",
      },
      {
        titleKey: "knowledge.security.section.2.title",
        bodyKey: "knowledge.security.section.2.body",
      },
      {
        titleKey: "knowledge.security.section.3.title",
        bodyKey: "knowledge.security.section.3.body",
      },
      {
        titleKey: "knowledge.security.section.4.title",
        bodyKey: "knowledge.security.section.4.body",
      },
    ],
  },
  {
    id: "payments",
    titleKey: "knowledge.article.payments.title",
    subtitleKey: "knowledge.article.payments.subtitle",
    badgeKey: "knowledge.article.payments.badge",
    route: "/knowledge/payments",
    summaryKey: "knowledge.payments.summary",
    highlights: [
      "knowledge.highlight.orders",
      "knowledge.highlight.proofs",
      "knowledge.highlight.escrows",
    ],
    sections: [
      {
        titleKey: "knowledge.payments.section.1.title",
        bodyKey: "knowledge.payments.section.1.body",
      },
      {
        titleKey: "knowledge.payments.section.2.title",
        bodyKey: "knowledge.payments.section.2.body",
      },
      {
        titleKey: "knowledge.payments.section.3.title",
        bodyKey: "knowledge.payments.section.3.body",
      },
      {
        titleKey: "knowledge.payments.section.4.title",
        bodyKey: "knowledge.payments.section.4.body",
      },
    ],
  },
];
