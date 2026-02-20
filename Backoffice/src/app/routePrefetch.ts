type Prefetcher = {
  match: (path: string) => boolean;
  loaders: Array<() => Promise<unknown>>;
};

const PREFETCHERS: Prefetcher[] = [
  {
    match: (path) => path === "/" || path.startsWith("/analytics"),
    loaders: [
      () => import("../features/mission_control/pages/OverviewPage"),
      () => import("../features/mission_control/pages/AnalyticsPage"),
    ],
  },
  {
    match: (path) => path.startsWith("/studio"),
    loaders: [() => import("../features/studio/pages/ExperienceStudioPage")],
  },
  {
    match: (path) => path.startsWith("/ops"),
    loaders: [
      () => import("../features/ops/pages/OpsCenterPage"),
      () => import("../features/ops/pages/ObservabilityPage"),
      () => import("../features/ops/pages/SystemHealthPage"),
    ],
  },
  {
    match: (path) => path.startsWith("/knowledge"),
    loaders: [
      () => import("../features/knowledge/pages/KnowledgeIndexPage"),
      () => import("../features/knowledge/pages/GettingStartedPage"),
      () => import("../features/knowledge/pages/SecurityPage"),
      () => import("../features/knowledge/pages/PaymentsPage"),
    ],
  },
];

const schedule = (task: () => void) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 800 });
  } else {
    window.setTimeout(task, 0);
  }
};

export const prefetchRoute = (path: string) => {
  const entry = PREFETCHERS.find((prefetcher) => prefetcher.match(path));
  if (!entry) {
    return;
  }
  schedule(() => {
    entry.loaders.forEach((loader) => {
      loader().catch(() => undefined);
    });
  });
};
