import React, { useState } from "react";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { request } from "../../../api/client";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { PageHeader } from "../../../components/PageHeader";

const resources = [
  "users",
  "permissions",
  "permission-templates",
  "role-templates",
  "user-permissions",
  "audit-logs",
  "feature-flags",
  "app-settings",
  "app-config-versions",
  "content-sections",
  "content-blocks",
  "content-templates",
  "content-template-blocks",
  "content-templates/sync",
  "notifications",
  "alerts",
  "monitoring/health",
  "user-devices",
  "user-sessions",
  "analytics/registrations",
  "analytics/logins",
  "service/catalog/categories",
  "service/catalog/products",
  "service/catalog/professions",
  "service/catalog/bundles",
  "service/catalog/metrics",
  "service/payment/orders",
  "service/payment/payment-methods",
  "service/payment/payment-intents",
  "service/payment/payment-proofs",
  "service/payment/escrows",
  "service/payment/escrow-transactions",
  "service/payment/banks",
  "service/payment/payouts",
  "service/payment/metrics",
  "service/payment/payment-audit-logs",
  "service/ras/tickets",
  "service/ras/sessions",
  "service/ras/logs",
  "service/ras/metrics",
  "service/ras/policy-audit-logs",
  "service/ras/chat-moderation-logs",
];

const resourceTemplates: Record<string, string> = {
  users: '{"email":"user@example.com","password":"StrongPass123!","role":"customer"}',
  permissions: '{"name":"View Orders","codename":"orders_view","resource":"orders","action":"view"}',
  "permission-templates": '{"name":"Ops Template","description":"Basic ops permissions","permissions":[],"is_active":true}',
  "role-templates": '{"role":"admin","name":"Admin Default","description":"","permissions":[],"templates":[],"is_active":true}',
  "user-permissions": '{"user":"<user_id>","permission":"<permission_id>","expires_at":null}',
  "feature-flags": '{"key":"new_feature","name":"New Feature","is_enabled":false,"rollout_percentage":50,"target_roles":["customer"]}',
  "app-settings": '{"key":"support.email","value":"support@sharoobi.local","value_type":"string","is_public":true}',
  "app-config-versions": '{"version":1,"name":"Baseline","status":"draft"}',
  "content-sections":
    '{"config_version":"<version_id>","key":"home_hero","section_type":"hero","title":"Hero","is_visible":true,"payload":{"background_color":"#101820","border_radius":16,"padding":[16,16],"overlay_color":"#000000","overlay_opacity":0.2}}',
  "content-blocks":
    '{"section":"<section_id>","key":"hero_item_1","block_type":"hero_item","is_visible":true,"payload":{"title":"Headline","description":"Hero copy","image_url":"https://cdn.example/hero.png","cta_label":"Explore","cta_style":"outline","badge":"Featured"}}',
  "content-templates/sync": '{"mode":"replace","screens":["home","explore","services","catalog","support","account"],"limit":6}',
  "service/catalog/categories": '{"name":"New Category","parent":null}',
  "service/catalog/products": '{"name":"Product","price_cents":1200,"currency":"USD","product_type":"digital_key","stock":0}',
  "service/catalog/professions": '{"name_en":"Profession","name_ar":"Profession AR"}',
  "service/catalog/bundles": '{"name":"Bundle","price_cents":2500,"currency":"USD"}',
  "service/payment/payment-methods": '{"code":"bank_code","name_en":"Bank Name","name_ar":"اسم البنك","method_type":"bank","is_active":true}',
  "service/payment/banks": '{"name_en":"Bank","name_ar":"بنك","deep_link":"https://bank.example"}',
  "service/payment/payouts": '{"target_type":"vendor","target_id":"<uuid>","amount_cents":1000,"currency":"USD"}',
  "service/ras/tickets": '{"title":"Support Ticket","description":"Details","priority":"Normal"}',
};

const resolveTemplate = (resource: string) => resourceTemplates[resource] || "{}";

const httpMethods = ["GET", "POST", "PATCH", "DELETE"];

export const AdminConsolePage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const defaultResource = resources[0];
  const [resource, setResource] = useState(defaultResource);
  const [resourceId, setResourceId] = useState("");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("GET");
  const [payload, setPayload] = useState(resolveTemplate(defaultResource));
  const [output, setOutput] = useState("{}");
  const [loading, setLoading] = useState(false);

  const buildUrl = () => {
    const path = resourceId ? `/bff/admin/${resource}/${resourceId}/` : `/bff/admin/${resource}/`;
    if (!query) {
      return path;
    }
    const suffix = query.startsWith("?") ? query : `?${query}`;
    return `${path}${suffix}`;
  };

  const handleRun = async () => {
    if (!tokens?.accessToken) {
      pushToast({ message: t("state.error"), severity: "error" });
      return;
    }
    setLoading(true);
    try {
      let body: string | undefined;
      if (method !== "GET" && method !== "DELETE") {
        if (payload.trim()) {
          JSON.parse(payload);
          body = payload;
        }
      }
      const response = await request<any>(
        buildUrl(),
        { method, body },
        tokens.accessToken
      );
      setOutput(JSON.stringify(response, null, 2));
    } catch (error) {
      pushToast({ message: t("console.invalid_payload"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPayload(resolveTemplate(resource));
    setOutput("{}");
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin_console_output.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permissions={["audit_log.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("console.title")} subtitle={t("console.subtitle")} />
        <Stack spacing={2}>
          <Typography variant="h3">{t("console.resource_console")}</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Stack spacing={2} flex={1}>
              <TextField
                select
                label={t("label.resource")}
                value={resource}
                onChange={(event) => {
                  const next = event.target.value;
                  setResource(next);
                  setPayload(resolveTemplate(next));
                }}
              >
                {resources.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={t("console.resource_id")}
                value={resourceId}
                onChange={(event) => setResourceId(event.target.value)}
              />
              <TextField
                label={t("console.query")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <TextField
                select
                label={t("console.method")}
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                {httpMethods.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleRun} disabled={loading}>
                  {t("console.execute")}
                </Button>
                <Button variant="outlined" onClick={handleClear}>
                  {t("action.reset")}
                </Button>
              </Stack>
            </Stack>
            <Stack spacing={1} flex={1}>
              <TextField
                label={t("console.payload")}
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                multiline
                minRows={12}
              />
              <Typography variant="caption" color="text.secondary">
                {t("console.payload_hint")}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handleDownload}>
              {t("console.download")}
            </Button>
          </Stack>
          <TextField
            label={t("console.output")}
            value={output}
            multiline
            minRows={10}
            InputProps={{ readOnly: true }}
          />
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
