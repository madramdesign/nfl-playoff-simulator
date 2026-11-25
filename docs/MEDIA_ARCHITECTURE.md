# Media architecture (milestone M8)

What NFL Universe shows: official league and team video, and official NFL podcasts. Live game broadcasts are not available from any authorized free source, so games are never streamed here; each game card names its TV network.

## Sources (all public scope; verified Nov. 21, 2026)

| Source id | What | How it is read | Rules from the provider's terms |
|---|---|---|---|
| `youtube-official` | Latest uploads of the NFL channel and each team's official channel | Each channel's public feed, `https://www.youtube.com/feeds/videos.xml?channel_id=<id>`, every 30 minutes, a few requests at a time | Show only through YouTube's embeddable player or a link; no modification; no sold ads on pages whose main draw is YouTube content; some videos disable embedding or are age-restricted |
| `podcasts-nfl` | Latest episodes of the league's official podcasts (NFL Daily, Good Morning Football, NFL: The Insiders, NFL News Hub, The NFL Report, NFL Game Previews) | Each show's public RSS feed on Omny, every 6 hours (the feeds are large) | List episodes; play the feed's own audio file or link to the episode. Display terms for third parties are not stated, so nothing is downloaded or re-hosted |

Channel ids live in `shared/teams.json` (`youtube` on each team, `leagueChannels` for the NFL); all 32 teams have one. Each was checked against the channel's own feed (author must be the team's official name, with recent, team-produced uploads). YouTube web pages are never scraped. Because channel names are not unique on YouTube, each id records how strongly it is backed (`evidence`):

| Evidence | Teams | Meaning |
|---|---|---|
| `wikidata+feed` | BAL, BUF, CHI, DAL, DEN, HOU, JAX, KC, LV, LAR, NE, NO, PIT, SF, SEA, TEN, WAS | Id from Wikidata's YouTube channel property |
| `team-site` | LAC, ARI, DET, MIA, NYG | The team's own website links the id, or the handle that maps to it |
| `directory+feed` | ATL, CAR, CIN, CLE, GB, IND, MIN, NYJ, PHI, TB | Id from channel directories, confirmed only by the feed's name and content; worth a manual look from each team's website |

Philadelphia also posts press conferences on a second channel, "Eagles Press Conferences" (`UCvXmskEtQk46alHAPPHaAxw`); it is not wired because the team's website does not link it.

## Payload (`media` in `/api/universe`, optional; checked by `lib/contract.js`)

```
media: {
  channels: [{team|null, name, channelId, url, liveUrl}],
  videos:   [{id, videoId, channelId, channel, team|null, teams[], kind, title, published, url, embedUrl, thumb, source}],
  podcasts: [{id, show, title, published, url|null, audioUrl, durationSec|null, teams[], source}]
}
```
- `kind`: `press` (press conference, presser, media availability, "speak to the media", postgame), `highlights`, `preview`, `short` (YouTube Shorts), or `video`.
- `teams`: teams named in the title (headline matching from `lib/fabric/entities.js`), plus the channel's own team. Used to show videos in team and game panels.
- The validator accepts only `https` links on `www.youtube.com`, `www.youtube-nocookie.com` and `i.ytimg.com`, 11-character video ids and `UC…` channel ids, so no other address can reach a player, an image or a link.

## How the page plays media
- **Click to load.** A video shows its thumbnail and title; the player (an `iframe` from `www.youtube-nocookie.com`, YouTube's privacy-enhanced embed) loads only when the viewer clicks. No autoplay, except NFL TV below.
- **NFL TV (DEC-022).** One panel plays the teams' newest press sessions and the league's newest videos one after another, through YouTube's official IFrame Player API, loaded only when the panel plays. It starts by itself, muted, only on a wide screen with no reduced-motion or reduced-data request, when not turned off, and only while more than half of the player is on screen; a muted video that leaves the screen pauses. A video the player refuses on this site (the NFL blocks its own and its game footage on sites it has not approved; oEmbed cannot see that) is skipped, and codes 100, 101 and 150 are remembered in the browser. Teams post press conferences as live streams scheduled hours ahead; the feed shows those with no views (`upcoming`), the reel puts them last, and a live stream still not started after 12 seconds on screen is skipped for the visit. The player is never under 200 by 200 pixels. With nothing playable, links. Source `youtube-reel`; payload `media.reel` (at most 12 video ids, each among `media.videos`).
- **YouTube's terms.** Beside each YouTube player: "This page uses YouTube API Services", with links to YouTube's Terms of Service and Google's Privacy Policy.
- **Live.** Each channel has a "Live page ↗" link to its own live page (`https://www.youtube.com/channel/<id>/live`, new tab), where YouTube shows the stream if there is one. It is a link, not an embed: on Nov. 21, 2026 YouTube's `/embed/live_stream?channel=` player showed "This video is unavailable" even for a channel that streams around the clock, so an embedded live player could look broken while a channel was live. Knowing in advance whether a channel is live would need the YouTube Data API and a key (an owner decision), so the page never claims a channel is live.
- **Keyboard.** Keys pressed inside YouTube's player go to YouTube, not to the page, so Esc cannot close the dialog from there. The dialog has a Close player control and says to press Tab to leave the player first.
- **Confirmed in the browser (Nov. 21, 2026):** an official press conference (Packers, 25:46) loaded and started in the privacy-enhanced player inside the page; closing the dialog removed the player.
- **Referrer.** Embeds send `strict-origin-when-cross-origin`; YouTube refuses embeds with no referrer (error 153).
- **Fallback.** Every video and channel also has a plain "Watch on YouTube" link, used whenever an embed cannot play.
- **Hosts that block outside media.** claude.ai's artifact viewer, where the page is published, refuses images, players and audio from other sites. The browser reports each refusal as a `securitypolicyviolation` event; the first one naming a YouTube or podcast address (`isMediaBlock` in `src/universe/16-media.js`) switches the page to links: videos lose their thumbnails and open on YouTube in a new tab, episodes open on their episode page (or, with no page, their audio file), an open player is replaced by a note, and the panel says why. Checked on Nov. 21, 2026 in a local copy under an equivalent policy; the normal page is unchanged.
- **Podcasts.** An `audio` element with `preload="none"` and no referrer, pointing at the feed's own file, plus a link to the episode page. Audio is accepted only from the NFL's own Omny account (optionally behind the measurement redirects the feeds use: pdrl.fm, Podtrac, Claritas), and the page says that pressing play loads it from there. The same episode cross-posted to several shows is kept once, under the show it belongs to. A playing episode moves to a "Now playing" bar when the panel redraws, so refreshes never stop it.
- **Coverage.** Every channel keeps its newest 8 videos and 3 Shorts on the server, and 3 videos and 1 Short in the published snapshot, so a busy channel cannot push a quiet one out. Feed entries naming another channel are dropped.
- **Outages.** When a media source is down, the panel says so; it never shows an outage as "no videos".
- **Attribution.** Channel name on every video; "Video: YouTube" and the show name on every episode.

## Never
Download, proxy, re-host or modify video or audio; bypass sign-in, age gates, DRM or region limits; embed unofficial uploads of league content; present a channel as live without the player showing it.
