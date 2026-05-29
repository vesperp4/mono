# `iac/azure/entra/` — Identity & access for the vesperp4 Entra tenant

Companion teaching doc for how identity and access is structured in the chapter's Entra tenant — who has what role, why each choice was made, and which Microsoft Learn page backs each decision.

Unlike `iac/azure/bicep/`, there is no Bicep here. Entra resources (security groups, role assignments, directory roles, tenant policies) live in Microsoft Graph rather than Azure Resource Manager. The `Microsoft.Graph` Bicep extension is still preview and shape-changes frequently, so for now this layer is documented prose + the `az` commands you ran to create the state. When the Graph extension stabilizes we'll port this to Bicep.

---

## 1. Tenant context

| Field | Value |
|---|---|
| Tenant ID | `4cb021ac-682f-419c-9bf1-dba159e55bb9` |
| Default domain | `vesperp4.com` (set as `isDefault: True`) |
| Initial domain (`*.onmicrosoft.com`) | `vesperp4.onmicrosoft.com` |
| License (8 seats, all consumed) | Microsoft 365 Business Basic (`O365_BUSINESS_ESSENTIALS`) |
| Entra ID tier | **Free** (the tier bundled with Business Basic) |
| Subscription tied to nonprofit credit | `1e180171-becb-40cd-a4a0-52351087be66` |

**What Entra ID Free permits:**
- Security groups + group-based Azure RBAC
- Security Defaults (blunt tenant-wide MFA — see §5)
- Self-service password reset for cloud users
- Basic sign-in audit (portal-only; no Graph API query)

**What Entra ID Free blocks (would need P1 or P2):**
- ❌ Conditional Access policies (P1) — Security Defaults is the substitute, all-or-nothing
- ❌ Group-based license assignment (P1)
- ❌ PIM / just-in-time admin elevation (P2)
- ❌ Identity Protection / risk-based sign-in (P2)
- ❌ Sign-in log Graph API (P1+) — calling `auditLogs/signIns` errors with `RequestFromNonPremiumTenant`

**Upgrade path.** Microsoft for Nonprofits grants up to 10 free seats of **Microsoft 365 Business Premium**, which includes Entra ID P1 (plus Intune and Defender). Claim at <https://nonprofit.microsoft.com>. Once licenses are assigned, the right move is to disable Security Defaults and replace it with surgical Conditional Access policies — at which point §5 of this doc needs a rewrite.

Refs:
- Entra ID overview: <https://learn.microsoft.com/en-us/entra/fundamentals/whatis>
- Feature availability by tier: <https://learn.microsoft.com/en-us/entra/fundamentals/feature-availability>

---

## 2. Group structure

The principle: **assign Azure RBAC roles to groups, not directly to users.** Future joiners get added to the right group; future leavers get removed in one place; audit becomes "look at group membership" instead of "scrape every direct assignment across every scope."

| Group | Object ID | Azure role | Scope | Members |
|---|---|---|---|---|
| `infra-admins` | `2642f52a-cec5-4c40-bbf5-2d3e8c51ad33` | `Owner` | Subscription `1e180171-...` | Ramon Collazo, Jesiel Carro |

Groups deliberately **not yet created** — we add them when there's a member to put in:

- **`developers`** — would hold humans with Azure `Contributor`. Empty by design today: deploys go through GitHub Actions, no human needs to operate Azure outside the pipeline.
- **`readers`** — would hold board members / auditors with `Reader` or `Cost Management Reader`. No member today.

**Why `securityEnabled: true`, `mailEnabled: false`.** Azure RBAC only accepts security-enabled groups. The tenant has several **distribution / Microsoft 365 groups** (visible in `az ad group list` — `All Company`, `Vesper P4`, `Vesper P4 Shared Mailbox Admin`, etc.) but those are for email distribution and Teams membership; they cannot hold Azure role assignments. The two group types serve different purposes and live alongside each other without conflict.

Refs:
- Concept of groups in Entra: <https://learn.microsoft.com/en-us/entra/fundamentals/concept-learn-about-groups>
- Group-based RBAC: <https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal>
- Why security-enabled is required for RBAC: <https://learn.microsoft.com/en-us/azure/role-based-access-control/conditions-overview>

---

## 3. Direct vs group-based role assignment

When the subscription was first created, the creator (Ramon) automatically received `Owner` via a **direct user assignment**. That was replaced with a **group-based assignment**: `infra-admins` now holds Owner, and Ramon + Jesiel are members of the group. Effective access didn't change; the mechanism became durable.

**Sequence used (any future admin onboarding should mirror this):**

1. Confirm the group exists and the new admin is a member.
2. Assign the role to the group (if not already), verify both the existing and new assignments are visible in `az role assignment list --all`.
3. Only after step 2 confirms two paths, delete any direct user→role assignment.

Doing it in the other order risks locking yourself out mid-operation. **Never delete the only path you have to a scope.**

**The deliberate exception: break-glass (§4).** The break-glass account holds Owner via a **direct user assignment**, not via a group. This is on purpose — if group resolution fails (Graph propagation issue, group accidentally deleted, tenant config drift), break-glass must still work. Every other admin uses the group mechanism; break-glass does not.

Ref: <https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices>

---

## 4. Break-glass account

| Field | Value |
|---|---|
| UPN | `breakglass@vesperp4.onmicrosoft.com` |
| Object ID | `261a0337-dec0-4f00-b4b9-51c235275e74` |
| Display name | `Break-glass Admin` |
| Password storage | 1Password / Bitwarden entry tagged `EMERGENCY ONLY — vesperp4 break-glass`. Do not access except for incident recovery. |
| MFA device | Separate from any daily-driver device — fill this in below once registered, e.g. *"YubiKey serial XXXX stored in the office safe"* or *"authenticator app on the spare phone in the safe"*. |
| Azure role | `Owner` on subscription `1e180171-...` — **direct, not via group** |
| Entra role | `Global Administrator` at tenant root scope (`/`) — **direct** |

**Why `*.onmicrosoft.com` and not `vesperp4.com`.** The break-glass account is meant to survive scenarios where the custom domain is misconfigured, expired, or has DNS problems. The auto-generated `*.onmicrosoft.com` domain is administered by Microsoft and can't be lost — perfect emergency anchor. Daily-driver accounts use the custom domain for branding; break-glass deliberately doesn't.

**Why both Owner *and* Global Administrator.** Owner gives full Azure RBAC on the subscription (can reassign roles, change billing, deploy/destroy resources). Global Administrator gives full Entra control (can recover other admins, reset MFA, modify directory policies). An emergency could be in either control plane, so break-glass needs both.

**When to sign in:**
- Both Ramon and Jesiel are locked out simultaneously (lost MFA devices, accounts compromised, etc.).
- A tenant-wide auth misconfigure (unlikely on Free tier since we can't author Conditional Access policies — relevant once we move to P1).
- Any other "I cannot recover via the daily admin accounts" scenario.

**What to do AFTER signing in:**

1. Resolve whatever the emergency was (re-grant access to a recovered daily admin account, reset MFA, etc.).
2. **Rotate the break-glass password immediately** — every sign-in is potential exposure. Generate a new one, update the password manager entry, confirm a sign-in still works, sign out.
3. Re-register MFA if the device used was compromised or out of trusted hands.
4. Add a one-line incident note at the bottom of this section: date, what triggered the use, who logged in, what was fixed.

**Discipline.** On Entra Free we cannot alert on break-glass sign-ins (would need P1 + Sentinel or similar SIEM). Self-discipline is the only control: this account is **not** for routine work, **not** for "I just want a quick admin context," **not** for testing. Every sign-in should be retrospectively justifiable as an emergency.

**Annual MFA test.** Once per year, sign in once via private browser, confirm MFA still works, sign out. Log the date here so we know the device was good as of that date.

Incident log:

| Date | Reason | Who | Resolution |
|---|---|---|---|

Refs:
- Microsoft break-glass guidance (this is the canonical pattern): <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access>
- Why two break-glass accounts at larger scale (we have one — acceptable for this org size): <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access#create-emergency-access-accounts>

---

## 5. Authentication baseline — Security Defaults

The tenant has **Security Defaults enabled**. This is Microsoft's free preset that enforces:

1. **All users must register MFA** within 14 days of first sign-in (Microsoft Authenticator or any TOTP app).
2. **Admins must MFA on every sign-in** to admin surfaces (Azure portal, M365 admin center, Graph API tools).
3. **Risk-based MFA challenges** for non-admins (unusual location, new device, etc.).
4. **Legacy authentication blocked** — POP, IMAP, SMTP AUTH, old Office clients without modern auth.

**The blunt tradeoff.** Security Defaults is all-or-nothing — every user, all the time. You cannot exempt a user (not even break-glass), you cannot scope to a region, you cannot trust internal networks. The fix would be Conditional Access policies, which require Entra ID P1.

**Implication for break-glass.** Since the break-glass account is *not* exempt from Security Defaults, its MFA must be on a device that's:
- Physically separate from any daily admin's device
- Stored where you can reach it during an emergency (office safe, etc.)
- Tested annually (see §4)

**Implication for legacy systems.** If anything (a script, an old SMTP relay, a vintage Outlook client) authenticates with basic auth, it stops working the moment Security Defaults is enabled. The tenant was created April 2026 with modern auth defaults, so no legacy is expected — but verify with the team before assuming.

**Toggling Security Defaults.** The Graph endpoint is `/policies/identitySecurityDefaultsEnforcementPolicy`. The required scope is `Policy.ReadWrite.SecurityDefaults`, which is **not** in the Azure CLI's default token scope set. Reading or writing this setting from `az rest` returns `AccessDenied, required scopes are missing in the token` even when you're a Global Administrator. Workaround: toggle in the portal at **Microsoft Entra ID → Properties → Manage security defaults**, which uses portal-issued tokens with the right scope baked in.

Refs:
- Security Defaults concept: <https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults>
- Security Defaults vs Conditional Access: <https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-security-defaults>
- The scope quirk: <https://learn.microsoft.com/en-us/graph/permissions-reference#policyreadwritesecuritydefaults>

---

## 6. Tenant authorization policy

Three tenant-wide settings tightened from Microsoft's defaults. The endpoint is `/policies/authorizationPolicy`; required scope is `Policy.ReadWrite.Authorization`, which **is** in the Azure CLI's default token scope set (unlike `Policy.ReadWrite.SecurityDefaults` — see §5). So these can be PATCHed from `az rest` directly.

| Field | Default | Set to | Why |
|---|---|---|---|
| `allowInvitesFrom` | `adminsGuestInvitersAndAllMembers` | `adminsAndGuestInviters` | Only directory admins (Global, User, Guest Inviter) can invite external users. Members can't accidentally invite friends/family/contractors. |
| `allowedToSignUpEmailBasedSubscriptions` | `true` | `false` | Stops users from creating Microsoft trial subscriptions (Power Apps trial, Dynamics 365 trial, etc.) against the tenant just by signing up with their work email. Trials show up in your tenant, clutter billing, and create shadow Azure resources. |
| `allowEmailVerifiedUsersToJoinOrganization` | `true` | `false` | Stops external users with email-verified accounts in other tenants from self-service joining yours. Tenant membership becomes strictly invitation-only. |

**Reading current state:**

```bash
az rest --method get \
  --url 'https://graph.microsoft.com/v1.0/policies/authorizationPolicy' \
  --query '{allowInvitesFrom:allowInvitesFrom, allowedToSignUpEmailBasedSubscriptions:allowedToSignUpEmailBasedSubscriptions, allowEmailVerifiedUsersToJoinOrganization:allowEmailVerifiedUsersToJoinOrganization}' \
  -o yaml
```

**Restoring to expected state if any value drifts:**

```bash
az rest --method patch \
  --url 'https://graph.microsoft.com/v1.0/policies/authorizationPolicy' \
  --body '{
    "allowInvitesFrom": "adminsAndGuestInviters",
    "allowedToSignUpEmailBasedSubscriptions": false,
    "allowEmailVerifiedUsersToJoinOrganization": false
  }'
```

**Settings deliberately NOT changed:**

- `defaultUserRolePermissions` — what default Members can do (create apps, register devices, read other users, etc.). The guest-invite piece is now gated by the policy above; other defaults are mostly harmless on Free tier without admin-consent risk. Revisit if app-registration spam becomes an issue.
- `guestUserRoleId` — the role guest users get when invited. Default is "Restricted Guest" which is already the most-restrictive option; no change needed.

Ref: <https://learn.microsoft.com/en-us/graph/api/resources/authorizationpolicy>

---

## 7. What this layer deliberately does NOT do

Intentional omissions; do not "add" them without thinking through cost / complexity.

| Omitted | Why |
|---|---|
| Conditional Access policies | Require Entra ID P1. Until M365 Business Premium is claimed via nonprofit grant (§1), Security Defaults is the substitute. |
| PIM (Privileged Identity Management) | Requires Entra ID P2. Admins are always-on; no eligible / just-in-time elevation. Acceptable at 2-admin scale; revisit at >5 admins. |
| Identity Protection / risk-based policies | Requires P2. |
| Federated identity for GitHub Actions → Azure | Separate work item. Today the SWA deploys with `AZURE_STATIC_WEB_APPS_API_TOKEN` (a long-lived deploy token). Worth adding when a backend ships that needs to call Azure-managed services, per <https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-create-trust-github>. |
| User onboarding / offboarding runbook | Not written yet. When the org grows past founding-team scale, add a checklist file under this dir covering: invite (admin-only now), add to relevant groups, MFA registration verification, removal on departure. |
| Custom Entra ID company branding | Cosmetic; deferred. |
| Service principal management for the website / future apps | None today (the SWA token is a Microsoft-managed credential, not an SP). When future workloads need to call Azure services, create per-workload managed identities, not shared SPs. |

---

## 8. Refs

- Entra ID overview: <https://learn.microsoft.com/en-us/entra/fundamentals/whatis>
- Feature availability matrix (Free vs P1 vs P2): <https://learn.microsoft.com/en-us/entra/fundamentals/feature-availability>
- Security Defaults: <https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults>
- Conditional Access concept (for future P1 migration): <https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview>
- Break-glass / emergency access pattern: <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access>
- Authorization policy reference: <https://learn.microsoft.com/en-us/graph/api/resources/authorizationpolicy>
- Group-based RBAC: <https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal>
- Azure RBAC best practices: <https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices>
- M365 Business Premium for nonprofits: <https://www.microsoft.com/en-us/nonprofits/microsoft-365>
- Graph API permissions reference: <https://learn.microsoft.com/en-us/graph/permissions-reference>
