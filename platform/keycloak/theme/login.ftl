<#-- flatwork sign-in form (username + password), after the flatwork-saas
     design: "Forgot password?" beside the Password label, the reveal button
     inside the field, social logins below a divider, sign-up under the card. -->
<#import "template.ftl" as layout>
<#import "passkeys.ftl" as passkeys>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("fwSignInTitle", properties.fwBrand!(realm.displayName!realm.name))}
    <#elseif section = "subtitle">
        <p class="fw-subtitle">${msg("fwSignInSubtitle", properties.fwBrand!(realm.displayName!realm.name))}</p>
    <#elseif section = "form">
        <#if realm.password>
            <form id="kc-form-login" class="fw-form" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" novalidate>
                <#if !usernameHidden??>
                    <div class="fw-group">
                        <label for="username" class="fw-label"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></label>
                        <input tabindex="2" id="username" class="fw-input" name="username" value="${(login.username!'')}" type="text"
                               placeholder="${msg("fwUsernamePlaceholder")}"
                               autofocus autocomplete="${(enableWebAuthnConditionalUI?has_content)?then('username webauthn', 'username')}"
                               aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" dir="ltr"/>
                        <#if messagesPerField.existsError('username','password')>
                            <span id="input-error" class="fw-field-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
                        </#if>
                    </div>
                </#if>

                <div class="fw-group">
                    <div class="fw-label-row">
                        <label for="password" class="fw-label">${msg("password")}</label>
                        <#if realm.resetPasswordAllowed>
                            <a tabindex="6" class="fw-link fw-label-link" href="${url.loginResetCredentialsUrl}">${msg("fwForgotPassword")}</a>
                        </#if>
                    </div>
                    <div class="fw-input-group" dir="ltr">
                        <input tabindex="3" id="password" class="fw-input" name="password" type="password" autocomplete="current-password"
                               aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"/>
                        <button class="fw-reveal" type="button" aria-label="${msg("showPassword")}" aria-controls="password" data-password-toggle tabindex="4"
                                data-icon-show="fw-icon fw-icon-eye" data-icon-hide="fw-icon fw-icon-eye-off"
                                data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}">
                            <i class="fw-icon fw-icon-eye" aria-hidden="true"></i>
                        </button>
                    </div>
                    <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                        <span id="input-error" class="fw-field-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
                    </#if>
                </div>

                <#if realm.rememberMe && !usernameHidden??>
                    <label class="fw-check">
                        <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox" class="fw-checkbox"<#if login.rememberMe??> checked</#if>>
                        <span>${msg("fwRememberMe")}</span>
                    </label>
                </#if>

                <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                <button tabindex="7" class="fw-btn fw-btn-primary fw-btn-block" name="login" id="kc-login" type="submit">${msg("fwSignIn")}</button>
            </form>
        </#if>
        <@passkeys.conditionalUIData />
        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    <#elseif section = "socialProviders">
        <#if realm.password && social?? && social.providers?has_content>
            <div id="kc-social-providers" class="fw-social">
                <div class="fw-divider"><span>${msg("fwOrContinueWith")}</span></div>
                <ul class="fw-social-list">
                    <#list social.providers as p>
                        <li>
                            <a data-once-link data-disabled-class="fw-disabled" id="social-${p.alias}" class="fw-btn fw-btn-secondary" href="${p.loginUrl}">
                                <i class="fw-icon fw-idp fw-idp-${p.providerId!p.alias}" aria-hidden="true"></i>
                                <span>${p.displayName!}</span>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <p id="kc-registration">${msg("fwNewTo", properties.fwBrand!(realm.displayName!realm.name))} <a tabindex="8" class="fw-link" href="${url.registrationUrl}">${msg("fwCreateAccount")}</a></p>
        </#if>
    </#if>
</@layout.registrationLayout>
