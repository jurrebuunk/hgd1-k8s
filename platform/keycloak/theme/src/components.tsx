import { Alert, Button, ButtonLink } from "@flatwork-ui/react";
import type { ReactNode } from "react";
import { Raw, If, ftl, msg } from "./freemarker";
import { buildBinary } from "./binary.mjs";

export function Glyph({ name }: { name: "globe" | "back" | "eye" | "phone" | "lock" | "mail" | "alert" | "provider" }) {
  const paths: Record<typeof name, ReactNode> = {
    globe: <><circle cx="8" cy="8" r="6.25" /><path d="M1.75 8h12.5M8 1.75c1.8 1.9 2.6 3.9 2.6 6.25S9.8 12.35 8 14.25M8 1.75C6.2 3.65 5.4 5.65 5.4 8s.8 4.35 2.6 6.25" /></>,
    back: <path d="M13 8H3M7 4 3 8l4 4" />,
    eye: <><path d="M1.5 8S3.9 3.5 8 3.5 14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" /><path className="auth-eye-slash" d="M2 2l12 12" /></>,
    phone: <><rect x="4" y="1.75" width="8" height="12.5" rx="1.5" /><path d="M7 11.5h2" /></>,
    lock: <><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></>,
    mail: <><rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" /><path d="m2.5 4.5 5.5 4 5.5-4" /></>,
    alert: <><circle cx="8" cy="8" r="6.25" /><path d="M8 4.75v3.75M8 10.75v.5" /></>,
    provider: <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function BinaryWordmark() {
  return <div className="bin">{buildBinary().map((row, i) => <span className="bin-row" key={i}>{row.segs.map((seg, j) => <span className={seg.cls} key={j}>{seg.text}</span>)}</span>)}</div>;
}

export function Back({ restart = false }: { restart?: boolean }) {
  return <ButtonLink className="auth-back" variant="link" href={ftl(restart ? '${url.loginRestartFlowUrl}' : '${url.loginUrl}')} leadingIcon={<Glyph name="back" />}>{msg("fwBackToSignIn")}</ButtonLink>;
}

export function HeroIcon({ name }: { name: "phone" | "lock" | "mail" }) {
  return <span className="auth-icon" aria-hidden="true"><Glyph name={name} /></span>;
}

export function PasswordToggle() {
  return <Button variant="ghost" iconOnly className="auth-reveal" data-auth-password-toggle="" type="button" aria-controls="password" aria-label={msg("showPassword")} aria-pressed="false" data-label-show={msg("showPassword")} data-label-hide={msg("hidePassword")}><Glyph name="eye" /></Button>;
}

export function Message() {
  return <If test="displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)">
    <Alert id="kc-feedback" icon={<Glyph name="alert" />} className={ftl('fw-alert-${message.type}')} role={ftl("${(message.type == 'error')?then('alert','status')}") as "alert"}>
      <Raw source="${kcSanitize(message.summary)?no_esc}" />
    </Alert>
  </If>;
}

export function FieldError({ fields }: { fields: string }) {
  return <If test={`messagesPerField.existsError(${fields})`}><span className="fw-field-error" id="input-error" aria-live="polite"><Raw source={`\${kcSanitize(messagesPerField.getFirstError(${fields}))?no_esc}`} /></span></If>;
}

export function Submit({ label, id = "kc-login" }: { label: string; id?: string }) {
  return <Button variant="primary" size="lg" block type="submit" name="login" id={id}>{msg(label)}</Button>;
}
