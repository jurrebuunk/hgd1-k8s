# buunk auth design

**Authority:** the supplied `buunk-auth.zip` HTML handoff, not the old
header/card/footer theme. Mode: Operate — authenticate, recover access, and
understand server feedback without distractions.

## Direction contract

**Thesis.** Implement the supplied auth screens faithfully; no new identity,
marketing chrome or simulated authentication.

**Own-world.** Flatwork's published flatwork-saas tokens and Geist / IBM Plex
Mono, self-hosted. Dark by default: warm near-black ground, warm surfaces,
muted blue-grey primary actions, semantic error/success colours. Small stroke
SVGs match the handoff. Components come from `@flatwork-ui/react`.

**Story.** Sign in with a buunk.org account, complete an authenticator challenge
when required, or request a real reset. Only configured actions are shown.

**First viewport.** Mobile: full-bleed form with 20px gutters; tablet: 400px
centred card; desktop: the right 48% is a surface-coloured pane with a 380px
form. The only chrome is the language control, top-right. The decorative
112×64 binary field is top-left anchored, hidden below 640px, and covered by
the desktop pane. No header or footer.

**Form.** User-pinned handoff; no concept roll. Seed 1729 preserves the binary
wordmark exactly. Reusable React components generate server-rendered templates.
Password reveal, OTP auto-advance/paste and server-backed feedback are the
signature interactions; no added entrance animation or decorative motion.

**Finish.** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Finish review

The implemented desktop/tablet/mobile screens were inspected against the
handoff. Real Keycloak flows are covered by the disposable-browser suite, not
static demo links. Primary button-link colours explicitly override the
library's generic anchor rule to retain readable contrast. Required actions
retain Keycloak's own scripts. No shipping raster artwork is used; the binary
wordmark is deterministic text geometry from the supplied source.

**Verdict:** handoff retained, with deliberate omissions for unsupported
production features (SMTP/reset, registration, social providers, device trust,
and unconfigured recovery) rather than non-functional controls. See README
for verification commands, generated-file ownership, and deployment.
