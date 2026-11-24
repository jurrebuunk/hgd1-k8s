<#-- flatwork page layout: top bar, one centred card, footer. Keeps base's
     scripts (session checks, locale menu) and its sections (header, form,
     socialProviders, info). -->
<#import "footer.ftl" as loginFooter>
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<#assign brand = properties.fwBrand!(realm.displayName!realm.name)>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${lang}"<#if realm.internationalizationEnabled> dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>
<head>
    <meta charset="utf-8">
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${title!}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.svg" type="image/svg+xml"/>
    <#list properties.styles?split(' ') as style>
        <link href="${url.resourcesPath}/${style}" rel="stylesheet"/>
    </#list>
    <script type="importmap">
        { "imports": { "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js" } }
    </script>
    <script src="${url.resourcesPath}/js/menu-button-links.js" type="module"></script>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module">
        <#outputformat "JavaScript">
        import { startSessionPolling } from ${(url.resourcesPath + "/js/authChecker.js")?c};
        startSessionPolling(${url.ssoLoginInOtherTabsUrl?c});
        </#outputformat>
    </script>
    <#if authenticationSession??>
        <script type="module">
            <#outputformat "JavaScript">
            import { checkAuthSession } from ${(url.resourcesPath + "/js/authChecker.js")?c};
            checkAuthSession(${authenticationSession.authSessionIdHash?c});
            </#outputformat>
        </script>
    </#if>
</head>
<body class="${properties.kcBodyClass!} ${bodyClass}" data-page-id="login-${pageId}">
<div class="${properties.kcLoginClass!}">
    <header class="fw-topbar">
        <div class="fw-brand">
            <span class="fw-logo" aria-hidden="true">${brand?substring(0, 1)?upper_case}</span>
            <span class="fw-brand-name">${brand}</span>
        </div>
        <div class="fw-topbar-end">
            <#if properties.fwHostname?has_content><span class="fw-mono fw-muted">${properties.fwHostname}</span></#if>
            <#if realm.internationalizationEnabled && locale.supported?size gt 1>
                <div class="${properties.kcLocaleMainClass!}" id="kc-locale">
                    <div id="kc-locale-dropdown" class="menu-button-links ${properties.kcLocaleDropDownClass!}">
                        <button id="kc-current-locale-link" class="fw-locale-button" aria-label="${msg("languages")}" aria-haspopup="true" aria-expanded="false" aria-controls="language-switch1">
                            <i class="fw-icon fw-icon-globe" aria-hidden="true"></i>${locale.current}
                        </button>
                        <ul role="menu" tabindex="-1" aria-labelledby="kc-current-locale-link" id="language-switch1" class="${properties.kcLocaleListClass!}">
                            <#assign i = 1>
                            <#list locale.supported as l>
                                <li class="${properties.kcLocaleListItemClass!}" role="none">
                                    <a role="menuitem" id="language-${i}" class="${properties.kcLocaleItemClass!}" href="${l.url}">${l.label}</a>
                                </li>
                                <#assign i++>
                            </#list>
                        </ul>
                    </div>
                </div>
            </#if>
        </div>
    </header>

    <main class="fw-main">
        <div class="${properties.kcFormCardClass!}">
            <header class="${properties.kcFormHeaderClass!}">
                <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                    <h1 id="kc-page-title" class="fw-title"><#nested "header"></h1>
                    <#nested "subtitle">
                <#else>
                    <#nested "show-username">
                    <h1 id="kc-page-title" class="fw-title"><#nested "header"></h1>
                    <div id="kc-username" class="fw-attempted">
                        <span id="kc-attempted-username" class="fw-mono">${auth.attemptedUsername}</span>
                        <a id="reset-login" class="fw-link" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">${msg("restartLoginTooltip")}</a>
                    </div>
                </#if>
                <#if displayRequiredFields>
                    <p class="fw-caption fw-muted"><span class="fw-required">*</span> ${msg("requiredFields")}</p>
                </#if>
            </header>

            <#-- App-initiated actions don't see warnings about the action they are doing. -->
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="${properties.kcAlertClass!} fw-alert-${message.type}" role="alert">
                    <i class="fw-icon <#if message.type = 'success'>fw-icon-check<#elseif message.type = 'info'>fw-icon-info<#else>fw-icon-alert</#if>" aria-hidden="true"></i>
                    <span class="${properties.kcAlertTitleClass!}">${kcSanitize(message.summary)?no_esc}</span>
                </div>
            </#if>

            <#nested "form">

            <#if auth?has_content && auth.showTryAnotherWayLink()>
                <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post" class="fw-secondary-action">
                    <input type="hidden" name="tryAnotherWay" value="on"/>
                    <a href="#" id="try-another-way" class="fw-link"
                       onclick="document.forms['kc-select-try-another-way-form'].requestSubmit();return false;">${msg("doTryAnotherWay")}</a>
                </form>
            </#if>

            <#if switchOrganizationEnabled?? && switchOrganizationEnabled>
                <form id="kc-switch-organization-form" action="${url.loginAction}" method="post" class="fw-secondary-action">
                    <input type="hidden" name="switchOrganization" value="true"/>
                    <a href="#" id="switch-organization" class="fw-link"
                       onclick="document.forms['kc-switch-organization-form'].requestSubmit();return false;">${msg("doSwitchOrganization")}</a>
                </form>
            </#if>

            <#nested "socialProviders">
        </div>

        <#if displayInfo>
            <div id="kc-info" class="${properties.kcSignUpClass!}">
                <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                    <#nested "info">
                </div>
            </div>
        </#if>
        <@loginFooter.content/>
    </main>

    <footer class="fw-footer">
        <span class="fw-mono fw-muted">realm: ${realm.name} · keycloak</span>
        <#if properties.fwFooterLinks?has_content>
            <nav class="fw-footer-links">
                <#list properties.fwFooterLinks?split(' ') as link>
                    <a href="${link?split('==')[1]}">${link?split('==')[0]}</a>
                </#list>
            </nav>
        </#if>
    </footer>
</div>
</body>
</html>
</#macro>
