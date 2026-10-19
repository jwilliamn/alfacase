"""Create a self-contained, offline-reviewable copy of the UI mockup."""
from pathlib import Path

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
