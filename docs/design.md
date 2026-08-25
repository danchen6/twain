# Visual Design Contract

## Identity

Twain should feel quick, crisp, warm, and quietly playful. The compact header centers the active daily date between the full Twain brand and paired Help/Share icons; the canonical subtitle remains in metadata rather than consuming play chrome. The interface borrows the clarity of newspaper-style daily puzzles without inheriting another product's identity. The board is the visual protagonist; surrounding UI should reduce cognitive load rather than compete with it.

## Visual language

- Warm off-white canvas and white elevated surfaces.
- The Twain mark is a near-black rounded square containing exactly two disjoint, round-capped strokes: a cyan horizontal cap and an orange vertical stem. Their visible junction gap makes a capital `T` without letting the strokes meet. Use the same SVG in the header and favicon so the mark remains crisp at small sizes.
- Near-black typography with separate numeric and alphabetic clue systems.
- The Number line uses round black `1, 2, 3…` clues and the Letter line uses square black `A, B, C…` clues, both with white type. Shape and sequence identify clues without color.
- Routes use one of several curated, high-contrast gradient pairs selected from the stage seed. Color identifies drawn routes and state accents.
- Clue type uses weight 600 and is at least 150% of its original compact size. Multi-glyph values use tighter tracking and a slightly smaller responsive size. Multi-digit Number clues receive a small leftward optical correction; single glyphs and Letter clues remain geometrically centered.
- The active line stays at full opacity while the inactive line is faded to 45%; both are full opacity on completion. Avoid continuous active-line animation.
- Routes use thick rounded caps and a restrained white underlay. Grid lines stay fine and neutral; walls are heavier and dark; the board has a square outer outline and no corner radius.
- Pill-shaped controls use compact labels with clear primary, secondary, disabled, and focus states.
- Help is a circular near-black control with a white `?`; Share remains a quiet icon action. If the platform cannot open its native share sheet, a compact **Share Twain** dialog presents selected, copyable text. Successful fallback copying earns a short near-black bottom toast instead of restoring a persistent status area. The daily timer always retains its stopwatch icon, including at phone widths.
- The softened orange of the current progress segment is the theme accent. The header date uses that exact accent at `1rem`, with tabular numerals, normal tracking, and no visible timezone suffix. Expressive serif type is reserved for modal and completion headings; gameplay copy remains system sans-serif.
- Motion is brief and functional. Completion earns one cheerful veil/panel/confetti entrance; gameplay state does not animate continuously. The burst uses a generous mix of large strips, dots, and short pieces with full-turn spins so the celebration reads clearly across the board instead of looking like subtle decoration. Each particle gets seeded variation in its perimeter origin, initial velocity, upward lift, downward gravity, horizontal drift, size, rotation, and delay. Its 0.42–0.56 second path samples a gravity-driven parabola rather than interpolating one straight line. Intermediate completion emits one wave from all eight perimeter directions; daily completion emits three different waves at the same speed. Respect `prefers-reduced-motion`.

CSS custom properties in `styles.css` are the executable token source. Change the tokens and this contract together when the visual language changes.

## Page anatomy

The hierarchy is:

1. Compact header with the full brand, today's date, Help, and Share.
2. One centered game card.
   - Top toolbar in fixed semantic order: daily timer, noninteractive dynamic progress, Clear.
   - Square board with an in-place completion overlay when applicable.
   - Undo and Hint.
3. Modal **How to play** and sharing-fallback dialogs outside the play layout.

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

- At 320px wide, the Twain wordmark remains next to its mark and no gameplay control, header icon, or clue may clip or overflow.
- The board stays square, has no horizontal scrolling, and is fully above the fold in fresh/paused play.
- Ultra's 10×10 grid must retain distinguishable single- and multi-glyph clues, walls, and drawable cells at 320px and 390px.
- The maintained matrix is 1440×1000, 768×1024, 390×844, and 320×800. Board width is capped by both card width and available small-viewport height.
- Double-tap zoom, long-press text selection, and the iOS callout are suppressed without declaring pinch zoom unavailable. `touch-action: none` applies only to board drawing.
- At wider viewports, whitespace may grow but the board remains capped at a comfortable scanning size. Text zoom must not make core controls unreachable.

## Visual acceptance

A rendered state is not acceptable merely because it builds. Visual QA judges hierarchy, route/grid/wall geometry, spacing rhythm, clue legibility/alignment, dynamic daily progress clarity, small-size logo legibility, header wordmark/actions, tutorial-dialog containment, narrow-width overflow, focus/disabled/error/hint/completion states, overlay containment and celebration motion, content coherence, and regressions against this contract and the prior clean capture in the same loop.
