# R5 — Weather, stadiums, geospatial and travel

Research track R5 of the NFL Data & API Universe. Researched 2026-11-25 (all "read"/"probed" dates are 2026-11-25 unless stated). Read-only with respect to the repository. Classification: 🟢 Official · 🟡 Licensed/commercial · 🔵 Public/open data · 🟠 Unofficial but commonly used · 🔴 Scraping · ⚫ Experimental/unstable. Scores 1–10 (Cost 10 = free, Lic 10 = permissive, RL 10 = generous); "~" marks a judgment component. Cost and RL are read from stated prices and limits; everything else is judgment.

**Method note.** The shared web-search budget for this turn (200 searches across all agents) ran out part-way. After that, facts were checked only by opening primary pages directly (WebFetch/curl), by `gh api`, and by low-volume probes of key-free endpoints. Three helper agents covered commercial weather APIs, geo/maps terms and the effect-size literature; their findings are folded in and labelled as such where they are the only evidence ("[helper]"). Anything not re-read is marked UNVERIFIED.

## 1. Summary

- **Open-Meteo stays PRIMARY** for forecasts at outdoor venues and for weather history, but its free tier is non-commercial. A commercial product needs a paid plan, and the historical APIs need Professional (US$99 a month in Open-Meteo's June 2023 post; the current pricing page does not show prices).
- **Backtests need archived forecasts, not reanalysis.** The Historical Forecast API joins the first few hours of each model run, so it is close to observed weather. Forecasts at fixed lead times come from the Previous Runs API: since January 2024 for most models, since March 2021 for GFS temperature. Before 2024, use observed weather (nfldata, or IEM ASOS reports), label it as observed, and never present it as something known before kickoff.
- **The project's snowfall figure is 2.54 times too small.** With `precipitation_unit=inch`, Open-Meteo already returns snowfall in inches (probed), and `lib/fabric/adapters/public.js` divides by 2.54 again.
- **nfldata has gaps and errors:**
  - temperature and wind are missing for many outdoor games: 2022 has 107 of 198, 2023 has 158 of 199, and 2026 so far has 44 of 114;
  - the 2025 international games carry the designated home team's own stadium name;
  - the 2026 roof labels for the Melbourne Cricket Ground, Stade de France and Allianz Arena say "dome";
  - the time-zone offsets in `airports.csv` ignore daylight saving time (Arizona is wrong in September and October).
- **`shared/teams.json` is out of date for two things:**
  - Buffalo's coordinates are the old stadium's; the new Highmark Stadium is about 430 m west (Wikidata Q16251517);
  - the neutral-site list has none of the five new 2026 international venues.
- **Field direction** comes from OpenStreetMap pitch outlines (ODbL). The new Highmark field runs about 348°/168°.
- **Station observations:** the NWS API keeps only 7 days. IEM's ASOS archive (public domain) is the best free source of past observations.
- **Avoid** tracking team flights, and avoid the storage-restricted weather APIs (WeatherKit, Google, AccuWeather, Tomorrow.io).

## 2. Catalog

### A. Weather — forecasts, history, archived forecasts

### Open-Meteo — Weather Forecast API (in use: `open-meteo`)
- Links: https://open-meteo.com · https://open-meteo.com/en/docs · https://open-meteo.com/en/terms , https://open-meteo.com/en/licence , https://open-meteo.com/en/pricing · https://github.com/open-meteo/open-meteo (server AGPLv3)
- Category · Class: weather forecast · 🔵 Public/open data (CC BY 4.0 data; free tier non-commercial)
- Provides: hourly/daily temperature, wind speed/direction/gusts, precipitation and probability, snowfall, etc.; `timezone=auto` returns the IANA zone; multi-location in one call (comma-separated coordinates, JSON becomes a list — docs read).
- History · Live · Latency: `past_days` up to 92 · yes · hourly series; model runs update every 1–6 h per model (historical-forecast docs table).
- Coverage: global; neutral sites abroad work (probed London, Mexico City).
- Technical: REST · JSON/CSV/XLSX · SDK: none needed · Auth: none (free) / key on `customer-api.open-meteo.com` (paid) · Rate limits (free): <600/min, 5,000/h, 10,000/day, 300,000/month, per IP and per application; "shared hosting" may hit limits sooner (terms) · Pagination/Webhooks: none.
- Cost: free: non-commercial only · free tier: limits above · paid: Standard 1M calls/month, Professional 5M, Enterprise 50M+ (pricing page; prices rendered by a Stripe widget, not readable); Open-Meteo's own post of 2023-06-12 lists Standard US$29/month and Professional US$99/month · est. monthly for a small app: $0 non-commercial; ~$29 commercial forecast-only. A request over 10 variables or 2 weeks of data counts as more than one call (pricing FAQ). Whether a multi-location request counts as one call per location: UNVERIFIED.
- Licensing: commercial: only with a subscription ("You may only use the free API services for non-commercial purposes", terms) · redistribution: CC BY 4.0 allows sharing and adapting · caching/storage: not restricted by the terms · attribution: a link next to the data, e.g. "Weather data by Open-Meteo.com", and say whether the data was changed (licence page) · other restrictions: the underlying model data carries the providers' own licences (UK Met Office CC BY-SA 4.0; NOAA, Météo-France, ECCC and JMA under their own terms); free-tier IPs can be blocked for misuse without notice.
- Quality: grid model output (no station correction); grid cell can be "a few kilometres away"; probe for Highmark returned a cell at 42.765, -78.800 and 222 m.
- Scores: Q ~8 / Cov ~10 / Rel ~7 / Lat ~9 / Hist ~3 / Doc ~9 / DX ~10 / Cost 9 / Lic ~8 / Com ~6 / RL 9 / NFL ~8 = **8.0**
- Recommendation: PRIMARY (forecast at outdoor venues) — free, global, no key; a paid plan before any commercial launch.
- Verified: 2026-11-25 — forecast probe HTTP 200; `hourly_units.snowfall` = "inch" when `precipitation_unit=inch` (finding: the fabric divides by 2.54 a second time); terms, licence, pricing and docs read; one multi-location call (34 venues, `timezone=auto`) returned 34 results with IANA zones and elevations.

### Open-Meteo — Historical Forecast API
- Links: https://open-meteo.com/en/docs/historical-forecast-api · endpoint `https://historical-forecast-api.open-meteo.com/v1/forecast` · terms as above
- Category · Class: archived model output (stitched) · 🔵 Public/open data
- Provides: the same variables as the Forecast API for past dates. Page: a "continuous hourly timeseries" stitched from "the first few hours" of each run, so each hour is a 0–~6 h-ahead forecast.
- History · Live · Latency: per model: HRRR 2018-01-01; ECMWF IFS HRES 9 km 2017-01-01; GFS 2021-03-23; ICON 2022-11-24; NBM 2024-10-08; JMA 2016-01-01; NAM 2025-09-01 ("no updates since 2026-11-01") · n/a · new runs appended as they arrive.
- Coverage: global (model-dependent); the default `best_match` returned nulls for 2016-01-03 at Buffalo and values for 2021-01-03 (probed), so the depth of the default blend is shorter than the per-model table.
- Technical: REST · JSON/CSV · Auth: none (free) · limits as the Forecast API · Pagination: none.
- Cost: free non-commercial; historical APIs require Professional per the pricing FAQ and the 2023 post (the pricing table also ticks "Free" — inconsistent on the page) · est.: $0 / ~$99 commercial.
- Licensing: as Open-Meteo (CC BY 4.0, link next to data; non-commercial free tier).
- Quality: tracks observed weather closely (each run starts from measurements); the page warns it is "Not suitable for long time series" because models change. Buffalo 2025 kickoffs: within about 1–3 °F of the KBUF report; wind sometimes much lower (e.g. 1.2 mph against 13.8 mph reported, 2025-12-28).
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~7 / Hist ~5 / Doc ~8 / DX ~10 / Cost 9 / Lic ~8 / Com ~5 / RL 8 / NFL ~7 = **7.6**
- Recommendation: SECONDARY — fills observed-like game conditions for 2017+/2021+ where nfldata is blank; **not** a source of "forecast known before kickoff" beyond a few hours.
- Verified: 2026-11-25 — docs read; probes for 2016, 2021 and a 2025 season range (HTTP 200).

### Open-Meteo — Previous Runs API
- Links: https://open-meteo.com/en/docs/previous-runs-api · endpoint `https://previous-runs-api.open-meteo.com/v1/forecast`
- Category · Class: archived forecasts at fixed lead times · 🔵 Public/open data
- Provides: `<variable>_previous_dayN`, N = 1–7: the value forecast 24·N hours before the valid time (page); `_previous_day0` = current run.
- History · Live · Latency: most models from January 2024; GFS 2 m temperature from March 2021; JMA GSM/MSM from 2018; earlier "may be reconstructed on request" · yes · per model run cadence.
- Coverage: global; regional models only out to their horizon.
- Technical: REST · JSON/CSV/XLSX · Auth: none · limits as above.
- Cost: as the historical APIs (Professional for commercial).
- Licensing: as Open-Meteo.
- Quality: probe for Buffalo 2025-12-14 00 UTC: observed-like run -5.1 °C, day-1 forecast -8.6 °C, day-3 -9.1 °C — the lead-time error is material, which is the point of using it.
- Scores: Q ~8 / Cov ~10 / Rel ~7 / Lat ~7 / Hist ~3 / Doc ~7 / DX ~9 / Cost 9 / Lic ~8 / Com ~5 / RL 8 / NFL ~8 = **7.4**
- Recommendation: PRIMARY for leakage-free weather features in backtests from the 2024 season on (freeze, e.g., the day-1 value for each kickoff).
- Verified: 2026-11-25 — docs read; probe HTTP 200 with `_previous_day1/2/3` columns.

### Open-Meteo — Single Runs API
- Links: https://open-meteo.com/en/docs/single-runs-api · endpoint `https://single-runs-api.open-meteo.com/v1/forecast?...&run=YYYY-MM-DDTHH:MM`
- Category · Class: full archived model runs · 🔵 Public/open data
- Provides: the complete output of one run chosen by its UTC start time.
- History · Live · Latency: ECMWF IFS HRES 9 km from "March 14, 2024"; most other models from "2nd of April 2026"; publication delay 4–6 h global, 1–3 h regional · n/a.
- Coverage: global.
- Technical: REST · JSON · Auth: none (free) · served from archive storage, slower.
- Cost: as historical APIs; page lists Non-Commercial, Commercial and Self-Hosted licences without prices.
- Licensing: as Open-Meteo.
- Quality: exact "what the model said at time t" — the cleanest leakage control (use runs whose publish time precedes the decision time).
- Scores: Q ~8 / Cov ~10 / Rel ~6 / Lat ~6 / Hist ~2 / Doc ~7 / DX ~8 / Cost 8 / Lic ~8 / Com ~5 / RL 8 / NFL ~6 = **6.8**
- Recommendation: OPTIONAL — Previous Runs covers the same need more simply.
- Verified: 2026-11-25 — docs read; not probed.

### Open-Meteo — Historical Weather API (ERA5 / ERA5-Land / IFS)
- Links: https://open-meteo.com/en/docs/historical-weather-api · endpoint `https://archive-api.open-meteo.com/v1/archive`
- Category · Class: reanalysis · 🔵 Public/open data (Copernicus data underneath)
- Provides: hourly reanalysis variables.
- History · Live · Latency: ERA5 0.25° from 1940; ERA5-Land 0.1° from 1950; ECMWF IFS 9 km from 2017; ERA5 "Daily with 5 days delay" · no.
- Coverage: global; ERA5-Land lacks wind in most cases (page).
- Technical: REST · JSON/CSV · Auth: none (free) · limits as above.
- Cost: free non-commercial; Professional for commercial (FAQ/2023 post).
- Licensing: CC BY 4.0 plus the Copernicus licence for reanalysis (licence page).
- Quality: consistent over decades; coarse (25 km) — local wind is smoothed. Buffalo 2025 kickoffs: ERA5 temperature within ~1–3 °F of nfldata; ERA5 wind closer to the airport report than the historical-forecast blend in 2 of 3 windy games.
- Scores: Q ~7 / Cov ~10 / Rel ~8 / Lat ~3 / Hist ~10 / Doc ~9 / DX ~10 / Cost 9 / Lic ~8 / Com ~5 / RL 8 / NFL ~7 = **7.8**
- Recommendation: SECONDARY — fills long-history weather for 1999+ backtests where nfldata is blank (labelled "reanalysis", not observation, not forecast).
- Verified: 2026-11-25 — docs read; probe for 1960-01-03 (HTTP 200, values) and the 2025 Buffalo season.

### Open-Meteo — Elevation API
- Links: https://open-meteo.com/en/docs/elevation-api · endpoint `https://api.open-meteo.com/v1/elevation`
- Category · Class: elevation · 🔵 Public/open data (Copernicus DEM)
- Provides: elevation for up to many points per call.
- History · Live · Latency: static.
- Coverage: global, 90 m grid. It is a surface model: values near rivers/roofs are approximate (EverBank 0 m, Lincoln Financial 0 m, Superdome 23 m returned).
- Technical: REST · JSON · Auth: none.
- Cost: free non-commercial (Elevation is a "core" API, included in Standard).
- Licensing: CC BY 4.0 + Copernicus DEM licence.
- Quality: Empower Field 1,588 m (5,210 ft); a helper's USGS EPQS call gave 5,195 ft — consistent within ~5 m.
- Scores: Q ~6 / Cov ~10 / Rel ~8 / Lat ~8 / Hist ~5 / Doc ~7 / DX ~10 / Cost 10 / Lic ~8 / Com ~6 / RL 9 / NFL ~5 = **7.7**
- Recommendation: SECONDARY (one-time altitude per venue; USGS EPQS for US venues is better).
- Verified: 2026-11-25 — probe HTTP 200 (Denver 1588 m, Buffalo 222 m).

### National Weather Service — api.weather.gov hourly gridpoint forecast
- Links: https://www.weather.gov/documentation/services-web-api · `/points/{lat},{lon}` → `forecastHourly`, `forecastGridData` · terms: same page (open data) · GitHub: https://github.com/weather-gov/api (issues)
- Category · Class: weather forecast (US) · 🟢 Official
- Provides: 156 hourly periods (probed) with temperature, wind speed (text, e.g. "6 mph"), direction (compass), precipitation probability; raw grids via `forecastGridData`; `/points` also returns `timeZone` and nearest radar.
- History · Live · Latency: forecast only · yes · Buffalo forecast `updateTime` 20:57 UTC, generated 22:34 UTC (probed).
- Coverage: US only (points abroad answer 400 — registry).
- Technical: REST · GeoJSON/JSON-LD/DWML · Auth: User-Agent (an API key "will replace this requirement in the future") · Rate limits: not public; retry "typically within 5 seconds" · gridX/gridY can change, recheck `/points`.
- Cost: free · free tier: n/a · paid: none · est.: $0.
- Licensing: open data, any purpose; US government work · attribution: credit NWS (registry practice) · no endorsement implied.
- Quality: human-edited NDFD forecast (better local wind than raw models in many cases — judgment); text-encoded wind needs parsing.
- Scores: Q ~8 / Cov ~4 / Rel ~6 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~7 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~7 = **7.2**
- Recommendation: SECONDARY (US cross-check of Open-Meteo; commercial-safe primary for US venues in a commercial product).
- Verified: 2026-11-25 — docs read; `/points/42.7738,-78.787` (grid BUF 39,42, zone America/New_York, radar KBUF) and hourly forecast HTTP 200.

### National Weather Service — api.weather.gov station observations
- Links: https://www.weather.gov/documentation/services-web-api · `/stations/{ICAO}/observations[/latest]`, `/gridpoints/{wfo}/{x},{y}/stations`
- Category · Class: observations (US) · 🟢 Official
- Provides: METAR-derived observations in SI units with quality flags (`qualityControl` V/Z).
- History · Live · Latency: **7 days only** (docs: "Only 7 days"; probe: 3 days ago 11 reports, 10 and 15 days ago 0) · yes · MADIS can delay up to 20 min.
- Coverage: US stations; nearest list for the Buffalo grid: KBUF, KIAG, KDKK, KOLE, KJHW.
- Technical: REST · GeoJSON · Auth: User-Agent · limits as above.
- Cost: free.
- Licensing: open data, any purpose.
- Quality: gusts often null (`Z`); airport ≠ stadium.
- Scores: Q ~8 / Cov ~5 / Rel ~6 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~7 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~6 = **7.2**
- Recommendation: SECONDARY (live "observed now near the stadium"); not an archive.
- Verified: 2026-11-25 — latest KBUF observation and range probes.

### National Weather Service — api.weather.gov active alerts (in use: `nws-alerts`)
- Links: https://www.weather.gov/documentation/services-web-api · `/alerts/active?point=lat,lon`
- Category · Class: weather alerts (US) · 🟢 Official
- Provides: CAP alerts; `/alerts` covers 7 days, full archive at NCEI (docs).
- History · Live · Latency: 7 days · yes · minutes.
- Coverage: US only.
- Technical: REST · GeoJSON · Auth: User-Agent.
- Cost: free. Licensing: open data, any purpose.
- Quality: authoritative.
- Scores: Q ~9 / Cov ~4 / Rel ~7 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~8 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~6 = **7.4**
- Recommendation: PRIMARY (alerts) — no backup abroad.
- Verified: 2026-11-25 — docs read (registry already verified the endpoint on Nov. 23).

### NOAA NCEI — Access Data Service, `global-hourly` (ISD)
- Links: https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation · https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database · endpoint `https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-hourly&stations=<USAF+WBAN>&startDate=..&endDate=..&format=csv`
- Category · Class: observed hourly history · 🟢 Official
- Provides: ISD hourly/synoptic reports (wind, gust, temperature, dew point, pressure, present weather, precipitation, snow depth), many coded columns.
- History · Live · Latency: 1901 to present; >35,000 stations (>14,000 active) · no · "updated daily"; NCEI's cloud move may delay updates (page).
- Coverage: global (incl. London, Mexico City, Munich, etc.).
- Technical: REST · CSV/SSV/JSON/NetCDF/PDF · Auth: none (probe worked without a token) · Rate limits: none stated · station id is USAF+WBAN (KBUF = 72528014733).
- Cost: free.
- Licensing: no licence text on the pages read; US government work (inference: public domain under 17 U.S.C. §105 for NOAA-authored data; some foreign-source records may carry WMO Resolution 40 restrictions — UNVERIFIED).
- Quality: raw coded fields need decoding; the ADS docs page does not list `global-hourly`, but it works.
- Scores: Q ~8 / Cov ~9 / Rel ~6 / Lat ~3 / Hist ~10 / Doc ~6 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL ~6 / NFL ~7 = **7.6**
- Recommendation: SECONDARY (international venues' history; authoritative archive behind IEM).
- Verified: 2026-11-25 — probe HTTP 200, CSV header for KBUF 2026-01-04; docs and product page read.

### NOAA NCEI — GHCNh (Global Historical Climatology Network hourly)
- Links: https://www.ncei.noaa.gov/products/global-historical-climatology-network-hourly · bulk https://www.ncei.noaa.gov/oa/global-historical-climatology-network/index.html#hourly/ · docs PDF `.../hourly/doc/ghcnh_DOCUMENTATION.pdf`
- Category · Class: observed hourly history · 🟢 Official
- Provides: period-of-record station files with QC flags (Dunn et al. 2016 checks).
- History · Live · Latency: period of record per station (not stated) · no · cadence not stated.
- Coverage: global; ISD sources plus 100+ more.
- Technical: files · PSV/Parquet · Auth: none.
- Cost: free. Licensing: not stated on the page (US government work, inference).
- Quality: page calls it the "next generation" dataset replacing ISD (no date given).
- Scores: Q ~8 / Cov ~9 / Rel ~7 / Lat ~3 / Hist ~10 / Doc ~7 / DX ~5 / Cost 10 / Lic 10 / Com 10 / RL 8 / NFL ~6 = **7.8**
- Recommendation: OPTIONAL now (PSV is parseable without dependencies; Parquet is not); plan migration from ISD when ISD stops.
- Verified: 2026-11-25 — product page read; files not downloaded.

### NOAA NCEI — Climate Data Online Web Services v2
- Links: https://www.ncdc.noaa.gov/cdo-web/webservices/v2 · token at `/cdo-web/token`
- Category · Class: climate data API · 🟢 Official
- Provides: GHCND daily, GSOM, GSOY, PRECIP_15 (examples on the page); not hourly game-time weather.
- History · Live · Latency: long · no.
- Technical: REST · JSON · Auth: free token (`token` header) · Rate limits: 5 requests/second, 10,000/day per token.
- Cost: free (needs a token — an account step; not created).
- Licensing: as NOAA.
- Scores: Q ~7 / Cov ~8 / Rel ~6 / Lat ~2 / Hist ~10 / Doc ~7 / DX ~5 / Cost 10 / Lic 10 / Com 10 / RL 5 / NFL ~3 = **6.9**
- Recommendation: AVOID for this use (daily only; ADS/IEM cover hourly without a token).
- Verified: 2026-11-25 — page read.

### Iowa Environmental Mesonet (Iowa State University) — ASOS/AWOS/METAR archive
- Links: https://mesonet.agron.iastate.edu/request/download.phtml · service `https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py` · terms https://mesonet.agron.iastate.edu/disclaimer.php · GitHub https://github.com/akrherz/iem
- Category · Class: observed hourly history (METAR) · 🔵 Public/open data
- Provides: per-report temperature, wind (knots), direction, gust, visibility, weather codes, METAR text; sources Unidata IDD, NCEI ISD, MADIS 1-minute ASOS (page).
- History · Live · Latency: decades (station dependent) · near-live · minutes.
- Coverage: global METAR network (non-US precipitation unavailable — page).
- Technical: REST/CGI · CSV · Auth: none · Rate limits: no per-minute figure; aggregate request limit "1,000 station years" (page).
- Cost: free.
- Licensing: public domain: "may be used freely by anyone for any lawful purpose" · attribution requested to IEM / Iowa State · no warranty.
- Quality: routine METARs at :54; KBUF season 2025 (Sept–Jan) = 3,042 rows, 200 KB in one call. nfldata vs KBUF at kickoff (9 Bills home games, 2025): temperature mean −0.9 °F (mean abs 2.0), wind mean −2.2 mph (mean abs 3.3) — the airport is 19 km away and windier.
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~8 / Hist ~10 / Doc ~7 / DX ~9 / Cost 10 / Lic 10 / Com ~9 / RL ~7 / NFL ~8 = **8.5**
- Recommendation: PRIMARY (observed game-time conditions near each stadium, all seasons) — label "airport observation N km away".
- Verified: 2026-11-25 — disclaimer and download page read; probe HTTP 200 (KBUF 2025-09-01..2026-01-06).

### Meteostat — bulk data and JSON API
- Links: https://meteostat.net · https://dev.meteostat.net · licence https://dev.meteostat.net/license · terms https://dev.meteostat.net/terms.html · https://github.com/meteostat/meteostat-python (MIT) · API pricing https://rapidapi.com/meteostat/api/meteostat/pricing
- Category · Class: observed history (aggregated) · 🔵 Public/open data
- Provides: hourly station data (temperature, wind, gust, precipitation, pressure, condition), bulk files without a key.
- History · Live · Latency: decades · no · bulk "not versioned"; column removal/rename with 90 days' notice [helper].
- Coverage: global.
- Technical: files (parquet/CSV) and JSON API via RapidAPI · Auth: none (bulk) / `X-RapidAPI-Key` · Rate limits: Basic 500 requests/month hard limit, 3/s [helper].
- Cost: bulk free · RapidAPI Basic $0; Pro $9.99 (10,000/month); Ultra $29.99; Mega $99.99 [helper, from embedded page JSON] · est.: $0.
- Licensing: **CC BY 4.0**, usable "even commercially" (licence page read) · attribution: Meteostat plus the original providers (e.g. "Source: Meteostat, Deutscher Wetterdienst") · indicate changes · data from providers via the Python library may carry the providers' own terms.
- Quality: **leakage risk** — by default fills missing observations with model data that "may include weather forecasts"; an opt-out exists [helper]. Disable model fill for backtests.
- Scores: Q ~7 / Cov ~9 / Rel ~7 / Lat ~4 / Hist ~10 / Doc ~8 / DX ~7 / Cost 9 / Lic 9 / Com 8 / RL ~7 / NFL ~7 = **7.7**
- Recommendation: SECONDARY (history backfill, especially abroad) with model fill off.
- Verified: 2026-11-25 — licence page read directly; other figures from helper (read same day).

### Visual Crossing — Timeline Weather API
- Links: https://www.visualcrossing.com · /weather-data-editions/ · /weather-data-pricing/ · terms /weather-services-terms/
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: 15-day forecast, "50+ Years of History Data", sub-hourly history on some plans [helper].
- History · Live · Latency: 50+ years · yes · not stated.
- Coverage: global.
- Technical: REST · JSON/CSV · Auth: key (not verified) · 1 concurrent request, 1,000 records per query (free) [helper].
- Cost: free: 1,000 records/day (meta) / table says 30,000 records/month — inconsistent on the page · paid (from the page's JS config, re-check in a browser): Professional US$35/month, Metered US$0.0001/record, Corporate US$150/month, Enterprise contact sales [helper] · est.: $0–35.
- Licensing: commercial: yes on all plans (table) · redistribution: raw data "may never be shared or distributed publicly for download" · storage: may be stored in any database · attribution: "Weather Data Provided by Visual Crossing" on Free/Professional/Metered [helper].
- Scores: Q ~7 / Cov ~10 / Rel ~8 / Lat ~8 / Hist ~9 / Doc ~8 / DX ~8 / Cost 7 / Lic ~6 / Com ~8 / RL 6 / NFL ~7 = **7.7**
- Recommendation: SECONDARY for a commercial product (cheap, storage allowed; do not publish raw downloads).
- Verified: 2026-11-25 [helper] — pages read; prices from JS bundle, treat as likely.

### Tomorrow.io — Weather API
- Links: https://www.tomorrow.io/weather-api/ · https://docs.tomorrow.io/reference/rate-limiting · terms https://www.tomorrow.io/legal/terms-of-service/ ("updated: 28 October 2026")
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: Free: 5-day forecast, 24 h history; historical up to 20 years (plan unclear) [helper].
- Technical: REST · JSON · Auth: `apikey` · Rate limits (free): 500/day, 25/hour, 3/second — from a search snippet only (UNVERIFIED).
- Cost: free tier as above; Enterprise "Contact us" · est.: n/a.
- Licensing: "Commercial use is strictly prohibited" on self-serve accounts; no storing the unaltered datafeed without an Order; "Powered by Tomorrow.io" [helper].
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~4 / Doc ~8 / DX ~8 / Cost 4 / Lic ~2 / Com ~3 / RL 3 / NFL ~4 = **5.9**
- Recommendation: AVOID (storage ban conflicts with committed snapshots).
- Verified: 2026-11-25 [helper] — terms read; limits UNVERIFIED.

### OpenWeather — One Call 3.0 / History
- Links: https://openweathermap.org/api/one-call-3 · /price · /history · /faq · T&C of sale PDF
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: One Call 3.0 hourly 48 h; data "from January 1st, 1979 till 4 days ahead"; History Bulk US$10 per location from 1979 [helper].
- Technical: REST · JSON · Auth: `appid` · One Call: "First 1,000 API calls per day are FREE", then US$0.0015/call; default cap 2,000/day [helper].
- Cost: plans Startup $40, Developer $180, Professional $470, Expert $1,200/month [helper] · est.: $0 at <1,000 calls/day.
- Licensing: data CC BY-SA 4.0, database ODbL (T&C of sale); attribution obligatory on Free–Professional ("Weather data provided by OpenWeather" + link/logo); commercial use allowed (FAQ) [helper]. Share-alike risk if the stored database is republished (inference).
- Quality: One Call 2.5 "deprecated in June 2024" [helper].
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~9 / Doc ~8 / DX ~8 / Cost 7 / Lic ~5 / Com ~7 / RL 7 / NFL ~6 = **7.4**
- Recommendation: OPTIONAL (backup history 1979+, pay-per-call).
- Verified: 2026-11-25 [helper].

### Weatherbit
- Links: https://www.weatherbit.io/pricing · terms https://www.weatherbit.io/terms ("UPDATED: May 1st, 2025")
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: 240 h hourly (paid); history 5–30 years by plan [helper].
- Technical: REST · JSON · quotas reset 00 UTC.
- Cost: free 50 requests/day, no hourly forecast, CC BY-NC 4.0; Standard $49, Plus $209, Business $495, Enterprise from $995/month [helper].
- Licensing: storage "in any cloud based environment" needs payment; do-follow link on free [helper].
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~7 / Doc ~7 / DX ~7 / Cost 4 / Lic ~3 / Com ~6 / RL 3 / NFL ~4 = **6.1**
- Recommendation: AVOID (expensive for this need).
- Verified: 2026-11-25 [helper].

### WeatherAPI.com
- Links: https://www.weatherapi.com/pricing.aspx · terms https://www.weatherapi.com/terms.aspx
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: Free: 3-day forecast, 1 day of history; Business: history "Since 1 Jan 2010" [helper].
- Technical: REST · JSON · monthly quotas.
- Cost: free 100,000 calls/month; Starter $7, Pro+ $25, Business $65/month [helper].
- Licensing: free plan "free for commercial use"; cache current ≤60 min, forecast ≤24 h, history unrestricted; credit WeatherAPI.com; no reselling [helper].
- Scores: Q ~6 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~6 / Doc ~7 / DX ~8 / Cost 7 / Lic ~6 / Com ~7 / RL 8 / NFL ~5 = **7.1**
- Recommendation: OPTIONAL (commercial history backup at $65/month).
- Verified: 2026-11-25 [helper].

### Pirate Weather
- Links: https://pirateweather.net · https://docs.pirateweather.net/en/latest/ · https://github.com/Pirate-Weather/pirate-weather-code (AGPL-3.0)
- Category · Class: forecast (NOAA models) · ⚫ Experimental/unstable (one-person service, terms not found)
- Provides: Dark Sky-style API; 48 h hourly (168 with `extend=hourly`); ERA5 history "from 1940 onward" [helper].
- Technical: REST · JSON · Auth: key in path.
- Cost: 10,000 calls/month free; $2/month donation → 20,000 [helper]; other tiers UNVERIFIED.
- Licensing: UNVERIFIED (no terms page found).
- Scores: Q ~6 / Cov ~9 / Rel ~5 / Lat ~8 / Hist ~8 / Doc ~7 / DX ~8 / Cost 8 / Lic ~4 / Com ~3 / RL 5 / NFL ~5 = **6.3**
- Recommendation: AVOID until terms are published.
- Verified: 2026-11-25 [helper]; terms UNVERIFIED.

### Apple — WeatherKit REST API
- Links: https://developer.apple.com/weatherkit/get-started/ · /weatherkit/data-source-attribution/ · Apple Developer Program License Agreement (Attachment 8)
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: forecasts ~10 days; hourly history from "Aug 1, 2021" [helper].
- Technical: REST · JSON · Auth: JWT via Developer account.
- Cost: Developer Program US$99/year includes 500,000 calls/month; 1M $49.99 … 200M $9,999.99/month [helper].
- Licensing: no caching/storage beyond "temporary and limited"; no derived database; Apple Weather mark + legal link required [helper].
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~4 / Doc ~8 / DX ~6 / Cost 6 / Lic ~2 / Com ~6 / RL 9 / NFL ~4 = **6.7**
- Recommendation: AVOID (storage ban; history only from 2021).
- Verified: 2026-11-25 [helper]. Dark Sky→WeatherKit history UNVERIFIED this session.

### Google Maps Platform — Weather API
- Links: https://developers.google.com/maps/documentation/weather/overview · /policies · pricing https://developers.google.com/maps/billing-and-pricing/pricing · Service Terms §22
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: hourly forecast up to 240 h; history only 24 h [helper].
- Cost: "Weather Usage" 10,000 free events/month, then US$0.15/1,000 (to 100k) … $0.038 (>5M) [helper].
- Licensing: cache current/hourly 1 h, daily 24 h, history 240 h then delete; "Source: Includes weather data from Google"; no weather app "whose primary purpose is… weather" [helper].
- Scores: Q ~8 / Cov ~9 / Rel ~8 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~7 / Cost 7 / Lic ~2 / Com ~6 / RL 8 / NFL ~4 = **6.4**
- Recommendation: AVOID (no archive; deletion rules).
- Verified: 2026-11-25 [helper].

### AccuWeather — Core Weather API
- Links: https://developer.accuweather.com · terms /documentation/terms-of-use ("Last updated: April 28, 2026")
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: hourly/daily forecasts; history 6–24 h [helper].
- Cost: 14-day trial (500 calls/day); Starter "$2 per month", 15,000 calls, personal non-commercial; other tiers JS-only (UNVERIFIED) [helper].
- Licensing: cache ≤2 weeks; no archive/database; no commingling with other weather data; logo on every screen; no AI/ML training [helper].
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~1 / Doc ~7 / DX ~6 / Cost 4 / Lic ~1 / Com ~4 / RL 4 / NFL ~3 = **5.4**
- Recommendation: AVOID (commingling and archive bans).
- Verified: 2026-11-25 [helper].

### Meteomatics — Weather API
- Links: https://www.meteomatics.com/en/weather-api/ · /en/pricing/ · /en/gtc/
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: history "back to 1940" (ERA5 + observations) [helper].
- Cost: "Talk to our experts" (contact sales); free basic account UNVERIFIED (page 404) [helper].
- Licensing: UNVERIFIED (terms not in HTML).
- Scores: Q ~9 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~10 / Doc ~8 / DX ~6 / Cost 2 / Lic ~3 / Com ~7 / RL ~5 / NFL ~5 = **6.8**
- Recommendation: OPTIONAL (enterprise option only).
- Verified: 2026-11-25 [helper]; pricing = contact sales.

### Vaisala Xweather — Weather API (incl. lightning)
- Links: https://www.xweather.com/pricing · /pricing/weather-api-pay-as-you-go · /legal · docs
- Category · Class: forecast, observations archive, lightning · 🟡 Licensed/commercial
- Provides: conditions "January 2004 through today", hourly; lightning endpoints [helper].
- Technical: REST · JSON · Auth: `client_id`/`client_secret` (server-side only).
- Cost: "first 15,000 accesses each month are free"; pay-as-you-go US/Canada $0.0006/access, lightning 10× ($0.006) [helper].
- Licensing: attribution "powered by Vaisala Xweather" with link; storage/redistribution UNVERIFIED (General Conditions not readable) [helper].
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~9 / Hist ~8 / Doc ~8 / DX ~6 / Cost 7 / Lic ~4 / Com ~7 / RL 6 / NFL ~6 = **7.1**
- Recommendation: OPTIONAL (commercial lightning near a stadium; read terms first).
- Verified: 2026-11-25 [helper].

### UK Met Office — Weather DataHub (site-specific)
- Links: https://datahub.metoffice.gov.uk/pricing/site-specific · /support/faqs
- Category · Class: forecast (global spot) · 🟢 Official
- Provides: hourly 48 h, three-hourly 168 h for ~45,000 sites; observations 48 h [helper].
- Cost: free 360 calls/day; £9–£437/month tiers [helper].
- Licensing: commercial "Yes"; "Powered by Met Office data" [helper].
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~9 / Hist ~1 / Doc ~7 / DX ~6 / Cost 8 / Lic ~8 / Com ~9 / RL 5 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL (London games cross-check).
- Verified: 2026-11-25 [helper]; requires an account key (not created).

### Bright Sky — DWD open data wrapper
- Links: https://brightsky.dev · https://api.brightsky.dev/openapi.json · GitHub jdemaeyer/brightsky (MIT) · DWD legal notice
- Category · Class: forecast + observations (Germany) · 🔵 Public/open data
- Provides: DWD observations (Germany) and MOSMIX forecasts (world, sparse); history from "January 1st, 2010" [helper].
- Technical: REST · JSON · no key.
- Cost: free. Licensing: DWD CC BY 4.0, source must be acknowledged [helper].
- Scores: Q ~7 / Cov ~3 / Rel ~7 / Lat ~8 / Hist ~7 / Doc ~7 / DX ~9 / Cost 10 / Lic 9 / Com 9 / RL 8 / NFL ~2 = **7.2**
- Recommendation: OPTIONAL (Munich/Berlin games only).
- Verified: 2026-11-25 [helper].

### B. Lightning and radar

### NOAA — GOES-R Geostationary Lightning Mapper (GLM L2 LCFA) on NODD/AWS
- Links: https://registry.opendata.aws/noaa-goes/ · bucket `noaa-goes19` (GOES-East since 2025-04-04), `noaa-goes18` (West)
- Category · Class: lightning (satellite) · 🟢 Official
- Provides: lightning events/groups/flashes every 20 s (file names `s…00000_e…00200`).
- History · Live · Latency: archive in bucket (GOES-16 distribution ended after the 2025 switch) · yes · file created ~20 s after its window (probe).
- Coverage: Americas (GOES-East/West).
- Technical: files · NetCDF-4 (HDF5) · Auth: none · S3 listing works anonymously.
- Cost: free. Licensing: NODD open data; attribution requested for unaltered data; no NOAA endorsement implied.
- Quality: satellite total lightning, ~8 km pixels (judgment: enough for "lightning within ~10 mi", not for exact strike points). Parsing HDF5 without dependencies is impractical.
- Scores: Q ~7 / Cov ~7 / Rel ~8 / Lat ~9 / Hist ~7 / Doc ~6 / DX ~2 / Cost 10 / Lic 10 / Com 10 / RL 9 / NFL ~4 = **7.4**
- Recommendation: OPTIONAL (server-side only, later) — the only open, commercial-safe live lightning feed found.
- Verified: 2026-11-25 — registry page read; S3 listing of `GLM-L2-LCFA/2026/329/22/` HTTP 200.

### Blitzortung.org — community lightning network
- Links: https://www.blitzortung.org/en/cover_your_area.php
- Category · Class: lightning (volunteer) · ⚫ Experimental/unstable
- Provides: raw strike data to participating station owners.
- Licensing: raw data for "all non-commercial purposes" for station owners; access tied to transmitting data (page). No public API terms.
- Scores: Q ~6 / Cov ~8 / Rel ~5 / Lat ~9 / Hist ~3 / Doc ~2 / DX ~3 / Cost 8 / Lic ~1 / Com 1 / RL ~3 / NFL ~3 = **4.3**
- Recommendation: AVOID (no licence for third-party apps).
- Verified: 2026-11-25 — page read.

### Earth Networks (AEM) — Total Lightning Network / Sferic API
- Links: https://www.earthnetworks.com · developer.earthnetworks.com · /pricing-guide/
- Category · Class: lightning · 🟡 Licensed/commercial
- Provides: Sferic API, Data Stream, alerting (page). Part of the AEM "family of brands".
- Cost: no public price (pricing guide not read) — contact sales.
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~9 / Hist ~5 / Doc ~3 / DX ~3 / Cost ~2 / Lic ~3 / Com ~6 / RL ~5 / NFL ~4 = **5.3**
- Recommendation: OPTIONAL (commercial lightning alternative to Xweather).
- Verified: 2026-11-25 — home page read; terms, pricing UNVERIFIED.

### RainViewer — Weather Maps API
- Links: https://www.rainviewer.com/api.html · `https://api.rainviewer.com/public/weather-maps.json`
- Category · Class: radar tiles · ⚫ Experimental/unstable (free, best effort)
- Provides: past radar frames (2 h), colour schemes; nowcast and satellite listed in metadata.
- History · Live · Latency: 2 h · yes · "refreshed every 5 minutes".
- Coverage: "1200+ radars" in "150+ countries" (page).
- Technical: tiles · PNG · no key.
- Cost: free; "There's no fee or paid tier currently".
- Licensing: "available for personal and educational use only"; attribution with link mandatory; commercial/high-volume case by case; no SLA.
- Quality: probe returned 13 past radar frames, **0 nowcast frames and 0 satellite frames**, although the page describes nowcast frames (contradiction; reduction date UNVERIFIED).
- Scores: Q ~6 / Cov ~8 / Rel ~5 / Lat ~9 / Hist ~1 / Doc ~7 / DX ~9 / Cost 10 / Lic ~3 / Com 2 / RL ~6 / NFL ~4 = **5.8**
- Recommendation: OPTIONAL (non-commercial radar overlay only).
- Verified: 2026-11-25 — API page read; metadata probe HTTP 200.

### Iowa Environmental Mesonet — NEXRAD composite tiles
- Links: https://mesonet.agron.iastate.edu/ogc/ · tile `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png`
- Category · Class: radar tiles (US) · 🔵 Public/open data
- Provides: CONUS base reflectivity composite; archived composites (time-stamped layers).
- History · Live · Latency: archive for years (time-stamped products; depth not re-checked) · yes · ~5 min.
- Technical: XYZ tiles / WMS · PNG · no key.
- Cost: free. Licensing: public domain per IEM disclaimer; credit requested.
- Scores: Q ~7 / Cov ~5 / Rel ~7 / Lat ~8 / Hist ~8 / Doc ~6 / DX ~8 / Cost 10 / Lic 10 / Com ~9 / RL ~6 / NFL ~4 = **7.3**
- Recommendation: PRIMARY (US radar overlay, commercial-safe); RainViewer abroad.
- Verified: 2026-11-25 — one tile probe HTTP 200 image/png.

### NOAA NCEP — opengeo radar WMS (MRMS base reflectivity)
- Links: `https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?service=wms&request=GetCapabilities`
- Category · Class: radar (US) · 🟢 Official
- Provides: layer `conus_bref_qcd`; capabilities say AccessConstraints "none", Fees "none".
- Technical: WMS · PNG · no key.
- Scores: Q ~8 / Cov ~5 / Rel ~7 / Lat ~9 / Hist ~1 / Doc ~5 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~4 = **6.8**
- Recommendation: SECONDARY (official backup to IEM tiles).
- Verified: 2026-11-25 — GetCapabilities HTTP 200.

### C. Historical game-time weather datasets

### nflverse — nfldata `games.csv` (roof, surface, temp, wind, stadium)
- Links: https://github.com/nflverse/nfldata · dictionary `DATASETS.md` · `https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv`
- Category · Class: schedule/results with game conditions · 🔵 Public/open data (no licence file; facts)
- Provides: `roof` (outdoors/open/closed/dome — per game, so retractable status is recorded), `surface`, `temp` (°F) and `wind` (mph) "for outdoors and open only", `stadium_id`, `stadium`, `away_rest`, `home_rest`, `gametime` (Eastern), `location` (Home/Neutral).
- History · Live · Latency: 1999 on · no · repo pushed 2026-11-25T22:45Z.
- Coverage (outdoor/open played games with temp and wind): 1999–2021 ≈ 95–100%; **2022: 107/198**; **2023: 158/199**; 2024: 182/187; 2025: 189/193; **2026 to date: 44/114**. Surface filled almost always except 2023 (250/285) and 2026 (174/272).
- Technical: file · CSV (2.19 MB) · Auth: none.
- Cost: free.
- Licensing: no licence file (`license: null` via gh); registry practice: credit nflverse; the source of temp/wind is not documented (UNVERIFIED — likely the official gamebook/PFR).
- Quality (findings): (1) **2025 international games carry the designated home team's own stadium** (e.g. Dublin game as "Acrisure Stadium", Berlin as "Lucas Oil Stadium… closed", São Paulo as "SoFi Stadium… dome"); 2026 neutral games are named correctly but **MCG, Stade de France and Allianz Arena are labelled `dome`** (open-air pitches) and the Tottenham game of week 5 has id `JAX00`. (2) **Buffalo 2026 reuses `BUF00`** for the new stadium; surface mixes `grass` (3) and `a_turf` (3). (3) Houston's 2026 stadium name reverted to "Reliant Stadium". (4) Surface values for 2019–2020 look wrong for several teams (NE/CIN "grass", KC "astroturf", HOU "grass") — inference from widely known installations; verify before use. (5) Values agree with the KBUF airport within ~2 °F / ~3 mph (see IEM).
- Scores: Q ~6 / Cov ~9 / Rel ~8 / Lat ~5 / Hist ~9 / Doc ~7 / DX ~10 / Cost 10 / Lic ~6 / Com ~5 / RL 10 / NFL ~10 = **7.9**
- Recommendation: PRIMARY (observed game conditions and per-game roof status) with the corrections above and a fallback for blanks.
- Verified: 2026-11-25 — `gh api` listing and dictionary; one download; coverage computed locally.

### nflverse — nfldata `airports.csv`
- Links: https://github.com/nflverse/nfldata/blob/master/data/airports.csv
- Category · Class: team home airports · 🔵 Public/open data
- Provides: team, IATA code, lat/lon, `time_zone` as hours relative to Eastern (e.g. ARI −2, DEN −2, LAC −3).
- Quality: **fixed offsets ignore DST** — Arizona is −3 from Eastern while the East is on daylight time (the first ~9 weeks of the season) — use IANA zones instead. New England uses PVD; there is one row per team (no neutral sites).
- Scores: Q ~5 / Cov ~7 / Rel ~8 / Lat ~5 / Hist ~2 / Doc ~4 / DX ~10 / Cost 10 / Lic ~6 / Com ~5 / RL 10 / NFL ~6 = **6.5**
- Recommendation: SECONDARY (team travel origin); replace offsets with IANA zones.
- Verified: 2026-11-25 — file read via gh (849 bytes, 32 rows).

### ThompsonJamesBliss — WeatherData (GitHub)
- Links: https://github.com/ThompsonJamesBliss/WeatherData
- Category · Class: game weather 2000–2020 · 🟠 Unofficial
- Provides: `games_weather.csv` (hourly through each game, Meteostat and **Weather Underground**, distance to station), `stadium_coordinates.csv` with `StadiumAzimuthAngle`.
- History · Live · Latency: 2000–2020 · no · last push 2021-10-06.
- Licensing: **no licence**; Weather Underground data is not redistributable (inference: WU terms bar this; not re-read).
- Quality: azimuth 0 for several outdoor stadiums (Lambeau, Empower, Lumen, Raymond James — possibly placeholders); old Buffalo stadium 302.1°, identical to Hard Rock 302.1° (suspicious).
- Scores: Q ~5 / Cov ~7 / Rel ~3 / Lat ~1 / Hist ~7 / Doc ~6 / DX ~8 / Cost 10 / Lic ~1 / Com 1 / RL 10 / NFL ~6 = **5.4**
- Recommendation: AVOID as data (no licence); use as a cross-check of OSM azimuths only.
- Verified: 2026-11-25 — gh metadata, README and stadium file read.

### NFLWeather.com (USA Today Sports Media Group)
- Links: https://www.nflweather.com · terms https://www.nflweather.com/terms_of_use
- Category · Class: game forecasts and archive (website) · 🔴 Scraping (no API)
- Provides: per-game forecast; season selector 2009–2026.
- Licensing: reuse allowed only with a linked "Forecasts provided by NFLWeather.com"; "You may not modify or create derivative works" without permission; no API or data licence.
- Scores: Q ~6 / Cov ~9 / Rel ~6 / Lat ~7 / Hist ~6 / Doc ~2 / DX ~2 / Cost 10 / Lic ~3 / Com ~2 / RL ~3 / NFL ~8 = **5.3**
- Recommendation: AVOID (no API; derivative-work ban; its archived forecasts are not documented as pre-kickoff).
- Verified: 2026-11-25 — home and terms pages read.

### D. Stadiums and venue geometry

### Wikidata — stadium items (SPARQL)
- Links: https://query.wikidata.org/sparql · https://www.wikidata.org/wiki/Wikidata:Licensing (CC0)
- Category · Class: venue attributes · 🔵 Public/open data (CC0)
- Provides: P625 coordinates, P1083 capacity, P2044 elevation, P765 surface, P1619 opening, P115 home venue.
- Coverage (probe: teams with P118 = NFL and P115 home venue): 43 rows over 35 "teams" (includes three Commanders season items); **0 stadiums have P2044 elevation**; surface often wrong (Lambeau, Soldier Field, M&T Bank, Lincoln Financial as "artificial turf"); Bills' P115 still points to Ralph Wilson Stadium; Chiefs list historic venues (Cotton Bowl, Municipal Stadium) without filtering; new Highmark Stadium Q16251517 has coordinates 42.77297, −78.79219, inception 2026, no capacity.
- Technical: SPARQL · JSON · Auth: User-Agent · a label-only search query returned 502 (timeout) — use `wbsearchentities`.
- Cost: free. Licensing: CC0 (no attribution required).
- Scores: Q ~5 / Cov ~8 / Rel ~7 / Lat ~6 / Hist ~6 / Doc ~8 / DX ~8 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~5 = **7.5**
- Recommendation: SECONDARY (ids and coordinates; never surface or elevation).
- Verified: 2026-11-25 — SPARQL HTTP 200 (45 KB); `wbsearchentities` and EntityData for Q16251517.

### OpenStreetMap — Overpass API (stadium and pitch polygons)
- Links: https://overpass-api.de · https://www.openstreetmap.org/copyright · https://wiki.openstreetmap.org/wiki/Overpass_API
- Category · Class: venue geometry · 🔵 Public/open data (ODbL)
- Provides: `leisure=pitch` + `sport=american_football` polygons → field long axis; `leisure=stadium`, `surface=*` tags.
- Probe (one query, 700 m around new Highmark): 5 pitches; way 1577454592 (`surface=grass`, centroid 42.77287, −78.79216, 36 nodes) → **minimum-area rectangle long axis 167.6°/347.6°** (158 × 100 m outline, includes run-off; PCA 161°). The old stadium's pitch is no longer mapped.
- History · Live · Latency: current only (history via OSM full-history dumps) · minutes (osm_base 2026-11-25T22:51Z).
- Technical: Overpass QL · JSON · Auth: none · fair use (no numeric limit read).
- Cost: free. Licensing: ODbL — "Provide credit to OpenStreetMap by displaying our attribution notice"; a database derived from OSM (e.g. a venue-azimuth table) must be shared under ODbL if distributed (share-alike).
- Quality: depends on mapper; check against aerial imagery or official diagrams (±5° plausible — judgment).
- Scores: Q ~7 / Cov ~8 / Rel ~6 / Lat ~7 / Hist ~5 / Doc ~8 / DX ~7 / Cost 10 / Lic ~6 / Com ~7 / RL ~4 / NFL ~7 = **6.8**
- Recommendation: PRIMARY (field azimuth, once per venue; store with `source: OSM way id`, ODbL notice).
- Verified: 2026-11-25 — copyright page read; one Overpass query HTTP 200; azimuth computed locally.

### OpenStreetMap Foundation — Nominatim (public instance)
- Links: https://nominatim.openstreetmap.org · policy https://operations.osmfoundation.org/policies/nominatim/
- Category · Class: geocoding · 🔵 Public/open data
- Provides: geocoding (probe "Lambeau Field" → 44.50097, −88.06197, leisure/stadium, licence string ODbL).
- Technical: REST · JSON · Auth: identifying User-Agent · "absolute maximum of 1 request per second"; no client-side autocomplete; cache results [helper read policy].
- Cost: free. Licensing: ODbL; commercial users warned access may change [helper].
- Scores: Q ~7 / Cov ~9 / Rel ~7 / Lat ~8 / Hist ~3 / Doc ~8 / DX ~8 / Cost 10 / Lic ~6 / Com ~3 / RL 2 / NFL ~4 = **6.2**
- Recommendation: SECONDARY (one-off venue lookups, stored).
- Verified: 2026-11-25 — one probe HTTP 200; policy [helper].

### Wikipedia — stadium articles
- Links: https://en.wikipedia.org (footer: "Creative Commons Attribution-ShareAlike 4.0 License")
- Category · Class: venue facts (capacity, surface history, renovations) · 🔵 Public/open data (text CC BY-SA 4.0)
- Provides: narrative surface/roof history, renovation dates; facts are not copyrightable but copied text is share-alike.
- Scores: Q ~6 / Cov ~8 / Rel ~6 / Lat ~6 / Hist ~7 / Doc ~6 / DX ~5 / Cost 10 / Lic ~5 / Com ~6 / RL ~6 / NFL ~6 = **6.4**
- Recommendation: SECONDARY (manual curation with citation; no bulk copying of text).
- Verified: 2026-11-25 — licence footer checked on Lambeau Field page; NFL International Series article read.

### Sports Reference — Pro-Football-Reference stadium pages
- Links: https://www.pro-football-reference.com/stadiums/ · terms https://www.sports-reference.com/termsofuse.html · data use https://www.sports-reference.com/data_use.html
- Category · Class: venue and game facts · 🔴 Scraping (no API)
- Licensing: no "automated means" that affect the site without permission; no competing database; **no use to train or prompt AI models**; reuse of individual-page facts welcomed with credit; custom data ≥ US$5,000.
- Scores: Q ~8 / Cov ~9 / Rel ~8 / Lat ~6 / Hist ~10 / Doc ~5 / DX ~3 / Cost 10 / Lic ~2 / Com ~2 / RL ~2 / NFL ~8 = **6.1**
- Recommendation: AVOID automated use (manual fact check only, credited). The AI clause matters for the project's assistant.
- Verified: 2026-11-25 — both policy pages read.

### Official stadium and club websites
- Category · Class: venue facts · 🟢 Official — authoritative for surface, roof, renovations; terms differ by club (not read for all; registry notes the 49ers' terms only). Use for manual verification with a link; not catalogued for automation. UNVERIFIED per club.

### E. Geocoding, routing, elevation, time zones, airports

### Photon (Komoot public instance)
- Links: https://photon.komoot.io · https://github.com/komoot/photon (Apache-2.0, push 2026-11-23)
- Category · Class: geocoding · 🔵 Public/open data (OSM)
- Limits: none numeric; "Extensive usage will be throttled or completely banned" [helper].
- Scores: Q ~6 / Cov ~9 / Rel ~5 / Lat ~8 / Hist ~3 / Doc ~6 / DX ~8 / Cost 10 / Lic ~6 / Com ~3 / RL ~3 / NFL ~3 = **5.8**
- Recommendation: OPTIONAL (self-host if ever needed).
- Verified: 2026-11-25 [helper].

### Google Maps Platform — Geocoding, Routes, Time Zone, Map Tiles
- Links: https://developers.google.com/maps/billing-and-pricing/pricing · /march-2025 · geocoding/timezone policies
- Category · Class: geo APIs · 🟡 Licensed/commercial
- Cost: since 2025-03-01 the US$200 monthly credit is replaced by per-SKU free caps: Geocoding 10,000/month then $5.00/1,000; Compute Routes Essentials 10,000 then $5.00 (Pro 5,000 / $10; Enterprise 1,000 / $15); Time Zone 10,000 then $5.00; Dynamic Maps 10,000 then $7.00; 2D Map Tiles 100,000 then $0.60 [helper].
- Licensing: geocode lat/lng cacheable "up to 30 consecutive calendar days"; place IDs indefinitely; Google attribution; no storage outside Services for Time Zone [helper].
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~9 / Hist ~3 / Doc ~9 / DX ~7 / Cost 6 / Lic ~2 / Com ~7 / RL 8 / NFL ~3 = **6.8**
- Recommendation: AVOID (30-day cache conflicts with committed snapshots; not needed for ~45 fixed venues).
- Verified: 2026-11-25 [helper].

### Mapbox — Geocoding v6 and GL JS
- Links: https://docs.mapbox.com/api/search/geocoding/ · https://www.mapbox.com/pricing
- Category · Class: geocoding, maps · 🟡 Licensed/commercial
- Cost: temporary geocoding 100,000/month free then $0.75/1,000; permanent (`permanent=true`) no free tier, $5.00/1,000; 50,000 web map loads free then $5.00/1,000 [helper].
- Licensing: temporary results "are not allowed to be cached" and only with a Mapbox map; GL JS v2+ under Mapbox ToS only [helper].
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~9 / Hist ~3 / Doc ~9 / DX ~7 / Cost 6 / Lic ~3 / Com ~7 / RL 8 / NFL ~3 = **6.9**
- Recommendation: AVOID (MapLibre + open tiles cover the need).
- Verified: 2026-11-25 [helper].

### HERE — Geocoding & Search (Base plan)
- Links: https://www.here.com/get-started/pricing (403 to WebFetch; figures from its calculator JSON)
- Cost: 30,000 transactions/month free, then US$0.88/1,000 to 5M; "Permanent Geocoding is not included in the Base Plan" [helper]. Storage terms UNVERIFIED.
- Category · Class: geocoding · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~7 / DX ~6 / Cost 7 / Lic ~4 / Com ~7 / RL 7 / NFL ~3 = **6.6**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### TomTom — Search/Routing
- Links: https://docs.tomtom.com/pricing
- Cost: monthly free allowances, "no credit card needed": Geocoding 20K, Routing 20K, Matrix 2.5K, tiles 200K [helper]. Paid prices and storage terms UNVERIFIED.
- Category · Class: geo APIs · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~7 / DX ~7 / Cost 8 / Lic ~4 / Com ~6 / RL 7 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### Geoapify
- Links: https://www.geoapify.com/pricing/ · /terms-and-conditions/
- Cost: 3,000 credits/day free (5 req/s), free plan allowed "for commercial websites, apps…including in production"; paid $59–$609/month [helper].
- Licensing: OSM attribution always; Geoapify attribution on free plan [helper]; storage UNVERIFIED.
- Category · Class: geocoding/routing · 🟡 Licensed/commercial (OSM-based)
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~3 / Doc ~7 / DX ~8 / Cost 8 / Lic ~6 / Com ~7 / RL 7 / NFL ~3 = **6.8**
- Recommendation: OPTIONAL (best commercial-friendly free tier). Verified: 2026-11-25 [helper].

### LocationIQ
- Links: https://locationiq.com/pricing
- Cost: 5,000 requests/day free (2/s); "Limited Commercial Use" with link-back; free-plan cache ≤48 h; paid $45–$950/month [helper].
- Category · Class: geocoding · 🟡 Licensed/commercial
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~3 / Doc ~7 / DX ~8 / Cost 8 / Lic ~4 / Com ~6 / RL 7 / NFL ~3 = **6.5**
- Recommendation: AVOID (48 h cache). Verified: 2026-11-25 [helper].

### OSRM — public demo server
- Links: https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server (BSD-2-Clause code)
- Policy: "Do not exceed 1 request per second"; "reasonable, non-commercial use-cases"; no uptime guarantee [helper].
- Category · Class: routing · ⚫ Experimental/unstable (demo)
- Scores: Q ~7 / Cov ~10 / Rel ~4 / Lat ~8 / Hist ~3 / Doc ~6 / DX ~8 / Cost 10 / Lic ~5 / Com 1 / RL 3 / NFL ~3 = **5.7**
- Recommendation: AVOID (driving routes are irrelevant to team charter travel; haversine suffices). Verified: 2026-11-25 [helper].

### FOSSGIS — routing.openstreetmap.de / Valhalla
- Links: https://routing.openstreetmap.de/about.html · https://github.com/valhalla/valhalla (MIT)
- Policy: "One request per second max"; no heavy use; full policy behind bot protection (not bypassed) [helper].
- Category · Class: routing · ⚫ Experimental/unstable
- Scores: Q ~7 / Cov ~10 / Rel ~4 / Lat ~8 / Hist ~3 / Doc ~6 / DX ~7 / Cost 10 / Lic ~5 / Com ~2 / RL 3 / NFL ~3 = **5.7**
- Recommendation: AVOID (as OSRM). Verified: 2026-11-25 [helper].

### HeiGIT — openrouteservice
- Links: https://account.heigit.org/info/plans · /info/tos · https://giscience.github.io/openrouteservice/hosted-api-restrictions
- Cost: Standard "Free to use for everyone": Directions 2,000/day (40/min), Matrix 500/day, Isochrones 500/day, Elevation point 2,000/day [helper].
- Licensing: results CC-BY-SA 4.0; key required; software GPL-3.0 [helper].
- Category · Class: routing · 🔵 Public/open data (hosted)
- Scores: Q ~7 / Cov ~10 / Rel ~6 / Lat ~8 / Hist ~3 / Doc ~8 / DX ~8 / Cost 10 / Lic ~6 / Com ~6 / RL 5 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL (fan travel times, if ever). Verified: 2026-11-25 [helper].

### USGS — Elevation Point Query Service (EPQS)
- Links: https://epqs.nationalmap.gov/v1/docs · `https://epqs.nationalmap.gov/v1/json?x=<lon>&y=<lat>&units=Feet&wkid=4326` · https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits
- Category · Class: elevation (US) · 🟢 Official
- Provides: 3DEP elevation; helper call near Empower Field → 5,195.04 ft.
- Rate limits: none stated (UNVERIFIED). Licence: "U.S. Public Domain"; credit requested.
- Scores: Q ~9 / Cov ~5 / Rel ~7 / Lat ~8 / Hist ~5 / Doc ~6 / DX ~9 / Cost 10 / Lic 10 / Com 10 / RL ~6 / NFL ~5 = **7.5**
- Recommendation: PRIMARY (one-time altitude for US venues). Verified: 2026-11-25 [helper probe].

### Open-Elevation
- Links: https://open-elevation.com · Jorl17/open-elevation (GPL-2.0, push 2024-04-17)
- Cost: keyless 500 coordinates/month per IP; plans €5.99–€59.99 [helper]. SRTM 250 m on free tier.
- Category · Class: elevation · ⚫ Experimental/unstable
- Scores: Q ~5 / Cov ~10 / Rel ~4 / Lat ~6 / Hist ~5 / Doc ~5 / DX ~8 / Cost 8 / Lic ~7 / Com ~5 / RL 2 / NFL ~3 = **5.7**
- Recommendation: AVOID (Open-Meteo/USGS better). Verified: 2026-11-25 [helper].

### timezone-boundary-builder (evansiroky)
- Links: https://github.com/evansiroky/timezone-boundary-builder
- Provides: IANA zone polygons; release 2026f (2026-11-01). Code MIT; output data ODbL [helper].
- Category · Class: time zones · 🔵 Public/open data
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~7 / Hist ~7 / Doc ~8 / DX ~5 / Cost 10 / Lic ~7 / Com ~8 / RL 10 / NFL ~4 = **7.8**
- Recommendation: OPTIONAL (overkill: ~45 fixed venues can store their zone). Verified: 2026-11-25 [helper].

### TimeZoneDB
- Links: https://timezonedb.com/api · /premium
- Cost: free key, 1 request/second, "free for personal and non-commercial usage"; premium $5/month [helper].
- Category · Class: time zones · 🟡 Licensed/commercial
- Scores: Q ~7 / Cov ~10 / Rel ~6 / Lat ~8 / Hist ~5 / Doc ~6 / DX ~8 / Cost 8 / Lic ~5 / Com ~4 / RL 4 / NFL ~3 = **6.2**
- Recommendation: AVOID (not needed). Verified: 2026-11-25 [helper].

### IANA tz database + Node `Intl` (and Open-Meteo `timezone=auto`)
- Links: https://data.iana.org/time-zones/tz-link.html · https://nodejs.org/docs/latest-v18.x/api/intl.html
- Provides: "The public-domain time zone database"; Node official binaries use full ICU, so `Intl.DateTimeFormat({timeZone})` handles DST [helper]. Open-Meteo `timezone=auto` returned the zone for every venue in one call (this track): e.g. Lucas Oil → America/Indiana/Indianapolis, State Farm → America/Phoenix, Ford Field → America/Detroit, Estadio Banorte → America/Mexico_City.
- Category · Class: time zones · 🔵 Public/open data
- Scores: Q ~10 / Cov ~10 / Rel ~10 / Lat ~10 / Hist ~10 / Doc ~9 / DX ~10 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~7 = **9.7**
- Recommendation: PRIMARY (store each venue's IANA zone in `shared/teams.json`; compute offsets per kickoff).
- Verified: 2026-11-25 — Open-Meteo call (this track); Node check [helper].

### OurAirports
- Links: https://ourairports.com/data/ (TLS certificate expired on 2026-11-25 — not bypassed) · https://github.com/davidmegginson/ourairports-data (Unlicense)
- Provides: airports.csv (12.8 MB; ident, type, lat/lon, elevation, ICAO/IATA/GPS codes), runways, etc.; mirror "updated daily" (Last-Modified 2026-11-25 02:53 GMT).
- Category · Class: airports/stations · 🔵 Public/open data (public domain)
- Scores: Q ~7 / Cov ~10 / Rel ~8 / Lat ~7 / Hist ~4 / Doc ~7 / DX ~9 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~6 = **8.2**
- Recommendation: PRIMARY (nearest-station table and travel origins; filter to stations with ASOS/METAR via IEM).
- Verified: 2026-11-25 — one download of the GitHub mirror (HTTP 200); licence [helper].

### F. Maps and boundaries

### OpenStreetMap Foundation — tile.openstreetmap.org
- Links: https://operations.osmfoundation.org/policies/tiles/
- Policy: clear attribution; valid User-Agent and Referer; cache ≥7 days; no bulk/pre-fetch; "Offline use is not permitted"; commercial access "may be withdrawn at any point" [helper].
- Category · Class: map tiles · 🔵 Public/open data (donated service)
- Scores: Q ~8 / Cov ~10 / Rel ~6 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~9 / Cost 10 / Lic ~6 / Com 2 / RL ~4 / NFL ~3 = **6.5**
- Recommendation: AVOID for a product (fine for a prototype). Verified: 2026-11-25 [helper].

### Protomaps — PMTiles basemap (self-hosted)
- Links: https://docs.protomaps.com/basemaps/downloads · /deploy/ · /pmtiles/cloud-storage
- Provides: single-file vector basemap; planet ~120 GB (z0–15); area extracts via `pmtiles extract`; host needs HTTP Range + CORS (GitHub Pages "up to 1 GB") [helper].
- Licensing: PMTiles code BSD-3, spec CC0; basemap data "ODbL Produced Work (OpenStreetMap attribution required)" [helper].
- Category · Class: map tiles · 🔵 Public/open data
- Scores: Q ~8 / Cov ~10 / Rel ~9 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~6 / Cost 10 / Lic ~7 / Com ~9 / RL 10 / NFL ~4 = **7.8**
- Recommendation: SECONDARY (if a street-level map is ever wanted; the claude.ai static page may not serve range requests — UNVERIFIED).
- Verified: 2026-11-25 [helper].

### MapLibre GL JS
- Links: https://github.com/maplibre/maplibre-gl-js (BSD-3; v6.19.0, 2026-11-17) [helper]
- Category · Class: map SDK · 🔵 Public/open data (open source)
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~10 / Hist ~5 / Doc ~9 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~4 = **8.5**
- Recommendation: OPTIONAL (a dependency; the current hand-drawn Natural Earth map needs none). Verified: 2026-11-25 [helper].

### Stadia Maps
- Links: https://stadiamaps.com/pricing/
- Cost: free 200,000 credits/month, "Commercial use not allowed"; Starter $20, Standard $80, Professional $250 [helper].
- Category · Class: map tiles · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~8 / Cost 7 / Lic ~5 / Com ~5 / RL 7 / NFL ~3 = **6.8**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### MapTiler Cloud
- Links: https://www.maptiler.com/cloud/pricing/
- Cost: free 5k sessions and 100k requests/month, "personal, or non-commercial use", logo required; Flex $30/month [helper].
- Category · Class: map tiles · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~8 / Cost 7 / Lic ~5 / Com ~5 / RL 6 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### Natural Earth (in use for the map)
- Links: https://www.naturalearthdata.com/about/terms-of-use/
- Licensing: "All versions … are in the public domain"; credit "unnecessary" [helper].
- Category · Class: boundaries · 🔵 Public/open data
- Scores: Q ~7 / Cov ~10 / Rel ~10 / Lat ~5 / Hist ~5 / Doc ~7 / DX ~9 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~5 = **8.2**
- Recommendation: PRIMARY (keep). Verified: 2026-11-25 [helper].

### US Census Bureau — cartographic boundary files
- Links: https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
- Provides: 1:500k/5M/20M shapefile, GDB, KML, GeoPackage; vintage 2025 [helper]. Public-domain status not stated on page (inference from 17 U.S.C. §105).
- Category · Class: boundaries (US) · 🟢 Official
- Scores: Q ~9 / Cov ~5 / Rel ~9 / Lat ~5 / Hist ~8 / Doc ~7 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~4 = **7.8**
- Recommendation: SECONDARY (state/county detail if needed). Verified: 2026-11-25 [helper].

### G. Flight tracking

### OpenSky Network — REST API
- Links: https://openskynetwork.github.io/opensky-api/ (terms page returned 403)
- Terms (docs): "research and non-commerical purposes"; OAuth2 client credentials; daily credits 400 anonymous / 4,000 standard; may block cloud providers [helper].
- Category · Class: ADS-B positions · 🔵 Public/open data (research)
- Scores: Q ~7 / Cov ~7 / Rel ~6 / Lat ~8 / Hist ~6 / Doc ~7 / DX ~5 / Cost 8 / Lic ~2 / Com 1 / RL 4 / NFL ~1 = **5.2**
- Recommendation: AVOID (see below). Verified: 2026-11-25 [helper]; terms UNVERIFIED (403).

### ADS-B Exchange (JETNET)
- Links: https://www.adsbexchange.com/data-products/ · https://www.jetnet.com/products/adsb-exchange
- Cost: community API $10/month via RapidAPI, 10,000 requests, "built for non-commercial use"; enterprise by demo [helper]. Acquisition date UNVERIFIED.
- Category · Class: ADS-B positions · 🟡 Licensed/commercial
- Scores: Q ~7 / Cov ~8 / Rel ~7 / Lat ~9 / Hist ~6 / Doc ~5 / DX ~5 / Cost 6 / Lic ~2 / Com ~2 / RL 4 / NFL ~1 = **5.2**
- Recommendation: AVOID. Tracking named team charters defeats the FAA's LADD/PIA owner privacy programs (FAA pages read [helper]), exposes movements of identifiable people, and adds safety and league-relations risk, against the project's privacy rules. Schedule-based travel metrics give the analytic value without aircraft data.
- Verified: 2026-11-25 [helper].

### H. Algorithms

### NOAA Global Monitoring Laboratory — solar position algorithm (Meeus)
- Links: https://gml.noaa.gov/grad/solcalc/calcdetails.html
- Provides: equations behind NOAA's solar calculator (from Meeus, *Astronomical Algorithms*); spreadsheets valid 1901–2099; sunrise/sunset "accurate to within a minute" between ±72° latitude; "for research and recreational use only"; no longer maintained.
- Category · Class: algorithm · 🟢 Official
- Scores: Q ~9 / Cov ~10 / Rel ~10 / Lat ~10 / Hist ~10 / Doc ~7 / DX ~9 / Cost 10 / Lic ~8 / Com ~9 / RL 10 / NFL ~5 = **8.9**
- Recommendation: PRIMARY (implement in ~40 lines; formulas in §5; this track's Python check gave Buffalo 2026-12-27 16:25 EST: elevation 2.7°, azimuth 234°).
- Verified: 2026-11-25 — page read; implementation tested locally.

### I. Recommended mapping: stadium → coordinates → station → forecast → observed

1. **Venue record (once, with provenance)** in `shared/teams.json` (orchestrator-owned): coordinates (Wikidata id + OSM way id), `roof`, field azimuth (OSM, ODbL notice), elevation (USGS EPQS for US; Open-Meteo abroad), IANA zone, nearest observing stations (ICAO, distance, bearing). Add every neutral venue used since 2025 (today only Estadio Banorte, Tottenham and Wembley are listed; missing: Melbourne Cricket Ground, Maracanã, Stade de France, Bernabéu, Allianz Arena, plus Croke Park, Olympiastadion Berlin and Arena Corinthians for 2025 history). Correct Buffalo to the new stadium (42.77297, −78.79219 per Wikidata; OSM pitch centroid 42.77287, −78.79216).
2. **Station choice rule:** nearest METAR/ASOS station ≤ 25 km with similar exposure (same side of a large lake or sea front, similar elevation), else the nearest major airport, and always store the distance. Prefer a station that reports every hour (check IEM row count). Nearest medium/large airport with an ICAO code (OurAirports, haversine; computed here):

| Venue | Roof | Nearest (km) | Next (km) | Note |
|---|---|---|---|---|
| Highmark (old and new) | open | KBUF 19 | KIAG 39 | far; lake-effect gradients |
| Hard Rock | open | KHWO 5 | KOPF 7 | |
| Gillette | open | KOWD 13 | KBOS 37 | |
| MetLife | open | KTEB 4 | KEWR 16 | |
| M&T Bank | open | KBWI 12 | KMTN 19 | |
| Paycor | open | KLUK 8 | KCVG 14 | |
| Huntington Bank Field | open | KBKL 2 | KCLE 16 | lakefront, good match |
| Acrisure | open | KAGC 13 | KPIT 19 | |
| NRG | retractable | KHOU 14 | KSGR 25 | |
| Lucas Oil | retractable | KIND 12 | KBAK 60 | |
| EverBank | open | KNIP 11 | KCRG 12 | |
| Nissan | open | KBNA 10 | KMQY 29 | |
| Empower Field | open | KBJC 20 | KBKF 23 | KDEN farther; check altitude difference |
| Arrowhead | open | KMKC 13 | KMCI 34 | |
| AT&T | retractable | KDFW 17 | KDAL 26 | |
| Lincoln Financial | open | KPHL 7 | KPNE 24 | |
| Northwest Stadium | open | KADW 11 | KDCA 16 | |
| Soldier Field | open | KMDW 14 | KORD 27 | lakefront venue, inland stations |
| Lambeau | open | KGRB 6 | KATW 45 | |
| Mercedes-Benz | retractable | KFTY 12 | KATL 13 | |
| Bank of America | open | KCLT 8 | KJQF 22 | |
| Raymond James | open | KTPA 3 | KMCF 14 | |
| State Farm | retractable | KLUF 11 | KPHX 26 | |
| Levi's | open | KSJC 6 | KNUQ 7 | |
| Lumen | open | KBFI 8 | KSEA 17 | |
| Estadio Banorte | open | MMMX 17 | MMTO 44 | 2,245 m venue |
| Tottenham / Wembley | open (roofed stands) | EGLC 14 / EGWU 10 | EGWU 25 / EGLL 16 | |

Domes and SoFi (fixed roof) need no station. Ford Field's nearest is CYQG (Windsor, Canada) — irrelevant (dome) but shows why a country/sanity filter is needed. International venues not yet in `teams.json` (MCG → YMEN, Maracanã → SBRJ, Stade de France → LFPB, Bernabéu → LEMD, Allianz Arena → EDDM, Olympiastadion → EDDB, Croke Park → EIDW, Arena Corinthians → SBGR) were located from approximate coordinates typed from memory, NOT verified — re-derive from Wikidata/OSM before use.
3. **Forecast** (pre-game): Open-Meteo hourly at the venue grid cell (+ NWS hourly as US cross-check); freeze the value with `retrievedAt` and the model run if known.
4. **Observed** (post-game): nfldata `temp`/`wind` (gamebook-like, at the stadium) → else IEM ASOS at the chosen station (label distance) → else Open-Meteo Historical Forecast (≥2017/2021) or ERA5 (any year), each labelled by kind.
5. **Retractable roofs:** nfldata `roof` per game (`open`/`closed`) is the only per-game source found; it is blank before kickoff (2026 has 17 blanks for future games). No official pre-game roof feed found (UNVERIFIED that none exists; clubs announce on social media — not machine-readable). Until known, show "roof status unknown" and do not apply outdoor weather.

**Leakage-free historical weather.** Kinds and allowed uses:
- *Forecast-at-decision-time* (allowed as a pre-game feature): Open-Meteo Previous Runs `_previous_dayN` (2024+, GFS temperature 2021+); Single Runs (ECMWF 2024-03-14+, others 2026-04-02+); our own frozen fabric snapshots (from Nov. 2026). Choose N so that the run was published before the decision time (run start + 4–6 h publication delay ≤ decision time).
- *Near-observed / observed* (allowed only for post-game explanation, or as a stand-in for "perfect forecast" in an explicitly labelled upper-bound experiment): nfldata temp/wind, IEM/NCEI observations, Open-Meteo Historical Forecast (first hours of each run), ERA5.
- *Market proxy*: the total and spread at a frozen time already embed public weather forecasts — the cleanest pre-2024 pre-game "weather" input is the line itself (the project already uses lines).
- Never take a game-hour value from a source updated after kickoff and feed it to a pre-game model; store `kind` (`forecast|observed|reanalysis|model-analysis`) and `issuedAt` on every weather record.

## 3. Matrix rows

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Weather forecast | Open-Meteo Forecast | hourly T, wind, gust, precip, snow | yes | 92 d past | yes (non-comm.) | Std ~$29/mo (2023 post) | low | CC BY 4.0 | good | hourly | paid plan | PRIMARY | 8.0 |
| Weather archive (stitched) | Open-Meteo Historical Forecast | 0–6 h model output | no | 2017 IFS/2018 HRRR/2021 GFS | yes (non-comm.) | Pro ~$99/mo | low | CC BY 4.0 | good | daily | paid plan | SECONDARY | 7.6 |
| Archived forecasts | Open-Meteo Previous Runs | day1–7 lead forecasts | yes | 2024 (GFS T 2021) | yes (non-comm.) | Pro ~$99/mo | low | CC BY 4.0 | good | per run | paid plan | PRIMARY (backtests) | 7.4 |
| Archived forecasts | Open-Meteo Single Runs | full runs | no | 2024-03 IFS / 2026-04 others | yes (non-comm.) | not listed | low | CC BY 4.0 | good | 4–6 h | paid plan | OPTIONAL | 6.8 |
| Reanalysis | Open-Meteo Historical Weather | ERA5/ERA5-Land/IFS | no | 1940 | yes (non-comm.) | Pro ~$99/mo | low | CC BY 4.0 + Copernicus | consistent, coarse | 5 d delay | paid plan | SECONDARY | 7.8 |
| Elevation | Open-Meteo Elevation | DEM 90 m | – | – | yes | Std | low | CC BY 4.0 | approx. | – | paid plan | SECONDARY | 7.7 |
| Weather forecast (US) | NWS api.weather.gov | hourly forecast | yes | none | yes | – | free | public | good | hourly | yes | SECONDARY | 7.2 |
| Observations (US) | NWS api.weather.gov | station obs | yes | 7 days | yes | – | free | public | good | ≤20 min | yes | SECONDARY | 7.2 |
| Alerts (US) | NWS api.weather.gov | CAP alerts | yes | 7 days | yes | – | free | public | authoritative | minutes | yes | PRIMARY | 7.4 |
| Observations | NCEI ADS global-hourly | ISD hourly | no | 1901 | yes | – | free | US gov | good, coded | daily | yes | SECONDARY | 7.6 |
| Observations | NCEI GHCNh | hourly + QC | no | per station | yes | – | free | US gov | good | n/s | yes | OPTIONAL | 7.8 |
| Climate | NCEI CDO v2 | daily/monthly | no | long | yes (token) | – | free | US gov | good | – | yes | AVOID | 6.9 |
| Observations | IEM ASOS archive | METAR hourly | near-live | decades | yes | – | free | public domain | good | minutes | yes | PRIMARY | 8.5 |
| Observations | Meteostat | hourly stations | no | decades | yes (bulk) | $9.99–99.99 API | low | CC BY 4.0 | model-filled gaps | daily | yes | SECONDARY | 7.7 |
| Weather API | Visual Crossing | forecast + 50 y history | yes | 50+ y | 1,000 rec/day | $35/$150 | low | proprietary, storage OK | good | – | yes | SECONDARY (commercial) | 7.7 |
| Weather API | Tomorrow.io | forecast | yes | 24 h (free) | yes | contact | high | no storage | good | – | enterprise only | AVOID | 5.9 |
| Weather API | OpenWeather | One Call 3.0, history | yes | 1979 | 1,000 calls/day | $0.0015/call; $40+ | low | CC BY-SA / ODbL | fair | – | yes | OPTIONAL | 7.4 |
| Weather API | Weatherbit | forecast/history | yes | 5–30 y paid | 50/day | $49–995 | high | NC free; paid storage | fair | – | paid | AVOID | 6.1 |
| Weather API | WeatherAPI.com | forecast/history | yes | 2010 (Business) | 100k/mo | $7–65 | low | proprietary | fair | – | yes | OPTIONAL | 7.1 |
| Weather API | Pirate Weather | forecast, ERA5 | yes | 1940 | 10k/mo | donation | low | UNVERIFIED | fair | – | UNVERIFIED | AVOID | 6.3 |
| Weather API | Apple WeatherKit | forecast | yes | 2021 | 500k/mo w/ $99/yr | $49.99+ | medium | no storage | good | – | yes (no archive) | AVOID | 6.7 |
| Weather API | Google Weather | forecast | yes | 24 h | 10k/mo | $0.15/1k | low | delete after 1–240 h | good | – | yes (no archive) | AVOID | 6.4 |
| Weather API | AccuWeather | forecast | yes | 24 h | trial | $2+ | medium | no archive/commingling | good | – | restricted | AVOID | 5.4 |
| Weather API | Meteomatics | forecast/history | yes | 1940 | UNVERIFIED | contact | high | UNVERIFIED | very good | – | yes | OPTIONAL | 6.8 |
| Weather + lightning | Vaisala Xweather | conditions, lightning | yes | 2004 | 15k accesses/mo | $0.0006/access | low | UNVERIFIED storage | good | – | yes | OPTIONAL | 7.1 |
| Weather (UK) | Met Office DataHub | spot forecasts | yes | 48 h obs | 360/day | £9–437 | low | commercial yes | good | – | yes | OPTIONAL | 6.7 |
| Weather (DE) | Bright Sky / DWD | obs + MOSMIX | yes | 2010 | yes | – | free | CC BY 4.0 | good (DE) | – | yes | OPTIONAL | 7.2 |
| Lightning | NOAA GOES GLM | flashes | yes | archive | yes | – | free | NODD open | fair (8 km) | ~20 s files | yes | OPTIONAL | 7.4 |
| Lightning | Blitzortung | strikes | yes | – | participants | – | – | NC, participants | fair | seconds | no | AVOID | 4.3 |
| Lightning | Earth Networks | strikes | yes | UNVERIFIED | no | contact | high | UNVERIFIED | good | seconds | yes | OPTIONAL | 5.3 |
| Radar | RainViewer | radar tiles | yes | 2 h | yes | none | free | personal/educational | fair | 5 min | case by case | OPTIONAL | 5.8 |
| Radar (US) | IEM NEXRAD tiles | composite | yes | archive | yes | – | free | public domain | good | ~5 min | yes | PRIMARY | 7.3 |
| Radar (US) | NCEP opengeo WMS | MRMS reflectivity | yes | none | yes | – | free | none (US gov) | good | minutes | yes | SECONDARY | 6.8 |
| Game weather | nfldata games.csv | roof, surface, temp, wind | daily | 1999 | yes | – | free | no licence (credit) | gaps/errors | daily | likely (facts) | PRIMARY | 7.9 |
| Travel | nfldata airports.csv | team airport, ET offset | – | – | yes | – | free | no licence | DST error | – | likely | SECONDARY | 6.5 |
| Game weather | TJB WeatherData | game weather 2000–20, azimuth | no | 2000–2020 | yes | – | free | none (WU data) | mixed | frozen | no | AVOID | 5.4 |
| Game weather | NFLWeather.com | forecasts | yes | 2009 | site only | – | – | no derivatives | fair | – | no | AVOID | 5.3 |
| Stadiums | Wikidata | coords, capacity | – | – | yes | – | free | CC0 | coords ok, surface poor | edits | yes | SECONDARY | 7.5 |
| Stadiums | OSM Overpass | pitch polygons → azimuth | – | – | yes | – | free | ODbL | good | minutes | yes (share-alike) | PRIMARY (azimuth) | 6.8 |
| Geocoding | Nominatim | geocode | – | – | 1 req/s | – | free | ODbL | good | – | limited | SECONDARY | 6.2 |
| Stadiums | Wikipedia | facts, history | – | – | yes | – | free | CC BY-SA 4.0 | fair | – | yes (SA) | SECONDARY | 6.4 |
| Stadiums | Pro-Football-Reference | venue/game facts | – | 1920 | site only | $5k custom | – | no bots, no AI | very good | – | no | AVOID | 6.1 |
| Geocoding | Photon | geocode | – | – | throttled | – | free | OSM | fair | – | no | OPTIONAL | 5.8 |
| Geo APIs | Google Maps Platform | geocode, routes, TZ, tiles | – | – | 10k/SKU/mo | $5/1k | medium | 30-day cache | very good | – | yes | AVOID | 6.8 |
| Geo APIs | Mapbox | geocode, GL JS | – | – | 100k temp | $0.75–5/1k | medium | no caching (temp) | very good | – | yes | AVOID | 6.9 |
| Geocoding | HERE | geocode | – | – | 30k/mo | $0.88/1k | low | permanent excluded | good | – | yes | OPTIONAL | 6.6 |
| Geo APIs | TomTom | geocode, routing | – | – | 20k/mo | UNVERIFIED | low | UNVERIFIED | good | – | UNVERIFIED | OPTIONAL | 6.7 |
| Geocoding | Geoapify | geocode, routing | – | – | 3k credits/day | $59–609 | low | OSM + attribution | good | – | yes | OPTIONAL | 6.8 |
| Geocoding | LocationIQ | geocode | – | – | 5k/day | $45–950 | low | 48 h cache | good | – | limited | AVOID | 6.5 |
| Routing | OSRM demo | car routes | – | – | 1 req/s | – | free | non-comm. | good | – | no | AVOID | 5.7 |
| Routing | FOSSGIS/Valhalla | routes | – | – | 1 req/s | – | free | ODbL data | good | – | no | AVOID | 5.7 |
| Routing | openrouteservice | routes, matrix | – | – | 2,000/day | – | free | CC BY-SA 4.0 | good | – | yes | OPTIONAL | 6.7 |
| Elevation (US) | USGS EPQS | point elevation | – | – | yes | – | free | public domain | very good | – | yes | PRIMARY | 7.5 |
| Elevation | Open-Elevation | SRTM | – | – | 500 pts/mo | €5.99+ | low | GPL code | fair | – | yes | AVOID | 5.7 |
| Time zones | timezone-boundary-builder | zone polygons | – | releases | yes | – | free | ODbL | very good | monthly | yes (SA) | OPTIONAL | 7.8 |
| Time zones | TimeZoneDB | zone lookup | – | – | 1 req/s | $5/mo | low | NC free | good | – | paid | AVOID | 6.2 |
| Time zones | IANA tz + Intl | DST rules | – | 1970+ | yes | – | free | public domain | authoritative | – | yes | PRIMARY | 9.7 |
| Airports | OurAirports | airports, ICAO | – | – | yes | – | free | public domain | good | daily | yes | PRIMARY | 8.2 |
| Map tiles | OSM tile server | raster tiles | – | – | yes | – | free | ODbL, no heavy use | good | – | no | AVOID | 6.5 |
| Map tiles | Protomaps PMTiles | vector basemap | – | – | self-host | – | free | ODbL produced work | good | – | yes | SECONDARY | 7.8 |
| Map SDK | MapLibre GL JS | renderer | – | – | yes | – | free | BSD-3 | very good | – | yes | OPTIONAL | 8.5 |
| Map tiles | Stadia Maps | tiles | – | – | 200k credits NC | $20–250 | low | NC free | good | – | paid | OPTIONAL | 6.8 |
| Map tiles | MapTiler | tiles | – | – | 100k req NC | $30+ | low | NC free | good | – | paid | OPTIONAL | 6.7 |
| Boundaries | Natural Earth | vectors | – | – | yes | – | free | public domain | good | – | yes | PRIMARY | 8.2 |
| Boundaries | US Census CB | US boundaries | – | vintages | yes | – | free | US gov | very good | yearly | yes | SECONDARY | 7.8 |
| Flights | OpenSky | ADS-B | yes | yes | 400–4,000 credits/day | contact | – | research, NC | good | seconds | no | AVOID | 5.2 |
| Flights | ADS-B Exchange | ADS-B | yes | yes | – | $10/mo NC; enterprise | medium | NC | good | seconds | enterprise | AVOID | 5.2 |
| Algorithm | NOAA solar (Meeus) | sun position | – | 1901–2099 | yes | – | free | US gov | ±1 min | – | yes | PRIMARY | 8.9 |

## 4. Redundancy

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| Pre-game forecast at venue | Open-Meteo Forecast → NWS hourly (US) / Met Office DataHub (UK, key) → last-good cached forecast marked stale | Yes in the US; abroad only Open-Meteo without a key |
| Pre-game forecast, commercial product | NWS (US, public) + Open-Meteo paid → Visual Crossing → WeatherAPI.com | Yes (paid) |
| Weather alerts | NWS alerts → (none abroad) → show "no alert feed for this country" | **No backup**; no free alert feed for UK/EU/MX venues was verified |
| Observed game conditions (history) | nfldata temp/wind → IEM ASOS (nearest station) → NCEI ADS/GHCNh → Meteostat (model fill off) | Yes |
| Long-history weather where no obs | ERA5 via Open-Meteo → Meteostat → OpenWeather history (1979) | Yes |
| Leakage-free archived forecasts | Open-Meteo Previous Runs (2024+) → Single Runs (IFS 2024+) → own frozen snapshots (Nov 2026+) → betting total as proxy | **No backup before 2024** for free (NOAA model archives on cloud may exist — UNVERIFIED) |
| Per-game retractable roof status | nfldata `roof` (post-game) → ESPN venue `indoor` flag (venue-level, not per game) → unknown | **No real backup**, and nothing pre-game |
| Live lightning near stadium | GOES GLM (open, HDF5) → Xweather / Earth Networks (paid) → NWS severe-thunderstorm alerts (proxy) | Only paid or hard-to-parse |
| Radar overlay | IEM NEXRAD tiles (US) → NCEP opengeo WMS (US) → RainViewer (world, non-commercial) | US yes; world only RainViewer |
| Venue coordinates | Wikidata (CC0) → OSM (ODbL) → Nominatim lookup → manual from official site | Yes |
| Field azimuth | OSM pitch polygon → manual from aerial imagery → TJB WeatherData (reference only, no licence) | Weak (OSM only) |
| Roof type / surface by season | nfldata (per game) → Wikipedia (manual, cited) → official stadium site | Partly; nfldata has errors |
| Elevation | USGS EPQS (US) → Open-Meteo Elevation → Wikidata (empty today) | Yes |
| Time zone | stored IANA zone + Intl → Open-Meteo `timezone=auto` → NWS `/points` timeZone (US) | Yes |
| Travel distance | haversine on stored coordinates (no API) → OurAirports airports | n/a (computed) |
| Maps | Natural Earth (in use) → US Census CB → Protomaps PMTiles extract | Yes |

## 5. Derived metrics

Notation: φ latitude, λ longitude (radians), R = 6,371.0088 km (mean Earth radius; 3,958.76 mi). All times UTC internally; kickoff `k` from nfldata `gameday`+`gametime` interpreted in America/New_York, then converted.

1. **Travel distance (great circle)** — RAW: origin and destination coordinates (team home airport or stadium; game venue) → CALC: `a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)`, `d = 2R·asin(√a)` → RESULT: km/mi per trip. Season travel = Σ over road and neutral games of (home→venue), plus venue→home if the next game is at home; a road trip of consecutive away games chains venue→venue only if the team is known not to return home (UNKNOWN; default assume return home, and label the assumption).
2. **Time-zone change** — RAW: IANA zone of home and venue, kickoff instant → CALC: `Δtz = offset(venue, k) − offset(home, k)` in hours using `Intl.DateTimeFormat(..., {timeZone, timeZoneName:'shortOffset'})` (handles DST and Arizona) → RESULT: signed hours (+ = travelled east). Do not use nfldata `airports.csv` fixed offsets.
3. **Body-clock kickoff time** — RAW: kickoff instant, team home zone → CALC: `bodyClock = local time of k in the team's home zone` (assume no acclimatisation; optionally `homeZone + min(daysOnSite, |Δtz|)·sign(Δtz)·1 h/day` if arrival day is known — usually UNKNOWN) → RESULT: e.g. a Pacific team at an 8:20 pm ET game plays at 5:20 pm body time; an Eastern team in a 4:25 pm PT game plays at 7:25 pm body time. Flag "late body-clock" when ≥ 20:00.
4. **Rest days and differential** — RAW: previous game date per team (nfldata; or `away_rest`/`home_rest` columns) → CALC: `rest = date(k) − date(previous game)` in days; `restDiff = rest_home − rest_away`; first game of season = NA (or 7 by convention, labelled) → RESULT: integer days; categories: short week (`rest ≤ 5`), normal (6–8), mini-bye (9–12), bye (≥ 13).
5. **Short week** — `rest ≤ 5` (Thursday after Sunday = 4; Saturday after Thursday etc.). Report both teams; "rest edge" only when one team is short and the other is not.
6. **Consecutive road games / road-trip length** — RAW: ordered schedule per team with `location` (Home/Neutral) → CALC: run length of consecutive games with venue ≠ team's home stadium (count neutral international as road unless designated home team is the team itself AND the venue is its own stadium) → RESULT: `roadStreak` at each game; and `daysAway` if travel days are known (UNKNOWN; do not infer).
7. **Altitude delta** — RAW: venue elevation, team home-venue elevation → CALC: `Δh = h_venue − h_home` (m) → RESULT: flag `|h_venue| ≥ 1,200 m` (Denver 1,588 m per Open-Meteo/USGS ~1,583 m; Mexico City 2,245 m). Kicking literature uses ≥ 4,000 ft (1,219 m).
8. **Wind components along the field** — RAW: wind speed `V`, direction `θ_w` (meteorological: direction the wind comes FROM, degrees true), field long-axis azimuth `α` (0–180, OSM) → CALC: `along = V·cos(θ_w − α)` (+ = wind blowing from the α end toward the α+180 end, i.e. a tailwind for the team attacking toward α+180), `cross = V·sin(θ_w − α)`, `|cross|` is the crosswind magnitude. Example (new Highmark, α = 348°): wind from 270° at 15 mph → along 3.1 mph, cross 14.7 mph (almost pure crosswind). Use gusts separately. Stadium bowls shelter the field: model values are free-stream at 10 m, so label "open-air wind at 10 m, not field-level".
9. **Sun glare risk** — RAW: venue φ, λ, kickoff and expected game window (k to k+3.25 h), field azimuth α, roof → CALC: NOAA/Meeus solar position: Julian day `JD`, `T = (JD − 2451545)/36525`; mean longitude `L0`, anomaly `M`, equation of centre `C`, apparent longitude `λ☉`, obliquity `ε`, declination `δ = asin(sin ε · sin λ☉)`, equation of time `EoT`; true solar time `TST = minutesUTC + EoT + 4·λ°`; hour angle `H = TST/4 − 180`; `cos Z = sin φ sin δ + cos φ cos δ cos H`; elevation `e = 90° − Z`; azimuth `A = atan2(sin H, cos H sin φ − tan δ cos φ) + 180°`. Glare flag when the roof is open, `0° < e ≤ 15°` and `|((A − α + 90) mod 180) − 90| ≤ 20°` (sun nearly in line with the field axis, so players facing one end look into it). Thresholds are judgment (no published evidence found). Example: new Highmark 2026-12-27 13:00 EST → e 23.2°, A 190.9°, 22.9° off-axis (no flag); 16:25 EST → e 2.7°, A 234.4°, 66° off-axis (low sun, mostly across the field).
10. **Roof/surface flags** — RAW: nfldata `roof`, `surface` per game; venue `roof` → CALC: `indoor = roof ∈ {dome, closed} or venue roof = fixed`; `retractableUnknown = venue roof = retractable and roof blank`; `turf = surface ∉ {grass, grass }` after trimming (nfldata has "grass " with a trailing space, 93 rows since 2020); `surfaceChange = surface differs from the venue's previous season` → RESULT: booleans; weather features apply only when `indoor = false`.
11. **Game-time weather summary** — RAW: hourly series → CALC: value at the hour nearest kickoff (the fabric already requires ≤ 2 h gap) plus the mean/max over k..k+3 h → RESULT: `tempF`, `windMph`, `gustMph`, `precipIn`, `snowIn` (Open-Meteo returns inches when `precipitation_unit=inch` — do not divide again), with `kind` and `issuedAt`.

## 6. Gaps

- **Archived pre-kickoff forecasts before 2024** are not freely available through Open-Meteo (Previous Runs from Jan 2024; GFS temperature from Mar 2021). NOAA NDFD/GFS cloud archives may cover earlier years but were not verified (search budget exhausted).
- **Per-game retractable roof status before kickoff**: no machine-readable source found.
- **Field-level wind** inside bowls: no source; all products are 10 m open-terrain values or airport reports.
- **Weather alerts outside the US**: none verified (Met Office warnings, Meteoalarm not researched this session).
- **Live lightning**: open data only as NetCDF-4/HDF5 (GOES GLM) — impractical without dependencies; usable live lightning APIs are paid (Xweather $0.006/access; Earth Networks contact sales).
- **Commercial weather**: Open-Meteo, RainViewer, Stadia/MapTiler free tiers, OpenSky are non-commercial; a commercial product must budget roughly US$29–99/month (Open-Meteo) or $35–150 (Visual Crossing) — figures from provider pages/posts as cited; re-check at checkout.
- **Avoid**: WeatherKit, Google Weather, AccuWeather, Tomorrow.io (storage bans conflict with committed snapshots); Pro-Football-Reference automation (no bots, no AI use); NFLWeather.com (no derivatives); ThompsonJamesBliss data (no licence, Weather Underground origin); team flight tracking (privacy programs, non-commercial terms, safety).
- **Effect sizes** (literature, from the helper; full text where noted):
  - **Circadian (West Coast teams at night)** — Smith et al. 2013, *Sleep*, doi:10.5665/sleep.3248 (full text): West Coast teams beat the spread by 5.26 ± 1.33 points in games after 8 pm ET, 1970–2011 (n = 106; daytime control +0.16). Roy & Forest 2018, *J Sleep Res*, doi:10.1111/jsr.12565: NFL westward-evening effect only a trend (P = 0.058). The largest published market effect, but small samples and no modern replication.
  - **Travel direction/distance** — Nichols 2014, *J Sports Econ*, doi:10.1177/1527002512440580: west-to-east visitors lose more often, with a diminishing distance effect; no out-of-sample betting profit (abstract only). nfelo (2020): about 0.4 points for 2,500 miles, not significant once division games were added. MLB (Song, Severini & Allada 2017, *PNAS*): eastward jet lag cost home teams 3.5 points of win %. Not NFL.
  - **Rest and byes** — Lopez & Bliss 2024, *Front Behav Econ*, doi:10.3389/frbhe.2024.1479832 (full text, 2002–2023):
    - bye before 2011: +2.21 points; after 2011: +0.31 (95% CI −1.01 to 1.64);
    - the market values the bye at +0.97 after 2011;
    - mini-bye: +0.48, not significant;
    - this agrees with the project's rejection of a rest adjustment.
  - **Thursday injuries** — Perez et al. 2020, *AJSM*; Baker et al. 2019: no increase on short rest.
  - **Altitude, weather and kicking** — Clark, Johnson & Stimpson 2013, MIT Sloan SAC (full text), 11,896 field-goal attempts in 2000–11:
    - altitude ≥4,000 ft adds about +0.69 log-odds;
    - cold (<50 °F) −0.34; precipitation −0.28; wind ≥10 mph −0.14;
    - Denver adds +9.6 points of make probability at 45 yards.
  - **Home-field advantage** — Benz, Bliss & Lopez 2024, arXiv:2401.16392: 1.73 points in 2023, a decline of about 0.03 points a year. Szabó & Pérez 2021 (preprint): 2020 games with no fans 46.5% home wins. Higgs & Stavness 2021, *Sci Rep*: no change beyond the existing trend.
  - **Wind and totals** — Borghesi 2008 (1984–2004, abstract): the totals market under-adjusted for weather. A Covers practitioner analysis (2010–25): unders 54–59% in wind of 16 mph or more (sample sizes not given). The project's own test: wind ≥15 mph gave 1.65 ± 0.87 points under the total (n = 216, "Not supported") — the same direction, but not significant.
  - **International games and post-international byes; sun glare** — no evidence found (searches not run; UNVERIFIED).

## 7. Contradictions & UNVERIFIED

**Contradictions with the project's documents and code**
1. `lib/fabric/adapters/public.js` converts snowfall with `/ 2.54` although the request sets `precipitation_unit: "inch"`; the API returns `hourly_units.snowfall = "inch"` (probed). Snow is shown ~2.54× too small, and light snow can round to 0 and miss the `snow` flag. (The registry's Open-Meteo row is otherwise correct.)
2. `shared/teams.json` Buffalo coordinates (42.7738, −78.787) are the old stadium's (Wikidata Ralph Wilson Stadium Q1475645: 42.77361, −78.78694); the new Highmark Stadium is Q16251517 at 42.77297, −78.79219 (~430 m west), and nfldata reports 2026 Bills home games there (stadium name "Highmark Stadium", same id `BUF00`). Weather impact negligible; azimuth/identity impact real.
3. `shared/teams.json` `neutralSites` lacks the 2026 venues MCG, Maracanã, Stade de France, Bernabéu and Allianz Arena (Wikipedia's NFL International Series list and nfldata agree on these nine 2026 games). `venueLatLon()` returns null for them, so those games got no Open-Meteo forecast; separately, nfldata labels MCG, Stade de France and Allianz Arena `dome`, which also marks them indoor in the fabric (wrong: open-air pitches; Stade de France and Allianz have roofs over the stands only — inference from common knowledge, not re-verified).
4. `docs/FEATURE_RESEARCH.md` §14 item 10 plans "travel from nfldata `airports.csv`": its fixed Eastern-relative offsets are wrong for Arizona during daylight time; use IANA zones.
5. Registry row for nflverse `nfldata` games says "1999 on" with weather — true, but temp/wind are missing for ~46% of 2022 outdoor games, ~21% of 2023 and ~61% of 2026 so far; 2025 international venues are wrong in the file.
6. The brief expected Meteostat bulk data under CC BY-NC; the current licence page says **CC BY 4.0**, commercial use allowed.
7. Open-Meteo pricing page: the plan table shows historical APIs on the free tier, while its FAQ and the 2023 post say they need Professional — inconsistent on the provider's own page.
8. Literature vs the project's backtest: consistent on rest (Lopez & Bliss find no post-2011 bye/rest edge); the project's wind-vs-total result (1.65 points under, about 1.9 SE) is directionally consistent with practitioner claims.
9. RainViewer's API page describes nowcast frames, but the live metadata returned 0 nowcast and 0 satellite frames.

**UNVERIFIED**
- Open-Meteo current list prices (Stripe widget not readable); whether a multi-location request counts as one call or one per location.
- Source and method of nfldata `temp`/`wind` (dictionary silent).
- NFL lightning-delay policy (commonly reported as clearing the field when lightning is within about 8 miles and resuming 30 minutes after the last strike) — the NFL operations page returned 404 and the search budget was exhausted; not verified.
- Whether any feed publishes retractable-roof decisions before kickoff.
- NOAA archive of GFS/NDFD forecasts pre-2024 for leakage-free backtests.
- Tomorrow.io free limits; Pirate Weather terms; Meteomatics free account; Xweather storage terms; TomTom paid prices; HERE storage terms; OpenSky terms page (403); ADS-B Exchange acquisition date; Earth Networks pricing.
- RainViewer date of free-API reductions.
- International venue coordinates used for the nearest-station check (typed from memory, marked in §2.I).
- Whether the claude.ai static host serves HTTP Range requests (needed for PMTiles).
- Copernicus/ECMWF licence text for ERA5 (only via Open-Meteo's licence list).

**Claim most at risk of being wrong:** the exact azimuth of the new Highmark field (167.6°/347.6°) — it comes from one OSM outline that includes run-off and may be approximate; and the nfldata surface "errors" for 2019–2020, which rest on inference.

## 8. Research log

All on 2026-11-25. UA "nfl-universe-research/1.0", no keys, no cookies.

**Repository (read-only):** `CLAUDE.md`; `docs/NFL_DATA_SOURCE_REGISTRY.md`; `docs/GITHUB_RESEARCH.md`; `docs/FEATURE_RESEARCH.md` (lines 160–244 and weather mentions); `shared/teams.json`; `lib/fabric/index.js` (grep); `lib/fabric/adapters/public.js` lines 134–175; `lib/fabric/adapters/nws.js` (grep); `scripts/evaluate.py` (grep); `docs/DECISIONS.md` (grep); `data/model_report.json` (narratives, rejected).

**GitHub (`gh api`):** `repos/nflverse/nfldata` (licence null, pushed 2026-11-25T22:45Z, 381 stars); `/contents/data` (listing); `/contents/data/airports.csv`; `/contents/DATASETS.md`; `/contents/README.md`; `repos/ThompsonJamesBliss/WeatherData` (+README, stadium_coordinates.csv).

**Downloads (single):** `raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv` (200, 2,192,463 B); `davidmegginson.github.io/ourairports-data/airports.csv` (200, 12.8 MB).

**Probes:**
- `api.open-meteo.com/v1/forecast` (Buffalo; units) — 200, snowfall unit "inch".
- `historical-forecast-api.open-meteo.com/v1/forecast` — 2016-01-03 (200, all null), 2021-01-03 (200), 2025-12-14 (200), 2025-09-07..2026-01-05 (200).
- `previous-runs-api.open-meteo.com/v1/forecast` — 200, previous_day1/2/3 columns.
- `archive-api.open-meteo.com/v1/archive` — 1960-01-03 ERA5 (200); 2025 season (200).
- `api.open-meteo.com/v1/elevation` (Denver, Buffalo) — 200.
- `api.open-meteo.com/v1/forecast` with 34 venues, `timezone=auto` — 200, 34 results.
- `api.weather.gov/points/42.7738,-78.787` — 200; `/gridpoints/BUF/39,42/forecast/hourly` — 200 (156 periods); `/gridpoints/BUF/39,42/stations?limit=5` — 200; `/stations/KBUF/observations/latest` — 200; `/stations/KBUF/observations?start=…` for 2026-10-01, 11-10, 11-15 (0 features) and 11-22 (11 features).
- `mesonet.agron.iastate.edu/cgi-bin/request/asos.py?station=BUF…2025-09-01..2026-01-06` — 200, 3,042 rows.
- `mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/5/8/11.png` — 200 PNG.
- `www.ncei.noaa.gov/access/services/data/v1?dataset=global-hourly&stations=72528014733…` — 200 CSV.
- `query.wikidata.org/sparql` (NFL teams → P115 venues) — 200, 43 rows; label query — 502; `wikidata.org/w/api.php?action=wbsearchentities&search=Highmark Stadium` — 200; `Special:EntityData/Q16251517.json` — 200.
- `overpass-api.de/api/interpreter` (pitches/stadiums within 700 m of 42.7730, −78.7900) — 200, 5 pitches.
- `nominatim.openstreetmap.org/search?q=Lambeau Field` — 200 (one request).
- `api.rainviewer.com/public/weather-maps.json` — 200 (13 past, 0 nowcast, 0 satellite).
- `noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/2026/329/22/` — 200.
- `opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?…GetCapabilities` — 200.
- `en.wikipedia.org/wiki/Lambeau_Field` (licence footer) — 200.

**Pages read (WebFetch/curl):** open-meteo.com/en/docs/historical-forecast-api; /en/docs/previous-runs-api; /en/docs/single-runs-api; /en/pricing (+ raw HTML grep); /en/terms; /en/licence; /en/docs/historical-weather-api; /en/docs (raw grep for multi-location); openmeteo.substack.com/p/api-subscriptions-for-commercial; weather.gov/documentation/services-web-api; ncei.noaa.gov/support/access-data-service-api-user-documentation; ncdc.noaa.gov/cdo-web/webservices/v2; ncei.noaa.gov/products/land-based-station/integrated-surface-database; ncei.noaa.gov/products/global-historical-climatology-network-hourly; mesonet.agron.iastate.edu/disclaimer.php; mesonet.agron.iastate.edu/request/download.phtml; dev.meteostat.net/license; rainviewer.com/api.html (+ raw grep); blitzortung.org/en/cover_your_area.php; registry.opendata.aws/noaa-goes/; operations.nfl.com/the-rules/nfl-video-rulebook/inclement-weather/ (404); en.wikipedia.org/wiki/NFL_International_Series (first 100k chars); gml.noaa.gov/grad/solcalc/calcdetails.html; openstreetmap.org/copyright; nflweather.com; nflweather.com/terms_of_use; sports-reference.com/termsofuse.html; sports-reference.com/data_use.html; earthnetworks.com.

**Web searches (this track):** "Open-Meteo API Standard Professional plan price per month euro" (extended) — found the 2023 Substack post; "NFL lightning delay policy 8 miles 30 minutes game operations" — refused, budget exhausted.

**Helper agents (same day; their full URL lists are in their reports and summarised here):**
- *Commercial weather APIs:* Visual Crossing (editions, pricing, terms, JS bundle); Tomorrow.io (weather-api, rate-limiting docs, ToS); OpenWeather (price, one-call-3/4, migration, history, FAQ, T&C of sale PDF); Weatherbit (pricing, terms); WeatherAPI.com (pricing, terms); Pirate Weather (site, docs, GitHub); Apple WeatherKit (get-started, attribution, DPLA Attachment 8); Google Weather API (overview, policies, billing, Service Terms §22); AccuWeather (developer site, FAQ, terms, brand guidelines); Meteomatics (API, pricing); Xweather (pricing, PAYG, legal, docs); Meteostat (license, terms, api, bulk, python, RapidAPI pricing); Met Office DataHub (pricing, FAQ); Bright Sky (site, OpenAPI, GitHub, DWD legal). 7 searches.
- *Geo/maps:* OSMF Nominatim and tile policies; Photon; Google pricing, March 2025 change, geocoding and time-zone policies; Mapbox geocoding docs and pricing; HERE pricing widget JSON; TomTom pricing; Geoapify pricing and terms; LocationIQ pricing; OSRM demo wiki; routing.openstreetmap.de; HeiGIT plans/ToS; USGS EPQS docs and copyright; Open-Elevation; timezone-boundary-builder (gh); TimeZoneDB; IANA tz-link; Node 18 Intl; OurAirports mirror (gh); Protomaps docs; MapLibre (gh); Mapbox GL JS licence; Stadia Maps; MapTiler; Natural Earth terms; Census cartographic boundary and citation pages; 17 U.S.C. §105; FAA LADD and PIA; ADS-B Exchange data products/developer hub; JETNET; OpenSky API docs (terms 403). 3 searches; EPQS and Open-Elevation probed once each.
- *Literature:* PMC3825451 (Smith 2013); PMC5307448 (Song 2017); Frontiers frbhe.2024.1479832 (Lopez & Bliss); Frontiers fphys.2022.892681 (Leota); SSAC "Going for Three" PDF; arXiv 1701.05976, 2104.11595, 2401.16392; PMC8282683 (Higgs & Stavness); nfeloapp.com HFA analysis; PFF HFA article; Covers wind article; SI 2012; UF 2004 press release; The Upside; IDEAS/RePEc abstracts (Nichols 2014, Borghesi 2007/2008, Coleman 2017, Nutting 2010, Nutting & Price 2017, Vergin & Sosik 1999); Europe PMC records. 15 searches; several 403/404 listed in its report.
