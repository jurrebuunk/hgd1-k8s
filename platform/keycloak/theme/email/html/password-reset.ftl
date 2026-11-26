<#import "template.ftl" as layout>
<@layout.action
  heading=msg("flatworkResetHeading")
  intro=msg("flatworkResetIntro", realmName, (user.email)!"")
  button=msg("flatworkResetButton")
  link=link
  note=msg("flatworkResetNote", linkExpirationFormatter(linkExpiration))/>
