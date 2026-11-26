<#outputformat "plainText">
<#assign requiredActionsText><#if requiredActions??><#list requiredActions><#items as reqActionItem>${msg("requiredAction.${reqActionItem}")}<#sep>, </#sep></#items></#list></#if></#assign>
</#outputformat>
<#import "template.ftl" as layout>
<@layout.action
  heading=msg("flatworkActionsHeading")
  intro=msg("flatworkActionsIntro", realmName, requiredActionsText)
  button=msg("flatworkActionsButton")
  link=link
  note=msg("flatworkActionsNote", linkExpirationFormatter(linkExpiration))/>
