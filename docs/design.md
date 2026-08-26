# Visual Design Contract

## Identity

Twain should feel quick, crisp, warm, and quietly playful. The compact header centers the active localized daily identity (`#N | localized date`) between the full Twain brand and Help/Share/Language icons; the canonical subtitle remains in metadata rather than consuming play chrome. The interface borrows the clarity of newspaper-style daily puzzles without inheriting another product's identity. The board is the visual protagonist; surrounding UI should reduce cognitive load rather than compete with it.

## Visual language

- Warm off-white canvas and white elevated surfaces.
- The Twain mark is a near-black rounded square containing exactly two disjoint, round-capped strokes: a cyan horizontal cap and an orange vertical stem. Their visible junction gap makes a capital `T` without letting the strokes meet. Use the same SVG in the header and favicon so the mark remains crisp at small sizes. Install icons preserve that geometry on an opaque, full-bleed near-black field without baking in rounded corners; the operating system applies its own mask.
- Near-black typography with separate numeric and alphabetic clue systems.
- The Number line uses round black `1, 2, 3…` clues and the Letter line uses square black `A, B, C…` clues, both with white type. Shape and sequence identify clues without color.
- Routes use one of several curated, high-contrast gradient pairs selected from the stage seed. Color identifies drawn routes and state accents.
- Clue type uses weight 600 and is at least 150% of its original compact size. Multi-glyph values use tighter tracking and a slightly smaller responsive size. Multi-digit Number clues receive a small leftward optical correction; single glyphs and Letter clues remain geometrically centered.
- The active line stays at full opacity while the inactive line is faded to 45%; both are full opacity on completion. Avoid continuous active-line animation.
- Routes use thick rounded caps and a restrained white underlay. Grid lines stay fine and neutral; walls are heavier and dark; the board has a square outer outline and no corner radius.
- Pill-shaped controls use compact labels with clear primary, secondary, disabled, and focus states.
- Help is a circular near-black control with a white `?`; Share and the rightmost globe Language action remain quiet icon controls. Language opens a white anchored menu with a compact heading, one checked radio-style row, **Automatic** first, and seven locale autonyms. The menu aligns to the header's right inset, overlays rather than reflows the board, and remains within the viewport at 320px.
- Header Share opens a compact localized **Share Twain #N** dialog with one centered, pure black-on-white QR code, a four-module quiet zone, a short explanation, the canonical URL, and localized Copy action. The URL and button may stack only at the narrowest maintained width. Header copying briefly changes the button to its localized copied state because a page-level toast would sit behind the modal backdrop; finished-result fallback copying retains the short near-black bottom toast. The daily timer always retains its stopwatch icon, including at phone widths.
- An undecided analytics preference appears as one full-width white privacy bar fixed to the viewport bottom. It uses a small serif **Privacy & analytics** heading, concise muted explanation, underlined details action, and equally reachable Decline/Allow controls; it does not darken or block the board. Desktop keeps copy and actions on one horizontal bar. Phone layouts place actions beneath the copy and add page-bottom clearance so covered game controls remain reachable by scrolling.
- The Privacy details modal uses the same warm-white native-dialog language as Help and Share. Two quiet bordered information cards distinguish the broader consented Google Analytics collection from the limits of Twain's custom gameplay events, followed by the current choice and balanced actions. Help's small underlined **Privacy choices** entry is the persistent way back after the initial bar disappears; it does not add header weight.
- The softened orange of the current progress segment is the theme accent. The header identity uses near-black ink at `1rem`, with tabular numerals, normal tracking, a vertical-bar separator, and no visible year or timezone suffix. At widths up to 360px it uses `0.875rem` so the longest supported localized date cannot overlap the three header actions; brand, date, and action hit areas must remain disjoint. Expressive serif type is reserved for modal and completion headings; gameplay copy remains system sans-serif.
- Motion is brief and functional. Completion earns one cheerful veil/panel/confetti entrance; gameplay state does not animate continuously. The burst uses a generous mix of large strips, dots, and short pieces with full-turn spins so the celebration reads clearly across the board instead of looking like subtle decoration. Each particle gets seeded variation in its perimeter origin, initial velocity, upward lift, downward gravity, horizontal drift, size, rotation, and delay. Its 0.42–0.56 second path samples a gravity-driven parabola rather than interpolating one straight line. Intermediate completion emits one wave from all eight perimeter directions; daily completion emits three different waves at the same speed. Respect `prefers-reduced-motion`.

CSS custom properties in `styles.css` are the executable token source. Change the tokens and this contract together when the visual language changes.

## Social and install artwork

- The canonical social card is an opaque 1200×630 PNG with a versioned filename. Its App Store-style hierarchy leads with one large benefit/rule statement, uses a magnified real near-complete board crop as the product hero, and leaves generous warm negative space so it survives small feed previews. Both paths must be visible and independently in progress, with neither final clue reached and no completion overlay. The source board must predate the numbered public run or otherwise be unreachable as a playable daily puzzle, so evergreen artwork never becomes a solution spoiler.
- The fixed card headline is **Two paths. Every cell. Can you solve the grid?**, followed by **3–5 fresh challenges every day.** The direct question and daily value proposition stand on their own without a category capsule or printed site URL. The card contains no daily number, date, completed route, user result, or locale-specific state that could become stale or misrepresent gameplay. The board may communicate near-completion, but must not expose the fully solved state.
- A low-contrast warm paper background plus sparse neutral circle, square, dot, and orthogonal-line motifs provides atmosphere without competing with the real board. Large decorative colored paths are excluded because they can read as part of the board hero. The Twain mark, words, clue glyphs, and board remain exact SVG/text/real rendered UI.
- Apple touch and manifest icons use the cyan cap and orange stem on an opaque near-black full-bleed square. Both strokes remain inside the manifest maskable safe zone; the source has no transparency, pre-rendered gloss, shadow, or platform-specific corner radius.

## Page anatomy

The hierarchy is:

1. Compact header with the full brand, today's public Twain number and localized date, Help, Share, and rightmost Language.
2. One centered game card.
   - Top toolbar in fixed semantic order: daily timer, noninteractive dynamic progress, Clear.
   - Square board with an in-place completion overlay when applicable.
   - Undo and Hint.
3. Anchored Language menu, the initial bottom privacy bar, and modal localized **How to play**, Privacy details, header QR/link Share, and finished-result sharing-fallback dialogs outside the play layout.

There is no mode picker, difficulty picker, New/Replay action, visible line selector, occupancy panel, visible status area, visible progress copy, stage/grid/wall metadata, hero copy, inline rules panel, or footer. A visually hidden live announcer retains rule and action feedback without occupying layout. The puzzle must remain playable without opening the tutorial.

## Daily progress

- Three to five segments map left-to-right to that date's sampled and shuffled schedule.
- Completed stages are near-black, the current stage is orange, and future stages are neutral.
- The component is segments only: it has no visible count, difficulty, eyebrow, or secondary label. Its accessible progress value retains the complete stage context.
- The progress component communicates sequence but is never clickable. It must not imply an occupancy or per-line quota.
- The timer is visually quiet when paused and gains ink/orange emphasis only while running.

## Board states

- **Fresh:** clues and walls are immediately legible; no route is visible. Number starts active and Letter is faded.
- **Drawing:** routes cover grid seams but never obscure clues or walls; the active sequence remains full opacity.
- **Invalid:** board geometry remains still; the hidden live region identifies the rule while paths and timer policy are preserved.
- **Hint:** the canonical next step appears and divergent suffixes disappear without visually suggesting failure.
- **Stage complete:** both routes remain visible beneath a warm translucent board overlay, controls disable, the current progress segment completes, and a centered panel says **Nicely done!**, shows the cumulative Hint count, and offers **Next level**. It has no level/daily-complete kicker. One quick, gravity-driven perimeter confetti wave supplies the “tada” moment without changing layout.
- **Daily complete:** the final selected board remains visible beneath a **Well played!** overlay with completed time plus Hint count, a live `Come back in hh:mm:ss` countdown, and a Share action. The panel enters at normal speed while three separately generated, quick ballistic confetti waves arrive from all eight perimeter directions. Reload restores this state and replays the finale; no replay/new action appears.
- **Focus:** controls retain visible focus. The board adds no blue outer outline; active/inactive contrast preserves gameplay context.

## Responsive contract

- At 320px wide, the Twain wordmark remains next to its mark and no gameplay control, header icon, localized date, or clue may clip, overlap, or overflow. Portuguese is the maintained long-date stress case.
- The Language menu stays fully contained at every maintained viewport, presents all eight rows without horizontal clipping, and visually identifies Automatic or the explicit selection.
- The header Share dialog stays fully contained at every maintained viewport. Its QR remains square and dominant without crowding the heading; the visible URL permits native selection/long-press, and the URL/button stack at 320px rather than compressing either control.
- The privacy bar and details modal remain fully readable in every supported locale at all maintained widths. Banner actions share available width at 390px and stack at 320px; neither action clips, and scroll clearance keeps the underlying controls reachable. Once a choice is saved, the fresh board returns to its normal above-fold composition.
- The board stays square, has no horizontal scrolling, and is fully above the fold in fresh/paused play.
- Ultra's 10×10 grid must retain distinguishable single- and multi-glyph clues, walls, and drawable cells at 320px and 390px.
- The maintained matrix is 1440×1000, 768×1024, 390×844, and 320×800. Board width is capped by both card width and available small-viewport height.
- Double-tap zoom, long-press text selection, and the iOS callout are suppressed without declaring pinch zoom unavailable. `touch-action: none` applies only to board drawing.
- At wider viewports, whitespace may grow but the board remains capped at a comfortable scanning size. Text zoom must not make core controls unreachable.

## Visual acceptance

A rendered state is not acceptable merely because it builds. Visual QA judges hierarchy, route/grid/wall geometry, spacing rhythm, clue legibility/alignment, dynamic daily progress clarity, small-size logo legibility, header wordmark/date/action separation, Language-menu containment and selection, localized tutorial/privacy/QR-link dialog containment, privacy-bar readability/action parity/underlay reachability, QR contrast/quiet zone, selectable URL fit, narrow-width overflow, focus/disabled/error/hint/completion states, overlay containment and celebration motion, content coherence, and regressions against this contract and the prior clean capture in the same loop.
