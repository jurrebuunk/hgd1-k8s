<#import "template.ftl" as layout>
<@layout.action
  heading=msg("flatworkEmailUpdateHeading")
  intro=msg("flatworkEmailUpdateIntro", newEmail, realmName)
  button=msg("flatworkEmailUpdateButton")
  link=link
  note=msg("flatworkEmailUpdateNote", linkExpirationFormatter(linkExpiration))/>
