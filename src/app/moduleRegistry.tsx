import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

import { PermissionGate } from "../auth/PermissionGate";
import { FeatureFlagGate } from "../auth/FeatureFlagGate";

const OverviewPage = lazy(() =>
  import("../features/mission_control/pages/OverviewPage").then((module) => ({
    default: module.OverviewPage,
  }))
);
const AnalyticsPage = lazy(() =>
  import("../features/mission_control/pages/AnalyticsPage").then((module) => ({
    default: module.AnalyticsPage,
  }))
);
const UsersPage = lazy(() =>
  import("../features/iam/pages/UsersPage").then((module) => ({
    default: module.UsersPage,
  }))
);
const UserDetailPage = lazy(() =>
  import("../features/iam/pages/UserDetailPage").then((module) => ({
    default: module.UserDetailPage,
  }))
);
const RolesPage = lazy(() =>
  import("../features/iam/pages/RolesPage").then((module) => ({
    default: module.RolesPage,
  }))
);
const PermissionsPage = lazy(() =>
  import("../features/iam/pages/PermissionsPage").then((module) => ({
    default: module.PermissionsPage,
  }))
);
const UserPermissionsPage = lazy(() =>
  import("../features/iam/pages/UserPermissionsPage").then((module) => ({
    default: module.UserPermissionsPage,
  }))
);
const AccessPage = lazy(() =>
  import("../features/iam/pages/AccessPage").then((module) => ({
    default: module.AccessPage,
  }))
);
const UserDevicesPage = lazy(() =>
  import("../features/iam/pages/UserDevicesPage").then((module) => ({
    default: module.UserDevicesPage,
  }))
);
const UserSessionsPage = lazy(() =>
  import("../features/iam/pages/UserSessionsPage").then((module) => ({
    default: module.UserSessionsPage,
  }))
);
const AuditLogsPage = lazy(() =>
  import("../features/audit/pages/AuditLogsPage").then((module) => ({
    default: module.AuditLogsPage,
  }))
);
const TicketsListPage = lazy(() =>
  import("../features/tickets/pages/TicketsListPage").then((module) => ({
    default: module.TicketsListPage,
  }))
);
const TicketDetailPage = lazy(() =>
  import("../features/tickets/pages/TicketDetailPage").then((module) => ({
    default: module.TicketDetailPage,
  }))
);
const SlaPoliciesPage = lazy(() =>
  import("../features/sla/pages/SlaPoliciesPage").then((module) => ({
    default: module.SlaPoliciesPage,
  }))
);
const SlaPolicyDetailPage = lazy(() =>
  import("../features/sla/pages/SlaPolicyDetailPage").then((module) => ({
    default: module.SlaPolicyDetailPage,
  }))
);
const EscalationPoliciesPage = lazy(() =>
  import("../features/escalations/pages/EscalationPoliciesPage").then((module) => ({
    default: module.EscalationPoliciesPage,
  }))
);
const EscalationPolicyDetailPage = lazy(() =>
  import("../features/escalations/pages/EscalationPolicyDetailPage").then((module) => ({
    default: module.EscalationPolicyDetailPage,
  }))
);
const ChatThreadsPage = lazy(() =>
  import("../features/chat/pages/ChatThreadsPage").then((module) => ({
    default: module.ChatThreadsPage,
  }))
);
const ChatThreadDetailPage = lazy(() =>
  import("../features/chat/pages/ChatThreadDetailPage").then((module) => ({
    default: module.ChatThreadDetailPage,
  }))
);
const ChatPoliciesPage = lazy(() =>
  import("../features/chat/pages/ChatPoliciesPage").then((module) => ({
    default: module.ChatPoliciesPage,
  }))
);
const ChatPolicyDetailPage = lazy(() =>
  import("../features/chat/pages/ChatPolicyDetailPage").then((module) => ({
    default: module.ChatPolicyDetailPage,
  }))
);
const RemoteSessionsListPage = lazy(() =>
  import("../features/remote_sessions/pages/RemoteSessionsListPage").then((module) => ({
    default: module.RemoteSessionsListPage,
  }))
);
const RemoteSessionDetailPage = lazy(() =>
  import("../features/remote_sessions/pages/RemoteSessionDetailPage").then((module) => ({
    default: module.RemoteSessionDetailPage,
  }))
);
const RemoteSessionPoliciesPage = lazy(() =>
  import("../features/remote_sessions/pages/RemoteSessionPoliciesPage").then((module) => ({
    default: module.RemoteSessionPoliciesPage,
  }))
);
const RemoteSessionPolicyDetailPage = lazy(() =>
  import("../features/remote_sessions/pages/RemoteSessionPolicyDetailPage").then((module) => ({
    default: module.RemoteSessionPolicyDetailPage,
  }))
);
const VendorApprovalsPage = lazy(() =>
  import("../features/marketplace/pages/VendorApprovalsPage").then((module) => ({
    default: module.VendorApprovalsPage,
  }))
);
const ProductApprovalsPage = lazy(() =>
  import("../features/marketplace/pages/ProductApprovalsPage").then((module) => ({
    default: module.ProductApprovalsPage,
  }))
);
const OrdersPage = lazy(() =>
  import("../features/payments/pages/OrdersPage").then((module) => ({
    default: module.OrdersPage,
  }))
);
const PaymentIntentsPage = lazy(() =>
  import("../features/payments/pages/PaymentIntentsPage").then((module) => ({
    default: module.PaymentIntentsPage,
  }))
);
const PaymentProofsPage = lazy(() =>
  import("../features/payments/pages/PaymentProofsPage").then((module) => ({
    default: module.PaymentProofsPage,
  }))
);
const EscrowsPage = lazy(() =>
  import("../features/payments/pages/EscrowsPage").then((module) => ({
    default: module.EscrowsPage,
  }))
);
const EscrowTransactionsPage = lazy(() =>
  import("../features/payments/pages/EscrowTransactionsPage").then((module) => ({
    default: module.EscrowTransactionsPage,
  }))
);
const PaymentMethodsPage = lazy(() =>
  import("../features/payments/pages/PaymentMethodsPage").then((module) => ({
    default: module.PaymentMethodsPage,
  }))
);
const BanksPage = lazy(() =>
  import("../features/payments/pages/BanksPage").then((module) => ({
    default: module.BanksPage,
  }))
);
const PayoutsPage = lazy(() =>
  import("../features/payments/pages/PayoutsPage").then((module) => ({
    default: module.PayoutsPage,
  }))
);
const PaymentAuditLogsPage = lazy(() =>
  import("../features/payments/pages/PaymentAuditLogsPage").then((module) => ({
    default: module.PaymentAuditLogsPage,
  }))
);
const WalletsPage = lazy(() =>
  import("../features/payments/pages/WalletsPage").then((module) => ({
    default: module.WalletsPage,
  }))
);
const WalletTransactionsPage = lazy(() =>
  import("../features/payments/pages/WalletTransactionsPage").then((module) => ({
    default: module.WalletTransactionsPage,
  }))
);
const ReferralCodesPage = lazy(() =>
  import("../features/payments/pages/ReferralCodesPage").then((module) => ({
    default: module.ReferralCodesPage,
  }))
);
const ReferralEventsPage = lazy(() =>
  import("../features/payments/pages/ReferralEventsPage").then((module) => ({
    default: module.ReferralEventsPage,
  }))
);
const RewardRulesPage = lazy(() =>
  import("../features/payments/pages/RewardRulesPage").then((module) => ({
    default: module.RewardRulesPage,
  }))
);
const RewardTransactionsPage = lazy(() =>
  import("../features/payments/pages/RewardTransactionsPage").then((module) => ({
    default: module.RewardTransactionsPage,
  }))
);
const FeatureFlagsPage = lazy(() =>
  import("../features/configuration/pages/FeatureFlagsPage").then((module) => ({
    default: module.FeatureFlagsPage,
  }))
);
const ConfigVersionsPage = lazy(() =>
  import("../features/configuration/pages/ConfigVersionsPage").then((module) => ({
    default: module.ConfigVersionsPage,
  }))
);
const ContentTemplatesPage = lazy(() =>
  import("../features/configuration/pages/ContentTemplatesPage").then((module) => ({
    default: module.ContentTemplatesPage,
  }))
);
const AppSettingsPage = lazy(() =>
  import("../features/configuration/pages/AppSettingsPage").then((module) => ({
    default: module.AppSettingsPage,
  }))
);
const ContentSectionsPage = lazy(() =>
  import("../features/configuration/pages/ContentSectionsPage").then((module) => ({
    default: module.ContentSectionsPage,
  }))
);
const ContentBlocksPage = lazy(() =>
  import("../features/configuration/pages/ContentBlocksPage").then((module) => ({
    default: module.ContentBlocksPage,
  }))
);
const ContentTemplateBlocksPage = lazy(() =>
  import("../features/configuration/pages/ContentTemplateBlocksPage").then((module) => ({
    default: module.ContentTemplateBlocksPage,
  }))
);
const ContentTemplateBuilderPage = lazy(() =>
  import("../features/configuration/pages/ContentTemplateBuilderPage").then((module) => ({
    default: module.ContentTemplateBuilderPage,
  }))
);
const ContentTemplateOutputPage = lazy(() =>
  import("../features/configuration/pages/ContentTemplateOutputPage").then((module) => ({
    default: module.ContentTemplateOutputPage,
  }))
);
const ConfigPreviewPage = lazy(() =>
  import("../features/configuration/pages/ConfigPreviewPage").then((module) => ({
    default: module.ConfigPreviewPage,
  }))
);
const ExperienceStudioPage = lazy(() =>
  import("../features/studio/pages/ExperienceStudioPage").then((module) => ({
    default: module.ExperienceStudioPage,
  }))
);
const ContentSyncPage = lazy(() =>
  import("../features/configuration/pages/ContentSyncPage").then((module) => ({
    default: module.ContentSyncPage,
  }))
);
const OpsCenterPage = lazy(() =>
  import("../features/ops/pages/OpsCenterPage").then((module) => ({
    default: module.OpsCenterPage,
  }))
);
const ObservabilityPage = lazy(() =>
  import("../features/ops/pages/ObservabilityPage").then((module) => ({
    default: module.ObservabilityPage,
  }))
);
const SystemHealthPage = lazy(() =>
  import("../features/ops/pages/SystemHealthPage").then((module) => ({
    default: module.SystemHealthPage,
  }))
);
const SystemAlertsPage = lazy(() =>
  import("../features/ops/pages/SystemAlertsPage").then((module) => ({
    default: module.SystemAlertsPage,
  }))
);
const NotificationsPage = lazy(() =>
  import("../features/ops/pages/NotificationsPage").then((module) => ({
    default: module.NotificationsPage,
  }))
);
const AdminConsolePage = lazy(() =>
  import("../features/ops/pages/AdminConsolePage").then((module) => ({
    default: module.AdminConsolePage,
  }))
);
const SessionLogsPage = lazy(() =>
  import("../features/ras/pages/SessionLogsPage").then((module) => ({
    default: module.SessionLogsPage,
  }))
);
const SessionConsentsPage = lazy(() =>
  import("../features/ras/pages/SessionConsentsPage").then((module) => ({
    default: module.SessionConsentsPage,
  }))
);
const SessionEventsPage = lazy(() =>
  import("../features/ras/pages/SessionEventsPage").then((module) => ({
    default: module.SessionEventsPage,
  }))
);
const SessionArtifactsPage = lazy(() =>
  import("../features/ras/pages/SessionArtifactsPage").then((module) => ({
    default: module.SessionArtifactsPage,
  }))
);
const ChatModerationLogsPage = lazy(() =>
  import("../features/ras/pages/ChatModerationLogsPage").then((module) => ({
    default: module.ChatModerationLogsPage,
  }))
);
const PolicyAuditLogsPage = lazy(() =>
  import("../features/ras/pages/PolicyAuditLogsPage").then((module) => ({
    default: module.PolicyAuditLogsPage,
  }))
);
const RasMetricsPage = lazy(() =>
  import("../features/ras/pages/RasMetricsPage").then((module) => ({
    default: module.RasMetricsPage,
  }))
);
const CatalogCategoriesPage = lazy(() =>
  import("../features/catalog/pages/CategoriesPage").then((module) => ({
    default: module.CategoriesPage,
  }))
);
const CatalogProductsPage = lazy(() =>
  import("../features/catalog/pages/ProductsPage").then((module) => ({
    default: module.ProductsPage,
  }))
);
const CatalogProductKeysPage = lazy(() =>
  import("../features/catalog/pages/ProductKeysPage").then((module) => ({
    default: module.ProductKeysPage,
  }))
);
const CatalogProfessionsPage = lazy(() =>
  import("../features/catalog/pages/ProfessionsPage").then((module) => ({
    default: module.ProfessionsPage,
  }))
);
const CatalogBundlesPage = lazy(() =>
  import("../features/catalog/pages/BundlesPage").then((module) => ({
    default: module.BundlesPage,
  }))
);
const KnowledgeGettingStartedPage = lazy(() =>
  import("../features/knowledge/pages/GettingStartedPage").then((module) => ({
    default: module.GettingStartedPage,
  }))
);
const KnowledgeIndexPage = lazy(() =>
  import("../features/knowledge/pages/KnowledgeIndexPage").then((module) => ({
    default: module.KnowledgeIndexPage,
  }))
);
const KnowledgeSecurityPage = lazy(() =>
  import("../features/knowledge/pages/SecurityPage").then((module) => ({
    default: module.SecurityPage,
  }))
);
const KnowledgePaymentsPage = lazy(() =>
  import("../features/knowledge/pages/PaymentsPage").then((module) => ({
    default: module.PaymentsPage,
  }))
);

export type ModuleRoute = {
  path: string;
  labelKey: string;
  element: React.ReactElement;
  permission?: string;
  featureFlag?: string;
  nav?: boolean;
  index?: boolean;
};

export type ModuleConfig = {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  basePath: string;
  routes: ModuleRoute[];
  permission?: string;
  featureFlag?: string;
};

export type NavItem = {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
  permission?: string;
};

export type NavSection = {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  items: NavItem[];
};

type AccessProfile = {
  permissions?: string[];
  is_superuser?: boolean;
};

const wrapPermission = (element: React.ReactElement, permission?: string) =>
  permission ? <PermissionGate permissions={[permission]}>{element}</PermissionGate> : element;

const wrapFeatureFlag = (element: React.ReactElement, flag?: string) =>
  flag ? <FeatureFlagGate flag={flag}>{element}</FeatureFlagGate> : element;

export const MODULES: ModuleConfig[] = [
  {
    id: "mission_control",
    labelKey: "nav.overview",
    icon: <DashboardRoundedIcon />,
    basePath: "/",
    routes: [
      {
        path: "",
        labelKey: "nav.overview",
        element: <OverviewPage />,
        nav: true,
        index: true,
      },
      {
        path: "analytics",
        labelKey: "nav.analytics",
        element: <AnalyticsPage />,
        nav: true,
        permission: "analytics.view",
      },
    ],
  },
  {
    id: "iam",
    labelKey: "nav.iam",
    icon: <PeopleAltRoundedIcon />,
    basePath: "/iam",
    routes: [
      {
        path: "iam/users",
        labelKey: "nav.users",
        element: <UsersPage />,
        nav: true,
        permission: "user.view",
      },
      {
        path: "iam/users/:id",
        labelKey: "nav.user_detail",
        element: <UserDetailPage />,
        nav: false,
        permission: "user.view",
      },
      {
        path: "iam/roles",
        labelKey: "nav.roles",
        element: <RolesPage />,
        nav: true,
        permission: "role_template.view",
      },
      {
        path: "iam/permissions",
        labelKey: "nav.permissions",
        element: <PermissionsPage />,
        nav: true,
        permission: "permission.view",
      },
      {
        path: "iam/user-permissions",
        labelKey: "nav.user_permissions",
        element: <UserPermissionsPage />,
        nav: true,
        permission: "user_permission.view",
      },
      {
        path: "iam/devices",
        labelKey: "nav.user_devices",
        element: <UserDevicesPage />,
        nav: true,
        permission: "user_device.view",
      },
      {
        path: "iam/sessions",
        labelKey: "nav.user_sessions",
        element: <UserSessionsPage />,
        nav: true,
        permission: "user_session.view",
      },
      {
        path: "iam/access",
        labelKey: "nav.access",
        element: <AccessPage />,
        nav: true,
        permission: "user.view",
      },
    ],
  },
  {
    id: "audit",
    labelKey: "nav.audit",
    icon: <FactCheckRoundedIcon />,
    basePath: "/audit",
    routes: [
      {
        path: "audit",
        labelKey: "nav.audit",
        element: <AuditLogsPage />,
        nav: true,
        permission: "audit_log.view",
      },
    ],
  },
  {
    id: "support_ops",
    labelKey: "nav.support_ops",
    icon: <ConfirmationNumberRoundedIcon />,
    basePath: "/tickets",
    routes: [
      {
        path: "tickets",
        labelKey: "nav.tickets",
        element: <TicketsListPage />,
        nav: true,
        permission: "ticket.view",
      },
      {
        path: "tickets/:id",
        labelKey: "nav.ticket_detail",
        element: <TicketDetailPage />,
        nav: false,
        permission: "ticket.view",
      },
      {
        path: "sla-policies",
        labelKey: "nav.sla_policies",
        element: <SlaPoliciesPage />,
        nav: true,
        permission: "sla_policy.view",
      },
      {
        path: "sla-policies/:id",
        labelKey: "nav.sla_policy_detail",
        element: <SlaPolicyDetailPage />,
        nav: false,
        permission: "sla_policy.view",
      },
      {
        path: "escalation-policies",
        labelKey: "nav.escalation_policies",
        element: <EscalationPoliciesPage />,
        nav: true,
        permission: "escalation_policy.view",
      },
      {
        path: "escalation-policies/:id",
        labelKey: "nav.escalation_policy_detail",
        element: <EscalationPolicyDetailPage />,
        nav: false,
        permission: "escalation_policy.view",
      },
      {
        path: "remote-sessions",
        labelKey: "nav.remote_sessions",
        element: <RemoteSessionsListPage />,
        nav: true,
        permission: "remote_session.view",
      },
      {
        path: "remote-sessions/:id",
        labelKey: "nav.remote_session_detail",
        element: <RemoteSessionDetailPage />,
        nav: false,
        permission: "remote_session.view",
      },
      {
        path: "remote-session-policies",
        labelKey: "nav.remote_session_policies",
        element: <RemoteSessionPoliciesPage />,
        nav: true,
        permission: "remote_session_policy.view",
      },
      {
        path: "remote-session-policies/:id",
        labelKey: "nav.remote_session_policy_detail",
        element: <RemoteSessionPolicyDetailPage />,
        nav: false,
        permission: "remote_session_policy.view",
      },
      {
        path: "ras/session-logs",
        labelKey: "nav.session_logs",
        element: <SessionLogsPage />,
        nav: true,
        permission: "session_log.view",
      },
      {
        path: "ras/metrics",
        labelKey: "nav.ras_metrics",
        element: <RasMetricsPage />,
        nav: true,
        permission: "session_log.view",
      },
      {
        path: "ras/session-consents",
        labelKey: "nav.session_consents",
        element: <SessionConsentsPage />,
        nav: true,
        permission: "session_consent.view",
      },
      {
        path: "ras/session-events",
        labelKey: "nav.session_events",
        element: <SessionEventsPage />,
        nav: true,
        permission: "session_event.view",
      },
      {
        path: "ras/session-artifacts",
        labelKey: "nav.session_artifacts",
        element: <SessionArtifactsPage />,
        nav: true,
        permission: "session_artifact.view",
      },
      {
        path: "ras/chat-moderation-logs",
        labelKey: "nav.chat_moderation_logs",
        element: <ChatModerationLogsPage />,
        nav: true,
        permission: "chat_moderation_log.view",
      },
      {
        path: "ras/policy-audit-logs",
        labelKey: "nav.policy_audit_logs",
        element: <PolicyAuditLogsPage />,
        nav: true,
        permission: "policy_audit.view",
      },
    ],
  },
  {
    id: "communications",
    labelKey: "nav.chat",
    icon: <ForumRoundedIcon />,
    basePath: "/chat",
    routes: [
      {
        path: "chat/threads",
        labelKey: "nav.chat_threads",
        element: <ChatThreadsPage />,
        nav: true,
        permission: "chat_thread.view",
      },
      {
        path: "chat/threads/:id",
        labelKey: "nav.chat_thread_detail",
        element: <ChatThreadDetailPage />,
        nav: false,
        permission: "chat_thread.view",
      },
      {
        path: "chat/policies",
        labelKey: "nav.chat_policies",
        element: <ChatPoliciesPage />,
        nav: true,
        permission: "chat_policy.view",
      },
      {
        path: "chat/policies/:id",
        labelKey: "nav.chat_policy_detail",
        element: <ChatPolicyDetailPage />,
        nav: false,
        permission: "chat_policy.view",
      },
    ],
  },
  {
    id: "marketplace",
    labelKey: "nav.marketplace",
    icon: <StorefrontRoundedIcon />,
    basePath: "/marketplace",
    routes: [
      {
        path: "marketplace/vendor-approvals",
        labelKey: "nav.vendor_approvals",
        element: <VendorApprovalsPage />,
        nav: true,
        permission: "vendor_approval.view",
      },
      {
        path: "marketplace/product-approvals",
        labelKey: "nav.product_approvals",
        element: <ProductApprovalsPage />,
        nav: true,
        permission: "product_approval.view",
      },
    ],
  },
  {
    id: "catalog",
    labelKey: "nav.catalog",
    icon: <Inventory2RoundedIcon />,
    basePath: "/catalog",
    routes: [
      {
        path: "catalog/categories",
        labelKey: "nav.catalog_categories",
        element: <CatalogCategoriesPage />,
        nav: true,
        permission: "catalog_category.view",
      },
      {
        path: "catalog/products",
        labelKey: "nav.catalog_products",
        element: <CatalogProductsPage />,
        nav: true,
        permission: "catalog_product.view",
      },
      {
        path: "catalog/product-keys",
        labelKey: "nav.catalog_product_keys",
        element: <CatalogProductKeysPage />,
        nav: true,
        permission: "catalog_product_key.view",
      },
      {
        path: "catalog/professions",
        labelKey: "nav.catalog_professions",
        element: <CatalogProfessionsPage />,
        nav: true,
        permission: "catalog_profession.view",
      },
      {
        path: "catalog/bundles",
        labelKey: "nav.catalog_bundles",
        element: <CatalogBundlesPage />,
        nav: true,
        permission: "catalog_bundle.view",
      },
    ],
  },
  {
    id: "payments",
    labelKey: "nav.payments",
    icon: <PaymentsRoundedIcon />,
    basePath: "/payments",
    routes: [
      {
        path: "payments/orders",
        labelKey: "nav.orders",
        element: <OrdersPage />,
        nav: true,
        permission: "order.view",
      },
      {
        path: "payments/intents",
        labelKey: "nav.payment_intents",
        element: <PaymentIntentsPage />,
        nav: true,
        permission: "payment_intent.view",
      },
      {
        path: "payments/proofs",
        labelKey: "nav.payment_proofs",
        element: <PaymentProofsPage />,
        nav: true,
        permission: "payment_proof.view",
      },
      {
        path: "payments/methods",
        labelKey: "nav.payment_methods",
        element: <PaymentMethodsPage />,
        nav: true,
        permission: "payment_method.view",
      },
      {
        path: "payments/banks",
        labelKey: "nav.payment_banks",
        element: <BanksPage />,
        nav: true,
        permission: "bank.view",
      },
      {
        path: "payments/escrows",
        labelKey: "nav.escrows",
        element: <EscrowsPage />,
        nav: true,
        permission: "escrow.view",
      },
      {
        path: "payments/escrow-transactions",
        labelKey: "nav.escrow_transactions",
        element: <EscrowTransactionsPage />,
        nav: true,
        permission: "escrow_transaction.view",
      },
      {
        path: "payments/payouts",
        labelKey: "nav.payouts",
        element: <PayoutsPage />,
        nav: true,
        permission: "payout.view",
      },
      {
        path: "payments/audit-logs",
        labelKey: "nav.payment_audit_logs",
        element: <PaymentAuditLogsPage />,
        nav: true,
        permission: "payment_audit_log.view",
      },
      {
        path: "payments/wallets",
        labelKey: "nav.wallets",
        element: <WalletsPage />,
        nav: true,
        permission: "wallet.view",
      },
      {
        path: "payments/wallet-transactions",
        labelKey: "nav.wallet_transactions",
        element: <WalletTransactionsPage />,
        nav: true,
        permission: "wallet_transaction.view",
      },
      {
        path: "payments/referral-codes",
        labelKey: "nav.referral_codes",
        element: <ReferralCodesPage />,
        nav: true,
        permission: "referral_code.view",
      },
      {
        path: "payments/referral-events",
        labelKey: "nav.referral_events",
        element: <ReferralEventsPage />,
        nav: true,
        permission: "referral_event.view",
      },
      {
        path: "payments/reward-rules",
        labelKey: "nav.reward_rules",
        element: <RewardRulesPage />,
        nav: true,
        permission: "reward_rule.view",
      },
      {
        path: "payments/reward-transactions",
        labelKey: "nav.reward_transactions",
        element: <RewardTransactionsPage />,
        nav: true,
        permission: "reward_transaction.view",
      },
    ],
  },
  {
    id: "configuration",
    labelKey: "nav.configuration",
    icon: <TuneRoundedIcon />,
    basePath: "/configuration",
    routes: [
      {
        path: "configuration/feature-flags",
        labelKey: "nav.feature_flags",
        element: <FeatureFlagsPage />,
        nav: true,
        permission: "feature_flag.view",
      },
      {
        path: "configuration/app-settings",
        labelKey: "nav.app_settings",
        element: <AppSettingsPage />,
        nav: true,
        permission: "app_setting.view",
      },
      {
        path: "configuration/config-versions",
        labelKey: "nav.config_versions",
        element: <ConfigVersionsPage />,
        nav: true,
        permission: "app_config_version.view",
      },
      {
        path: "configuration/content-sections",
        labelKey: "nav.content_sections",
        element: <ContentSectionsPage />,
        nav: true,
        permission: "content_section.view",
      },
      {
        path: "configuration/content-blocks",
        labelKey: "nav.content_blocks",
        element: <ContentBlocksPage />,
        nav: true,
        permission: "content_block.view",
      },
      {
        path: "configuration/content-templates",
        labelKey: "nav.content_templates",
        element: <ContentTemplatesPage />,
        nav: true,
        permission: "content_template.view",
      },
      {
        path: "configuration/content-template-blocks",
        labelKey: "nav.content_template_blocks",
        element: <ContentTemplateBlocksPage />,
        nav: true,
        permission: "content_template_block.view",
      },
      {
        path: "configuration/content-templates/builder",
        labelKey: "nav.content_template_builder",
        element: <ContentTemplateBuilderPage />,
        nav: true,
        permission: "content_template.update",
      },
      {
        path: "configuration/content-templates/builder/:templateId",
        labelKey: "nav.content_template_builder",
        element: <ContentTemplateBuilderPage />,
        nav: false,
        permission: "content_template.update",
      },
      {
        path: "configuration/content-templates/output",
        labelKey: "nav.content_template_output",
        element: <ContentTemplateOutputPage />,
        nav: true,
        permission: "content_template.view",
      },
      {
        path: "configuration/content-templates/output/:templateId",
        labelKey: "nav.content_template_output",
        element: <ContentTemplateOutputPage />,
        nav: false,
        permission: "content_template.view",
      },
      {
        path: "configuration/content-sync",
        labelKey: "nav.content_sync",
        element: <ContentSyncPage />,
        nav: true,
        permission: "content_template.update",
      },
      {
        path: "configuration/config-preview",
        labelKey: "nav.config_preview",
        element: <ConfigPreviewPage />,
        nav: true,
        permission: "app_setting.view",
      },
    ],
  },
  {
    id: "studio",
    labelKey: "nav.studio",
    icon: <AutoAwesomeRoundedIcon />,
    basePath: "/studio",
    routes: [
      {
        path: "studio",
        labelKey: "nav.studio",
        element: <ExperienceStudioPage />,
        nav: true,
        permission: "app_setting.view",
      },
    ],
  },
  {
    id: "ops",
    labelKey: "nav.ops",
    icon: <MonitorHeartRoundedIcon />,
    basePath: "/ops",
    routes: [
      {
        path: "ops",
        labelKey: "nav.ops_center",
        element: <OpsCenterPage />,
        nav: true,
        permission: "system_health.view",
      },
      {
        path: "ops/observability",
        labelKey: "nav.observability",
        element: <ObservabilityPage />,
        nav: true,
        permission: "system_health.view",
      },
      {
        path: "ops/system-health",
        labelKey: "nav.system_health",
        element: <SystemHealthPage />,
        nav: true,
        permission: "system_health.view",
      },
      {
        path: "ops/system-alerts",
        labelKey: "nav.system_alerts",
        element: <SystemAlertsPage />,
        nav: true,
        permission: "system_alert.view",
      },
      {
        path: "ops/notifications",
        labelKey: "nav.notifications",
        element: <NotificationsPage />,
        nav: true,
        permission: "notification.view",
      },
      {
        path: "ops/admin-console",
        labelKey: "nav.admin_console",
        element: <AdminConsolePage />,
        nav: true,
        permission: "audit_log.view",
      },
    ],
  },
  {
    id: "knowledge",
    labelKey: "nav.knowledge",
    icon: <MenuBookRoundedIcon />,
    basePath: "/knowledge",
    routes: [
      {
        path: "knowledge",
        labelKey: "nav.knowledge",
        element: <KnowledgeIndexPage />,
        nav: true,
      },
      {
        path: "knowledge/getting-started",
        labelKey: "nav.knowledge_getting_started",
        element: <KnowledgeGettingStartedPage />,
        nav: false,
      },
      {
        path: "knowledge/security",
        labelKey: "nav.knowledge_security",
        element: <KnowledgeSecurityPage />,
        nav: false,
      },
      {
        path: "knowledge/payments",
        labelKey: "nav.knowledge_payments",
        element: <KnowledgePaymentsPage />,
        nav: false,
      },
    ],
  },
];

export const MODULE_ROUTES: ModuleRoute[] = MODULES.flatMap((module) =>
  module.routes.map((route) => ({
    ...route,
    element: wrapFeatureFlag(
      wrapPermission(route.element, route.permission || module.permission),
      route.featureFlag || module.featureFlag
    ),
  }))
);

const LEGACY_REDIRECT_ROUTES: ModuleRoute[] = [
  {
    path: "services",
    labelKey: "nav.catalog_products",
    element: <Navigate to="/catalog/products" replace />,
    nav: false,
  },
  {
    path: "support",
    labelKey: "nav.tickets",
    element: <Navigate to="/tickets" replace />,
    nav: false,
  },
  {
    path: "wallet",
    labelKey: "nav.payouts",
    element: <Navigate to="/payments/payouts" replace />,
    nav: false,
  },
];

export const ALL_ROUTES: ModuleRoute[] = [...MODULE_ROUTES, ...LEGACY_REDIRECT_ROUTES];

const canAccess = (access: AccessProfile | undefined, permission?: string) => {
  if (!permission) {
    return true;
  }
  if (access?.is_superuser) {
    return true;
  }
  return Boolean(access?.permissions?.includes(permission));
};

export const buildNavSections = (access?: AccessProfile, flags: Set<string> = new Set()) =>
  MODULES.map((module) => {
    if (module.featureFlag && flags.size > 0 && !flags.has(module.featureFlag)) {
      return null;
    }
    const items = module.routes
      .filter((route) => route.nav)
      .filter((route) => {
        const flag = route.featureFlag || module.featureFlag;
        if (flag && flags.size > 0 && !flags.has(flag)) {
          return false;
        }
        return canAccess(access, route.permission || module.permission);
      })
      .map((route) => ({
        path: route.path ? `/${route.path}` : "/",
        labelKey: route.labelKey,
        icon: module.icon,
        permission: route.permission || module.permission,
      }));
    return {
      id: module.id,
      labelKey: module.labelKey,
      icon: module.icon,
      items,
    } satisfies NavSection;
  })
    .filter((section): section is NavSection => Boolean(section))
    .filter((section) => section.items.length > 0);

export const buildCommandItems = (sections: NavSection[]) =>
  sections.flatMap((section) =>
    section.items.map((item) => ({
      path: item.path,
      labelKey: item.labelKey,
      icon: item.icon,
    }))
  );

export const ROUTE_LABEL_MAP: Record<string, string> = MODULES.reduce((acc, module) => {
  acc[module.basePath] = module.labelKey;
  module.routes.forEach((route) => {
    const key = route.path ? `/${route.path}` : "/";
    acc[key] = route.labelKey;
  });
  return acc;
}, {} as Record<string, string>);
