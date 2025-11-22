# Photos folder

Add your images to this folder and list them in `manifest.json`.

Manifest format options:

1. Simple list of filenames:

```
[
  "IMG_0001.jpg",
  "IMG_0002.jpg"
]
```

2. Objects with thumbs/full and optional captions, srcset/sizes:

```
[
  { "thumb": "thumbs/IMG_0001.jpg", "full": "large/IMG_0001.jpg", "caption": "Sunset at the bay" },
  { "src": "IMG_0002.jpg", "caption": "Downtown night", "srcset": [
      { "src": "scaled/IMG_0002_400.jpg", "w": 400 },
      { "src": "scaled/IMG_0002_800.jpg", "w": 800 },
      { "src": "scaled/IMG_0002_1600.jpg", "w": 1600 }
    ],
    "sizes": "(min-width: 1024px) 25vw, (min-width: 600px) 33vw, 100vw"
  }
]
```

Relative paths are resolved to this folder. External URLs are also supported by using full `http(s)` links.

Recommended folder structure (optional):

```
photos/
  thumbs/   # ~400px longest edge
  large/    # ~1600px longest edge
  scaled/   # alternate sizes for srcset (400/800/1600)
```

Quick macOS resize commands (uses `sips`):

Create thumbs (~400px) and large (~1600px) for JPG files:

```
mkdir -p thumbs large
for f in *.jpg *.jpeg; do
  [ -f "$f" ] || continue
  sips -s format jpeg -s formatOptions 80 -Z 400  "$f" --out "thumbs/$f"
  sips -s format jpeg -s formatOptions 80 -Z 1600 "$f" --out "large/$f"
done
```

Optionally generate multiple widths for srcset:

```
mkdir -p scaled
for f in *.jpg *.jpeg; do
  base="${f%.*}"
  ext="${f##*.}"
  sips -s format jpeg -s formatOptions 80 -Z 400  "$f" --out "scaled/${base}_400.$ext"
  sips -s format jpeg -s formatOptions 80 -Z 800  "$f" --out "scaled/${base}_800.$ext"
  sips -s format jpeg -s formatOptions 80 -Z 1600 "$f" --out "scaled/${base}_1600.$ext"
done
```

Tip: WebP/AVIF yield smaller files. Install `webp` via Homebrew and convert:

```
brew install webp
for f in large/*.jpg large/*.jpeg; do
  [ -f "$f" ] || continue
  cwebp -q 80 "$f" -o "${f%.*}.webp"
done
```
