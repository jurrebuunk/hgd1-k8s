<#import "template.ftl" as layout>
<@layout.action
  heading=msg("flatworkVerifyHeading")
  intro=msg("flatworkVerifyIntro", realmName, (user.email)!"")
  button=msg("flatworkVerifyButton")
  link=link
  note=msg("flatworkVerifyNote", linkExpirationFormatter(linkExpiration))/>
