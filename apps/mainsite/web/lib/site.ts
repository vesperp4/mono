// Site-wide constants shared by the Navbar, Footer, and contact page so the
// chapter's canonical links live in exactly one place.

/** Signup lives on the portal app (portal.vesperp4.com), not the mainsite. */
export const PORTAL_SIGNUP_URL = "https://portal.vesperp4.com/signup";

export const CHAPTER_EMAIL = "info@vesperp4.com";

// Discord invite is not public yet — the href stays a "#" placeholder until
// the chapter publishes it. Keep rendering the icon so the layout is ready.
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vesperp4" },
  { label: "GitHub", href: "https://github.com/vesperp4" },
  { label: "Discord", href: "#" },
] as const;

export type SocialLabel = (typeof SOCIAL_LINKS)[number]["label"];
