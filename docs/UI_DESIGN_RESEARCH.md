# UI design research: AIclicks product as the reference

## Purpose

The interview feedback said to explore the reviewer's app with a well-known brand such as CNN and take inspiration from its UI. The reference intended here is the AIclicks product at <https://aiclicks.io>, not the public CNN.com news homepage.

## What could be inspected publicly

The authenticated app at <https://app.aiclicks.io> requires a signed-in workspace. No reviewer credentials were provided, so this review did not create a brand, trigger a live CNN analysis, or inspect private account data. Instead, the visual and product review used the publicly accessible AIclicks website, official product documentation, and publicly indexed product screenshots.

Official product documentation describes a metric-focused experience centered on visibility, share of voice, position and citations. It also identifies the key product areas for prompts, sources, competitors, recommendations, sentiment and content workflows. Public dashboard screenshots consistently show a persistent left navigation, a workspace/domain selector, clear active navigation, a compact toolbar for model and timeframe, metric/chart panels, and data tables for detailed inspection.

References:

- <https://aiclicks.io/>
- <https://docs.aiclicks.io/metrics-overview>
- <https://docs.aiclicks.io/features>
- <https://docs.aiclicks.io/quickstart>
- Publicly indexed dashboard screenshots: <https://www.goodfirms.co/software/aiclicks>
- Publicly indexed brand-rankings screenshot: <https://www.g2.com/products/aiclicks/reviews>
- Publicly indexed sources dashboard screenshot: <https://surferseo.com/blog/best-ai-seo-tools/>

## Design implications for this exercise

The previous iteration leaned on the visual language of an editorial news homepage: dark horizontal masthead, large lead headline, red accents, square modules and strongly editorial labels. That interpretation does not match the feedback reference as well as an analytics workspace would.

The updated implementation moves toward the AIclicks product's **general dashboard patterns**, without copying its branding or claiming features the exercise does not implement:

1. **Persistent app navigation:** a desktop sidebar groups the working dashboard sections, with a clear active state. On smaller screens the navigation becomes a compact horizontal row.
2. **Workspace and data context:** a workspace panel and explicit historical-sample notice make the current data context visible. The page does not pretend the fixture is live CNN data.
3. **Analytics-first hierarchy:** a restrained page title leads into filters, summary metrics, a trends chart, then the detailed records table. The chart and metrics are prominent without turning the page into a news article.
4. **SaaS visual language:** light slate background, white rounded panels, subtle borders/shadows, blue active/primary states, clear labels and consistent controls replace the previous red editorial style.
5. **Operational clarity:** empty/loading/error states remain visible, and the source dataset's date/time values are not presented as live data.
6. **Honest scope:** the exercise API supplies response counts, mention counts/rate, daily/weekly trends and records. The UI does not fabricate AIclicks-only metrics such as competitor share of voice, tracked brand visibility, source coverage, recommendations or live CNN rankings.

## Files changed

- `frontend/components/dashboard-header.tsx`: desktop sidebar, responsive mobile navigation, workspace label and demo-data context.
- `frontend/app/page.tsx`: analytics workspace layout and revised section order.
- `frontend/components/filter-bar.tsx`: compact filter panel with consistent controls and blue primary action.
- `frontend/components/summary-cards.tsx`: clearer metric cards and hierarchy.
- `frontend/components/trend-panel.tsx`: chart panel, compact daily/weekly control, updated series colors and chart treatment.
- `frontend/components/mentions-table.tsx`, `frontend/components/mention-row.tsx` and `frontend/components/ui-icons.tsx`: table headers, row density, statuses, sentiment/citation styling, and a small consistent inline-SVG icon set.
- `frontend/components/request-state.tsx` and `frontend/components/table-pagination.tsx`: consistent loading/error/empty and navigation states.
- `frontend/app/globals.css` and `frontend/app/layout.tsx`: light SaaS palette and updated metadata.

## Validation note

This was a source-level and public-reference design update. It must still pass `npm ci`, `npm run typecheck`, and `npm run build` in an environment with package registry access before deployment. After deployment, check desktop and mobile widths and the complete filter/table/chart interactions.
