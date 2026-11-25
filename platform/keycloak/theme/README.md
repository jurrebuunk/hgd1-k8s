# buunk auth · Flatwork Keycloak theme

The `buunk-auth.zip` handoff, implemented using **`@flatwork-ui/react` 0.2.0**.
Sign-in, OTP, password reset and reset confirmation share the same shell and
binary wordmark. Keycloak 26.8.2 still handles authentication server-side.

## Source and generated files

Edit **`src/`**, not the generated `.ftl`, `flatwork.css`, `auth.css` or `auth.js`.

| Source | Responsibility |
| --- | --- |
| `src/layout.tsx` | Shared FlatworkRoot, language selector, alerts and Keycloak session checks |
| `src/pages.tsx` | Sign-in (including reset-sent confirmation), OTP, password-reset and result templates |
| `src/components.tsx` | Shared library-based fields/actions, icons and BinaryWordmark |
| `src/binary.mjs` | Unchanged deterministic handoff geometry (seed 1729) |
| `src/auth.css` | Handoff's mobile/tablet/desktop layout, using the library's `--fw-*` tokens |
| `src/auth.js` | Password visibility, OTP input enhancement, locale navigation and duplicate-submit prevention |
| `src/freemarker.tsx` | Explicit FreeMarker placeholders; only registered expressions bypass React escaping |
| `scripts/build.tsx` | React server rendering → FreeMarker; copies published library CSS and fonts |
| `messages_{en,nl}.properties` | Auth copy; inherited Keycloak messages remain available |
| `theme.properties` | Base-template class mapping and colour mode |

`FlatworkRoot`, `Field`, `Input`, `InputGroup`, `Checkbox`, `Radio`, `Alert`,
`Button` and `ButtonLink` come from the npm package. React runs **only at build
time**. No client React bundle, credentials JSON, CDN, or third-party font
request is needed. Only small handoff SVG icons ship; the unused Material
Symbols font is omitted to keep the ConfigMap comfortably below 1 MiB.

```sh
cd platform/keycloak/theme
npm ci
npm run typecheck
npm run build
npm test
```

Commit generated files with source changes: Flux mounts them directly, so
cluster deployment needs neither Node nor an image build. CSS and JavaScript
URLs carry a content hash to invalidate returning browsers' cached assets on
rollout. The CI workflow
checks that generated files are current.

## Design and behaviour

- **<640px:** full-bleed form, no decorative background/card; 48px inputs and
  primary actions, with 16px input text to prevent mobile focus zoom.
- **640–1023px:** centred 400px bordered card over the binary wordmark.
- **≥1024px:** a right-hand pane occupying 48%; borderless 380px form.
- No header, logo, footer, realm badge or fake providers.
- Dark by default, as supplied. Set `fwColorMode` to `light` or `system` in
  `theme.properties` to change this; the library supplies all colour tokens.
- Credential errors are announced above sign-in and mark both inputs invalid.
- OTP progressively enhances Keycloak's normal `name="otp"` field into six
  digits: auto-advance, paste/autofill, Backspace, arrow keys, and a Verify
  button disabled until complete. Without JavaScript the original field and
  server submission work. This matches the realm's default six-digit policy.
- Multiple enrolled authenticators retain Keycloak's credential selection.
- Password reset posts to Keycloak and shows confirmation **only after the
  server succeeds**. No invented expiry, support URL or trust-device promise.
- Inherited required actions, WebAuthn/passkeys, recovery and error pages use
  the same layout and library class mappings. Session polling, conditional
  passkey data and alternative authentication remain intact.

Realm settings are intentionally unchanged. Social providers, registration,
remember-me, reset and language switching follow actual Keycloak configuration.
The production `hgd1` realm has **no SMTP, registration or configured identity
providers**, so reset/registration/provider actions are hidden. Its current
single-language setting displays EN; if internationalization is enabled, the
selector uses Keycloak's supported locale URLs (English/Dutch copy included).
OTP recovery appears through Keycloak's alternative-method action only when
that method is configured. There is no fake “trust this device” checkbox.

## Local integration preview

Requires Docker on Linux and Chromium. This starts a **disposable**,
loopback-only Keycloak 26.8.2 on port 18080, with a synthetic `theme-test` realm;
no real realm/accounts/credentials are used. Test users exist only inside this
container and disappear when it stops.

```sh
npm run preview
# another terminal:
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

Open
<http://localhost:18080/realms/theme-test/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2Flocalhost%3A18080%2F&response_type=code&scope=openid>.
Test-only users `preview` and `otp-preview` use `preview-password-only`.
The browser suite runs a loopback SMTP sink on port 2525, verifies a real reset
email and password update, and therefore changes the disposable `preview`
password. **Restart the preview before rerunning the suite.**

The suite checks real sign-in/OTP/reset submissions, wrong credentials/codes,
OTP typing/paste/Backspace, Dutch locale navigation, no-JS sign-in/OTP, theme
assets, console errors, desktop/tablet/mobile layouts and light mode. Captures
go to `/tmp/hgd1-auth-review` (`REVIEW_DIR` overrides).

## Deploy and rollback

Follow [Your first change](../../../docs/get-started/first-change.md) and
[Keycloak](../../../docs/concepts/keycloak.md):

```sh
kustomize build platform/keycloak >/dev/null
# commit source + generated theme assets + manifests, then:
git push
flux reconcile kustomization platform --with-source
kubectl -n keycloak rollout status statefulset/keycloak --timeout=10m
flux get kustomizations
```

The hashed ConfigMap is wired through `kustomizeconfig.yaml`; changing it
rolls both Keycloak pods through the operator. Check both are Ready and inspect
a fresh login from Cloudreve/WARP, including asset requests and error state.
Do **not** `kubectl apply` or edit Flux-owned resources. Roll back by reverting
the theme commit, pushing, and reconciling `platform` again.
