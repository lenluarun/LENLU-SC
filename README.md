# LENLU SC — Cyber Assembly Grid

![LENLU SC Interface](IMGS/lenlu-sc-ui.png)

LENLU SC is a neon-console themed toolkit that converts DuckyScript-like command streams into SciTE-compatible AutoIt (`.au3`) assemblies while providing live linting, telemetry, and AI-assisted fixes.

--

## Quick Features (At a Glance)

- Live lint profiles: `STRICT`, `LAX`, `EXPERIMENTAL`.
- Compile pipeline: converts source to AutoIt and displays assembly in-panel.
- Export options: copy output, download compiled `.au3`, or export full session as a themed PDF.
- AI integration: auto-correct or explain issues using configurable model providers.

## The New Export Options

- **Download .AU3**: Downloads the contents of the `AUTOIT_ASSEMBLY.au3` panel as `assembly.au3` (plain text). Use the `DOWNLOAD .AU3` button in the top-right controls.
- **Download Session (PDF)**: Exports a single PDF containing three sections: `SOURCE_INGESTION.ds`, `AUTOIT_ASSEMBLY.au3`, and `DIAGNOSTIC_LOG`. The PDF preserves a dark, neon-green, monospace visual theme for consistent offline review.

Notes on security: PDF generation uses a client-side library (`html2pdf`) and runs entirely in the browser; no data is sent to a remote service during export.

## Usage

1. Open [index.html](index.html) in a modern browser.
2. Paste or type your DuckyScript-like commands into the `SOURCE_INGESTION.ds` panel.
3. Choose a lint profile from the `LINT PROFILE` dropdown.
4. Click `COMPILE PIPELINE` to generate the AutoIt assembly.
	- If critical flags appear you can still generate assembly without AI. Enable `Auto AI Fix on Compile` to have the editor attempt automatic corrections before final compilation.
5. Use `COPY ASSEMBLY` to copy to clipboard, `DOWNLOAD .AU3` to save the `.au3` file, or `DOWNLOAD SESSION (PDF)` to save the full session as PDF.

## Files to Know

- [index.html](index.html) — UI shell and controls.
- [style.css](style.css) — cyber grid theme and styles.
- [compiler.js](compiler.js) — linter, compile logic, AI stubs, and new download helpers (`downloadAu3()` and `downloadSessionPDF()`).

## Visual & Branding

The included image (`IMGS/lenlu-sc-ui.png`) is used above to illustrate the live interface. If you have a different export from your design tools, place it in the `IMGS/` folder and update the path in this README.

## Development & Notes

- The PDF generator depends on `html2pdf.bundle.min.js` which is loaded from CDN in `index.html`.
- Keep API keys out of client-side bundles for production — prefer a proxy server for model calls.

## What's Next

- I can (optionally) embed the exact CSS used for the PDF render, add CLI build scripts, or generate a production-ready static export workflow. Tell me which you'd like next.

--

Built with neon phosphor love. Maintain control. Assemble with precision.
