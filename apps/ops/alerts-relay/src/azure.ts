// Azure Monitor -> Slack translation.
//
// Azure Monitor action groups have no Slack receiver: the `webhook` receiver
// POSTs Azure's own JSON, and a Slack Incoming Webhook only accepts Slack's.
// This module is the translation, and it is the entire reason the relay exists.
//
// Only the Common Alert Schema is handled. The action group must set
// `useCommonAlertSchema: true` (infra: bicep/modules/alerts-action-group.bicep);
// the legacy
// per-signal payloads differ by signal type and are not worth supporting.
// Reference: https://learn.microsoft.com/azure/azure-monitor/alerts/alerts-common-schema

import type { Severity, SlackMessage } from "./slack";

export interface AzureCommonAlert {
  schemaId?: string;
  data?: {
    essentials?: {
      alertRule?: string;
      severity?: string;
      signalType?: string;
      monitorCondition?: string;
      monitoringService?: string;
      alertTargetIDs?: string[];
      configurationItems?: string[];
      description?: string;
      firedDateTime?: string;
      resolvedDateTime?: string;
      alertId?: string;
    };
    alertContext?: Record<string, unknown>;
  };
}

// Sev0/Sev1 are the ones worth waking someone for; Sev2 is a warning; Sev3/Sev4
// are informational. A resolved alert is always good news regardless of severity.
const SEVERITY_BY_AZURE_SEV: Record<string, Severity> = {
  Sev0: "critical",
  Sev1: "critical",
  Sev2: "warning",
  Sev3: "info",
  Sev4: "info",
};

export function isAzureCommonAlert(body: unknown): body is AzureCommonAlert {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as AzureCommonAlert).schemaId === "azureMonitorCommonAlertSchema"
  );
}

/**
 * Last segment of an ARM resource id, so `.../containerApps/portal-api-prod`
 * becomes `portal-api-prod`. Azure lowercases id segments inconsistently
 * between signals, so never match on the type segment.
 */
function resourceName(resourceId: string): string {
  const segments = resourceId.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? resourceId;
}

/**
 * Environment from the resource group, which this estate names
 * `vesperp4-<env>-rg`. Returns undefined for anything else rather than
 * guessing, so an unexpected resource does not get mislabelled as prod.
 */
export function environmentFromResourceId(
  resourceId: string,
): string | undefined {
  const match = /\/resource[gG]roups\/vesperp4-([a-z0-9]+)-rg\//.exec(
    resourceId,
  );
  return match?.[1];
}

function alertPortalUrl(alertId: string): string {
  return `https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AlertDetailsTemplateBlade/alertId/${encodeURIComponent(alertId)}`;
}

export function formatAzureAlert(alert: AzureCommonAlert): SlackMessage {
  const essentials = alert.data?.essentials ?? {};
  const resolved = essentials.monitorCondition === "Resolved";
  const severity: Severity = resolved
    ? "good"
    : (SEVERITY_BY_AZURE_SEV[essentials.severity ?? ""] ?? "warning");

  const targets = essentials.alertTargetIDs ?? [];
  const environment = targets
    .map(environmentFromResourceId)
    .find((env): env is string => env !== undefined);

  const fields: Array<{ label: string; value: string }> = [];
  if (environment) {
    fields.push({ label: "Environment", value: environment });
  }
  if (targets.length) {
    fields.push({
      label: targets.length > 1 ? "Resources" : "Resource",
      value: targets.map(resourceName).join(", "),
    });
  }
  if (essentials.severity) {
    fields.push({ label: "Severity", value: essentials.severity });
  }
  if (essentials.signalType) {
    fields.push({ label: "Signal", value: essentials.signalType });
  }

  const when = resolved
    ? essentials.resolvedDateTime
    : essentials.firedDateTime;

  const rule = essentials.alertRule ?? "Azure Monitor alert";

  return {
    severity,
    title: resolved ? `Resolved: ${rule}` : rule,
    body: essentials.description || undefined,
    fields,
    context: when
      ? `${resolved ? "Resolved" : "Fired"} ${when}`
      : undefined,
    link: essentials.alertId
      ? { text: "Open in Azure", url: alertPortalUrl(essentials.alertId) }
      : undefined,
  };
}
