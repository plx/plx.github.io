# Browser tests

Playwright builds the site and owns a static server by default. `BASE_URL`
instead targets an existing server and skips that build; `PLAYWRIGHT_PORT`
sets the local port (default 4321; choose an unused port). See
[the config](../playwright.config.ts).

`npm run qa:ci` runs Chromium with screenshot assertions disabled. A passing
run does not establish visual parity. Use the `dispatches-qa` skill for browser
and accessibility investigations.
