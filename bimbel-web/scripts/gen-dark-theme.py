"""Bangun src/styles/dark-theme.css dari token kelas warna yang benar-benar dipakai di src.

Jalankan ulang setelah menambah kelas warna baru:  python3 scripts/gen-dark-theme.py src
"""
import glob, re, sys

SRC = sys.argv[1]
OUT = f"{SRC}/styles/dark-theme.css"

tokens = set()
for f in glob.glob(f"{SRC}/**/*.jsx", recursive=True) + glob.glob(f"{SRC}/**/*.js", recursive=True):
    tokens.update(re.findall(r"[a-z:\-]*(?:bg|text|border|divide|ring|placeholder)-[a-z]+(?:-\d{2,3})?(?:/\d{1,3})?", open(f).read()))

def esc(t):
    return t.replace(":", "\\:").replace("/", "\\/")

# Warna aksen: rgb nilai -500 (untuk latar tembus) dan hex terang untuk teks
ACCENT = {
    "blue": ("59 130 246", "#93c5fd", "#60a5fa"), "indigo": ("99 102 241", "#a5b4fc", "#818cf8"),
    "purple": ("168 85 247", "#d8b4fe", "#c084fc"), "violet": ("139 92 246", "#c4b5fd", "#a78bfa"),
    "emerald": ("16 185 129", "#6ee7b7", "#34d399"), "green": ("34 197 94", "#86efac", "#4ade80"),
    "amber": ("245 158 11", "#fcd34d", "#fbbf24"), "yellow": ("234 179 8", "#fde047", "#facc15"),
    "orange": ("249 115 22", "#fdba74", "#fb923c"), "rose": ("244 63 94", "#fda4af", "#fb7185"),
    "red": ("239 68 68", "#fca5a5", "#f87171"), "pink": ("236 72 153", "#f9a8d4", "#f472b6"),
    "sky": ("14 165 233", "#7dd3fc", "#38bdf8"), "teal": ("20 184 166", "#5eead4", "#2dd4bf"),
    "cyan": ("6 182 212", "#67e8f9", "#22d3ee"), "lime": ("132 204 22", "#bef264", "#a3e635"),
    "fuchsia": ("217 70 239", "#f0abfc", "#e879f9"),
}
NEUTRAL = ("gray", "slate", "zinc", "neutral", "stone")

rules = []
def add(selector, decl):
    rules.append(f"{selector} {{ {decl} }}")

for t in sorted(tokens):
    variant, _, base = t.rpartition(":")
    if variant and variant not in ("hover", "group-hover", "focus"):
        continue
    pseudo = {"hover": ":hover", "focus": ":focus", "group-hover": ""}.get(variant, "")
    prefix = ".group:hover " if variant == "group-hover" else ""
    sel = f".dark {prefix}.{esc(t)}{pseudo}"

    m = re.fullmatch(r"(bg|text|border|divide|ring|placeholder)-([a-z]+)(?:-(\d+))?(?:/(\d+))?", base)
    if not m:
        continue
    kind, color, shade, alpha = m.group(1), m.group(2), int(m.group(3) or 0), m.group(4)

    if kind == "bg":
        if color == "white":
            add(sel, "background-color: var(--dk-surface);")
        elif color in NEUTRAL and shade in (50, 100):
            add(sel, f"background-color: var(--dk-surface-{2 if shade == 50 else 3});")
        elif color in NEUTRAL and shade == 200:
            add(sel, "background-color: var(--dk-surface-4);")
        elif color in ACCENT and shade in (50, 100):
            add(sel, f"background-color: rgb({ACCENT[color][0]} / {0.12 if shade == 50 else 0.2});")
    elif kind == "text":
        if color in NEUTRAL or color == "black":
            if color == "black" or shade >= 800:
                add(sel, "color: var(--dk-text-strong);")
            elif shade >= 600:
                add(sel, "color: var(--dk-text);")
            elif shade >= 400:
                add(sel, "color: var(--dk-text-muted);")
        elif color in ACCENT and shade >= 600:
            add(sel, f"color: {ACCENT[color][1] if shade >= 700 else ACCENT[color][2]};")
    elif kind in ("border", "divide"):
        prop = "border-color" if kind == "border" else "border-color"
        target = sel if kind == "border" else f"{sel} > :not(:last-child)"
        if color in NEUTRAL and shade <= 300:
            add(target, f"{prop}: var(--dk-border);")
        elif color in ACCENT and shade in (100, 200):
            add(target, f"{prop}: rgb({ACCENT[color][0]} / 0.35);")
    elif kind == "ring" and color in NEUTRAL and shade <= 300:
        add(sel, "--tw-ring-color: var(--dk-border);")

header = """/*
 * Tema gelap untuk area dashboard (Admin, Tentor, Orang Tua, Siswa).
 * Berkas ini DIBANGKITKAN dari token kelas warna yang dipakai di src
 * (scripts/gen-dark-theme.py): latar putih/abu, teks abu, border, dan badge berwarna
 * dipetakan ke palet gelap ketika <html class="dark">. Landing page memaksa tema terang.
 */
:root.dark {
  color-scheme: dark;
  --dk-bg: #0b1120;
  --dk-surface: #111827;
  --dk-surface-2: #172033;
  --dk-surface-3: #1f2937;
  --dk-surface-4: #2b3648;
  --dk-border: #273449;
  --dk-text-strong: #f3f4f6;
  --dk-text: #d1d5db;
  --dk-text-muted: #9ca3af;
}

/* Border bawaan (tanpa kelas warna) & latar dasar */
@layer base {
  .dark *, .dark ::after, .dark ::before, .dark ::backdrop { border-color: var(--dk-border); }
  .dark body { background-color: var(--dk-bg); color: var(--dk-text); }
}

/* Kolom isian tanpa kelas latar */
.dark input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), .dark select, .dark textarea {
  background-color: var(--dk-surface-2);
  color: var(--dk-text-strong);
}
.dark ::placeholder { color: #6b7280; }

"""

footer = """
/* Latar area konten layout dashboard (lebih gelap dari kartu) */
.dark .app-main, .dark .app-shell { background-color: var(--dk-bg); }
.dark .page-card { background-color: var(--dk-surface); }
"""

with open(OUT, "w") as fh:
    fh.write(header + "\n".join(rules) + "\n" + footer)
print(f"{len(rules)} aturan dari {len(tokens)} token -> {OUT}")
