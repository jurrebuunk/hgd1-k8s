<#-- Email layout: a white card on light grey, inline styles and tables only,
     since mail clients drop external CSS and most of <style>. Colours are the
     flatwork light tokens (bg #f6f5f5, surface #ffffff, border #e4e0e0,
     text #3a3535, muted #625c5c, accent #4b6670). -->
<#assign font = "Geist, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
<#assign mono = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace">

<#macro emailLayout preview="">
<!doctype html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>p{margin:0 0 16px}p:last-child{margin-bottom:0}a{color:#4b6670}</style>
</head>
<body style="margin:0; padding:0; background:#f6f5f5;">
<#if preview?has_content><div style="display:none; max-height:0; overflow:hidden;">${preview}</div></#if>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f5f5;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background:#ffffff; border:1px solid #e4e0e0; border-radius:8px;">
<tr><td style="padding:40px; font-family:${font}; font-size:15px; line-height:24px; color:#3a3535;">
<#nested>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
</#macro>

<#-- One action: heading, text, button, expiry note, and the link as text for
     clients that block the button. -->
<#macro action heading intro button link note>
<@emailLayout preview=intro>
<h1 style="margin:0 0 20px; font-family:${font}; font-size:24px; line-height:32px; font-weight:600; letter-spacing:-0.3px; color:#1b1818;">${heading}</h1>
<p style="margin:0 0 20px;">${intro}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr>
<td style="background:#4b6670; border-radius:6px;"><a href="${link}" style="display:inline-block; padding:12px 22px; font-family:${font}; font-size:15px; line-height:20px; font-weight:500; color:#ffffff; text-decoration:none; border-radius:6px;">${button}</a></td>
</tr></table>
<p style="margin:0 0 20px; font-size:13px; line-height:20px; color:#625c5c;">${note}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-top:1px solid #e4e0e0; padding-top:18px; font-family:${font}; font-size:12px; line-height:18px; color:#625c5c;">
${msg("flatworkLinkFallback")}<br>
<#-- Action tokens are long: small and grey, so the button stays the focus. -->
<a href="${link}" style="font-family:${mono}; font-size:11px; line-height:16px; color:#625c5c; text-decoration:none; word-break:break-all;">${link}</a>
</td></tr></table>
</@emailLayout>
</#macro>
