// Site-wide constants shared by the Navbar, Footer, and contact page so the
// chapter's canonical links live in exactly one place.

/** Signup lives on the portal app (portal.vesperp4.com), not the mainsite. */
export const PORTAL_SIGNUP_URL = "https://portal.vesperp4.com/signup";

export const CHAPTER_EMAIL = "vesperp4@pupr.edu";

// Social profiles are not public yet — the hrefs stay "#" placeholders until
// the chapter publishes them. Keep rendering the icons so the layout is ready.
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Discord", href: "#" },
] as const;

export type SocialLabel = (typeof SOCIAL_LINKS)[number]["label"];
