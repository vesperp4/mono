import { describe, expect, it } from "vitest";

import {
  environmentFromResourceId,
  formatAzureAlert,
  isAzureCommonAlert,
  type AzureCommonAlert,
} from "../src/azure";

const CONTAINER_APP_ID =
  "/subscriptions/1e180171-becb-40cd-a4a0-52351087be66/resourceGroups/vesperp4-prod-rg/providers/Microsoft.App/containerApps/portal-api-prod";

function alert(
  essentials: Partial<
    NonNullable<NonNullable<AzureCommonAlert["data"]>["essentials"]>
  >,
): AzureCommonAlert {
  return {
    schemaId: "azureMonitorCommonAlertSchema",
    data: {
      essentials: {
        alertRule: "portal-api email send failures",
        severity: "Sev1",
        signalType: "Log",
        monitorCondition: "Fired",
        alertTargetIDs: [CONTAINER_APP_ID],
        firedDateTime: "2026-08-23T02:31:00.000Z",
        ...essentials,
      },
    },
  };
}

describe("isAzureCommonAlert", () => {
  it("accepts a common-schema payload", () => {
    expect(isAzureCommonAlert(alert({}))).toBe(true);
  });

  it("rejects a legacy payload with no schemaId", () => {
    expect(isAzureCommonAlert({ data: {} })).toBe(false);
    expect(isAzureCommonAlert(null)).toBe(false);
    expect(isAzureCommonAlert("nope")).toBe(false);
  });
});

describe("environmentFromResourceId", () => {
  it("reads the env out of the vesperp4-<env>-rg resource group", () => {
    expect(environmentFromResourceId(CONTAINER_APP_ID)).toBe("prod");
    expect(
      environmentFromResourceId(CONTAINER_APP_ID.replace("prod", "dev")),
    ).toBe("dev");
  });

  it("tolerates the lowercase 'resourcegroups' Azure sometimes emits", () => {
    expect(
      environmentFromResourceId(
        CONTAINER_APP_ID.replace("resourceGroups", "resourcegroups"),
      ),
    ).toBe("prod");
  });

  it("returns undefined rather than guessing on an unknown naming scheme", () => {
    expect(
      environmentFromResourceId(
        "/subscriptions/x/resourceGroups/something-else/providers/p/t/n",
      ),
    ).toBeUndefined();
  });
});

describe("formatAzureAlert", () => {
  it("maps Sev0/Sev1 to critical and Sev2 to warning", () => {
    expect(formatAzureAlert(alert({ severity: "Sev0" })).severity).toBe(
      "critical",
    );
    expect(formatAzureAlert(alert({ severity: "Sev1" })).severity).toBe(
      "critical",
    );
    expect(formatAzureAlert(alert({ severity: "Sev2" })).severity).toBe(
      "warning",
    );
    expect(formatAzureAlert(alert({ severity: "Sev4" })).severity).toBe("info");
  });

  it("falls back to warning on an unrecognised severity", () => {
    expect(formatAzureAlert(alert({ severity: "Sev9" })).severity).toBe(
      "warning",
    );
    expect(formatAzureAlert(alert({ severity: undefined })).severity).toBe(
      "warning",
    );
  });

  it("renders a resolved alert as good news whatever the severity", () => {
    const message = formatAzureAlert(
      alert({
        severity: "Sev0",
        monitorCondition: "Resolved",
        resolvedDateTime: "2026-08-23T03:00:00.000Z",
      }),
    );

    expect(message.severity).toBe("good");
    expect(message.title).toBe("Resolved: portal-api email send failures");
    expect(message.context).toContain("Resolved 2026-08-23T03:00:00.000Z");
  });

  it("puts environment and short resource name in the fields", () => {
    const message = formatAzureAlert(alert({}));

    expect(message.fields).toContainEqual({
      label: "Environment",
      value: "prod",
    });
    expect(message.fields).toContainEqual({
      label: "Resource",
      value: "portal-api-prod",
    });
  });

  it("pluralises the resource field and joins multiple targets", () => {
    const message = formatAzureAlert(
      alert({
        alertTargetIDs: [
          CONTAINER_APP_ID,
          CONTAINER_APP_ID.replace("portal-api-prod", "tv-engine-prod"),
        ],
      }),
    );

    expect(message.fields).toContainEqual({
      label: "Resources",
      value: "portal-api-prod, tv-engine-prod",
    });
  });

  it("links to the alert in the Azure portal when an alertId is present", () => {
    const message = formatAzureAlert(
      alert({ alertId: "/subscriptions/x/providers/Microsoft.AlertsManagement/alerts/abc" }),
    );

    expect(message.link?.url).toContain(
      encodeURIComponent(
        "/subscriptions/x/providers/Microsoft.AlertsManagement/alerts/abc",
      ),
    );
  });

  it("survives an essentials block with nothing in it", () => {
    const message = formatAzureAlert({
      schemaId: "azureMonitorCommonAlertSchema",
      data: {},
    });

    expect(message.title).toBe("Azure Monitor alert");
    expect(message.fields).toEqual([]);
    expect(message.link).toBeUndefined();
  });
});
