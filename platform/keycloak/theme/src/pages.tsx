import { ButtonLink, Checkbox, Field, Input, InputGroup, Radio } from "@flatwork-ui/react";
import { Back, FieldError, Glyph, HeroIcon, PasswordToggle, Submit } from "./components";
import { Raw, If, ftl, msg } from "./freemarker";

const credentialsError = "messagesPerField.existsError('username','password')";
const usernameLabel = '<#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("fwUsernameLabel")}<#else>${msg("email")}</#if>';
function Start({ args = "" }: { args?: string }) {
  return <Raw source={`<#import "template.ftl" as layout>\n<@layout.registrationLayout ${args}; section>`} />;
}
function Section({ name, first = false }: { name: string; first?: boolean }) {
  return <Raw source={`<#${first ? "if" : "elseif"} section = "${name}">`} />;
}
function End() { return <Raw source="</#if></@layout.registrationLayout>" />; }
function Subtitle({ message }: { message: string }) { return <p className="auth-sub">{msg(message)}</p>; }

export function SignIn() {
  return <>
    <Raw source={'<#import "passkeys.ftl" as passkeys>'} />
    <Raw source="<#assign resetSent = message?has_content && message.type == 'success' && message.summary == msg('emailSentMessage')>" />
    <Start args="displayMessage=!resetSent displayInfo=!resetSent && realm.password && realm.registrationAllowed && !registrationDisabled??" />
    <Section first name="icon" /><If test="resetSent"><HeroIcon name="mail" /></If>
    <Section name="header" /><Raw source={'<#if resetSent>${msg("fwCheckEmail")}<#else>${msg("fwSignIn")}</#if>'} />
    <Section name="subtitle" /><Raw source={'<#if resetSent>'} /><Subtitle message="fwResetSent" /><Raw source="<#else>" /><Subtitle message="fwSignInSubtitle" /><Raw source="</#if>" />
    <Section name="form" />
    <If test="resetSent"><div className="auth-form"><ButtonLink variant="primary" size="lg" block href={ftl('${url.loginUrl}')}>{msg("fwBackToSignIn")}</ButtonLink><If test="realm.resetPasswordAllowed"><ButtonLink variant="ghost" size="lg" block href={ftl('${url.loginResetCredentialsUrl}')}>{msg("fwDifferentEmail")}</ButtonLink></If></div></If>
    <If test="!resetSent && realm.password">
      <form id="kc-form-login" className="auth-form" action={ftl('${url.loginAction}')} method="post" noValidate data-auth-form="">
        <If test="!usernameHidden??">
          <Field id="username" label={<Raw source={usernameLabel} />}>
            <Input name="username" type="text" autoFocus defaultValue={ftl("${(login.username!'')}")} placeholder={msg("fwUsernamePlaceholder")} autoComplete={ftl("${(enableWebAuthnConditionalUI?has_content)?then('username webauthn','username')}")} autoCapitalize="off" spellCheck={false} dir="ltr" className={ftl(`<#if ${credentialsError}>is-error</#if>`)} aria-invalid={ftl(`\${(${credentialsError})?c}`) as "true"} aria-describedby={ftl(`<#if ${credentialsError}>kc-feedback</#if>`)} />
          </Field>
        </If>
        <Field id="password" label={msg("password")} labelEnd={<If test="realm.resetPasswordAllowed"><a className="auth-forgot" href={ftl('${url.loginResetCredentialsUrl}')}>{msg("fwForgotPassword")}</a></If>}>
          <InputGroup dir="ltr" className={ftl(`<#if ${credentialsError}>is-error</#if>`)}>
            <Input name="password" type="password" autoComplete="current-password" placeholder={msg("fwPasswordPlaceholder")} aria-invalid={ftl(`\${(${credentialsError})?c}`) as "true"} aria-describedby={ftl(`<#if ${credentialsError}>kc-feedback</#if>`)} />
            <PasswordToggle />
          </InputGroup>
        </Field>
        <If test="realm.rememberMe && !usernameHidden??">
          <Raw source="<#if login.rememberMe??>" /><Checkbox name="rememberMe" id="rememberMe" label={msg("fwRememberMe")} defaultChecked />
          <Raw source="<#else>" /><Checkbox name="rememberMe" id="rememberMe" label={msg("fwRememberMe")} /><Raw source="</#if>" />
        </If>
        <input type="hidden" name="credentialId" id="id-hidden-input" value={ftl("${(auth.selectedCredential!'')}")} />
        <Submit label="fwSignIn" />
      </form>
    </If>
    <If test="!resetSent"><Raw source="<@passkeys.conditionalUIData />" /></If>
    <Section name="socialProviders" />
    <If test="!resetSent && social?? && social.providers?has_content">
      <div className="auth-or">{msg("fwOr")}</div>
      <div id="kc-social-providers" className="auth-idp">
        <Raw source="<#list social.providers as p>" />
        <ButtonLink size="lg" variant="secondary" href={ftl('${p.loginUrl}')} id={ftl('social-${p.alias}')} data-once-link="" leadingIcon={<Glyph name="provider" />}>{ftl('${p.displayName!}')}</ButtonLink>
        <Raw source="</#list>" />
      </div>
    </If>
    <Section name="info" /><p id="kc-registration">{msg("fwNewTo")} <a href={ftl('${url.registrationUrl}')}>{msg("fwCreateAccount")}</a></p>
    <End />
  </>;
}

export function Otp() {
  return <>
    <Start args="displayMessage=!messagesPerField.existsError('totp')" />
    <Section first name="back" /><Back restart />
    <Section name="icon" /><HeroIcon name="phone" />
    <Section name="header" />{msg("fwOtpTitle")}
    <Section name="subtitle" /><Subtitle message="fwOtpSubtitle" />
    <Section name="form" />
    <form id="kc-otp-login-form" className="auth-form" action={ftl('${url.loginAction}')} method="post" data-auth-form="">
      <If test="otpLogin.userOtpCredentials?size gt 1">
        <fieldset className="auth-credentials"><legend className="fw-label">{msg("fwAuthenticator")}</legend>
          <Raw source="<#list otpLogin.userOtpCredentials as otpCredential>" />
          <Raw source="<#if otpCredential.id == otpLogin.selectedCredentialId>" />
          <Radio name="selectedCredentialId" value={ftl('${otpCredential.id}')} label={ftl('${otpCredential.userLabel}')} defaultChecked />
          <Raw source="<#else>" /><Radio name="selectedCredentialId" value={ftl('${otpCredential.id}')} label={ftl('${otpCredential.userLabel}')} /><Raw source="</#if></#list>" />
        </fieldset>
      </If>
      <div className="auth-otp-field">
        <label className="fw-label" id="otp-label" htmlFor="otp">{msg("loginOtpOneTime")}</label>
        <Input id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus dir="ltr" data-otp-input="" data-digit-label={msg("fwDigit")} aria-describedby="otp-help input-error" aria-invalid={ftl("${(messagesPerField.existsError('totp'))?c}") as "true"} />
        <span className="fw-help" id="otp-help">{msg("fwOtpHelp")}</span>
        <FieldError fields="'totp'" />
      </div>
      <Submit label="fwVerify" />
    </form>
    <End />
  </>;
}

export function ResetPassword() {
  return <>
    <Start args="displayMessage=!messagesPerField.existsError('username')" />
    <Section first name="back" /><Back />
    <Section name="icon" /><HeroIcon name="lock" />
    <Section name="header" />{msg("fwResetTitle")}
    <Section name="subtitle" /><Subtitle message="fwResetSubtitle" />
    <Section name="form" />
    <form id="kc-reset-password-form" className="auth-form" action={ftl('${url.loginAction}')} method="post" data-auth-form="">
      <Field id="username" label={<Raw source={usernameLabel} />}>
        <Input name="username" autoFocus autoComplete="username" autoCapitalize="off" spellCheck={false} defaultValue={ftl("${(auth.attemptedUsername!'')}")} placeholder={msg("fwUsernamePlaceholder")} dir="ltr" aria-invalid={ftl("${(messagesPerField.existsError('username'))?c}") as "true"} aria-describedby={ftl("<#if messagesPerField.existsError('username')>input-error</#if>")} />
      </Field>
      <FieldError fields="'username'" />
      <Submit label="fwSendResetLink" />
    </form>
    <End />
  </>;
}

// This is Keycloak's real result page, never a client-side fake-success state.
export function Info() {
  return <>
    <Raw source="<#assign resetSent = message?has_content && message.type == 'success' && message.summary == msg('emailSentMessage')>" />
    <Start args="displayMessage=false" />
    <Section first name="icon" /><If test="resetSent"><HeroIcon name="mail" /></If>
    <Section name="header" />
    <Raw source={'<#if resetSent>${msg("fwCheckEmail")}<#elseif messageHeader??>${kcSanitize(msg(messageHeader))?no_esc}<#else>${message.summary}</#if>'} />
    <Section name="form" />
    <div id="kc-info-message" className="auth-form">
      <p className="auth-sub"><Raw source={'<#if resetSent>${msg("fwResetSent")}<#else>${kcSanitize(message.summary)?no_esc}<#if requiredActions??><#list requiredActions as action>: ${kcSanitize(msg("requiredAction." + action))?no_esc}<#sep>, </#list></#if></#if>'} /></p>
      <Raw source="<#if !skipLink??><#if pageRedirectUri?has_content>" />
      <ButtonLink variant="primary" size="lg" block href={ftl('${pageRedirectUri}')}>{msg("backToApplication")}</ButtonLink>
      <Raw source="<#elseif actionUri?has_content>" /><ButtonLink variant="primary" size="lg" block href={ftl('${actionUri}')}>{msg("proceedWithAction")}</ButtonLink>
      <Raw source="<#elseif (client.baseUrl)?has_content>" /><ButtonLink variant="primary" size="lg" block href={ftl('${client.baseUrl}')}>{msg("backToApplication")}</ButtonLink>
      <Raw source="</#if></#if>" />
      <If test="resetSent"><ButtonLink variant="ghost" size="lg" block href={ftl('${url.loginUrl}')}>{msg("fwBackToSignIn")}</ButtonLink></If>
    </div>
    <End />
  </>;
}
