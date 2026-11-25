import { FlatworkRoot, Button } from "@flatwork-ui/react";
import { Glyph, Message } from "./components";
import { Raw, If, ftl, msg } from "./freemarker";

const head = `<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="\${lang}"<#if realm.internationalizationEnabled> dir="\${(locale.rtl)?then('rtl','ltr')}"</#if>>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>\${title!} · buunk</title>
<link rel="icon" href="\${url.resourcesPath}/img/favicon.svg" type="image/svg+xml">
<#list properties.styles?split(' ') as style><link rel="stylesheet" href="\${url.resourcesPath}/\${style}?v=__FW_ASSET_VERSION__"></#list>
<script type="importmap">{"imports":{"rfc4648":"\${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"}}</script>
<#if scripts??><#list scripts as script><script src="\${script}"></script></#list></#if>
<script type="module">
<#outputformat "JavaScript">
import { startSessionPolling } from \${(url.resourcesPath + "/js/authChecker.js")?c};
startSessionPolling(\${url.ssoLoginInOtherTabsUrl?c});
<#if authenticationSession??>
import { checkAuthSession } from \${(url.resourcesPath + "/js/authChecker.js")?c};
checkAuthSession(\${authenticationSession.authSessionIdHash?c});
</#if>
</#outputformat>
</script>
<script src="\${url.resourcesPath}/js/auth.js?v=__FW_ASSET_VERSION__" defer></script>
</head>
<body class="\${properties.kcBodyClass!} \${bodyClass}" data-page-id="login-\${pageId}">`;

export function Layout({ assetVersion }: { assetVersion: string }) {
  return <>
    <Raw source={head.replaceAll('__FW_ASSET_VERSION__', assetVersion)} />
    <FlatworkRoot className="auth" mode={ftl("${properties.fwColorMode!'dark'}") as "dark"}>
      <aside className="auth-art" aria-hidden="true"><Raw source={'<#include "binary.ftl">'} /></aside>
      <div className="auth-pane">
        <label className="auth-lang"><Glyph name="globe" />
          <span className="auth-sr-only">{msg("fwLanguage")}</span>
          <Raw source={`<#if realm.internationalizationEnabled && locale.supported?size gt 1>
<select data-locale-select aria-label="\${msg('fwLanguage')}">
<#list locale.supported as l><option value="\${l.url}" <#if l.label == locale.current>selected</#if>>\${l.languageTag?upper_case}</option></#list>
</select>
<#else><span aria-label="\${msg('fwLanguage')}">\${lang?upper_case}</span></#if>`} />
        </label>
        <main className="auth-main">
          <section className="auth-card" aria-labelledby="kc-page-title">
            <Raw source={'<#nested "back">'} />
            <header className="auth-hero">
              <Raw source={'<#nested "icon">'} />
              <h1 className="auth-title" id="kc-page-title"><Raw source={'<#nested "header">'} /></h1>
              <Raw source={'<#nested "subtitle">'} />
              <If test="displayRequiredFields"><p className="fw-help">* {msg("requiredFields")}</p></If>
            </header>
            <Message />
            <Raw source={'<#nested "form">'} />
            <If test="auth?has_content && auth.showTryAnotherWayLink()">
              <form id="kc-select-try-another-way-form" action={ftl('${url.loginAction}')} method="post">
                <input type="hidden" name="tryAnotherWay" value="on" />
                <Button type="submit" variant="link" id="try-another-way">{msg("doTryAnotherWay")}</Button>
              </form>
            </If>
            <If test="switchOrganizationEnabled?? && switchOrganizationEnabled">
              <form action={ftl('${url.loginAction}')} method="post"><input type="hidden" name="switchOrganization" value="true" /><Button variant="link" type="submit">{msg("doSwitchOrganization")}</Button></form>
            </If>
            <Raw source={'<#nested "socialProviders">'} />
            <If test="displayInfo"><div id="kc-info" className="auth-bottom"><Raw source={'<#nested "info">'} /></div></If>
          </section>
        </main>
      </div>
    </FlatworkRoot>
    <Raw source="</body></html></#macro>" />
  </>;
}
