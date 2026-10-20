"""Create a self-contained, offline-reviewable copy of the UI mockup."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent
html = (root / "index.html").read_text()
html = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    "<style>\n" + (root / "styles.css").read_text() + "\n</style>",
)
for name in ("data.js", "app.js"):
    source = (root / name).read_text().replace("</script", r"<\/script")
    html = html.replace(
        f'  <script src="{name}" defer></script>',
        "",  # Inline scripts execute after the page markup below.
    )
    html = html.replace("</body>", f"<script>\n{source}\n</script>\n</body>")
destination = root / "standalone.html"
destination.write_text(html)
print(f"Exported {destination.name} ({destination.stat().st_size:,} bytes)")

instructions = """AlfaCase interactive mockup

1. Extract this ZIP file.
2. Open index.html in a normal browser tab (Chrome, Edge, Firefox or Safari).
   Do not open it in a chat visualization or source-code/file preview.

The HTML includes all styles, scripts and synthetic data. No server, install,
Internet connection, API key or model is required. JavaScript must be enabled.

Company switching, the scenario calculator and the agent-logic view work in the
browser. Sources and AI traces are clearly labeled simulations. Nothing is sent
to a bank or external service. State is cleared on reload.
"""
bundle = root / "alfacase-mockup.zip"
with ZipFile(bundle, "w", compression=ZIP_DEFLATED) as archive:
    for name, content in (("index.html", html), ("README.txt", instructions)):
        entry = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, content)
print(f"Exported {bundle.name} ({bundle.stat().st_size:,} bytes)")
