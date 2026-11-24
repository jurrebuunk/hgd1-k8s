# flatwork login theme

The login pages of `auth.buunk.org` in the flatwork-saas design language
(Geist and IBM Plex Mono, the muted palette with one blue accent, flat with
1px borders). Built on Keycloak's `base` theme: `template.ftl` (top bar,
card, footer) and `login.ftl` (the sign-in form) are our own; every other
page uses base's templates with the class names mapped in
`theme.properties`, styled by `flatwork.css`.

`../kustomization.yaml` packs these files into a config map that is mounted
at `/opt/keycloak/themes/flatwork` (see `keycloak.yaml`); a change rolls the
Keycloak pods. The realm selects it with `loginTheme: flatwork`.

Fonts: Geist (Vercel) and IBM Plex Mono (IBM), both SIL Open Font License
1.1, latin subset from Fontsource.
