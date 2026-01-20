# Icon Creation Guide

The extension requires three icon files in the `assets/icons/` directory.

## Required Sizes

- `icon16.png` (16×16 pixels)
- `icon48.png` (48×48 pixels)
- `icon128.png` (128×128 pixels)

## Design Recommendations

### Visual Theme
- **Lightning bolt** (⚡) - Represents speed and power
- **Chart/Analytics** (📊) - Represents analysis
- **Combination** - Lightning bolt with data visualization

### Color Scheme
- **Primary**: #1D9BF0 (Twitter Blue)
- **Accent**: #FFFFFF (White) or #000000 (Black)
- **Background**: Transparent or white

### Style Guidelines
- Minimalist and clean
- Matches X/Twitter's design language
- Recognizable at small sizes
- Works in both light and dark modes

## Quick Creation Methods

### Method 1: Online Icon Generators

**Recommended Tools:**
- [Canva](https://canva.com) - Free, easy to use
- [Figma](https://figma.com) - Professional design tool
- [Flaticon](https://flaticon.com) - Download existing icons

**Steps:**
1. Create a 128×128px canvas
2. Add lightning bolt or chart graphic
3. Use Twitter blue (#1D9BF0)
4. Export as PNG
5. Resize to 48×48 and 16×16

### Method 2: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Create blue squares (temporary placeholder)
convert -size 16x16 xc:#1D9BF0 assets/icons/icon16.png
convert -size 48x48 xc:#1D9BF0 assets/icons/icon48.png
convert -size 128x128 xc:#1D9BF0 assets/icons/icon128.png
```

### Method 3: Using Figma (Professional)

1. Open Figma
2. Create 128×128 frame
3. Design your icon:
   ```
   - Add lightning bolt shape
   - Color: #1D9BF0
   - Add subtle shadow or glow
   ```
4. Export at:
   - 1x → 128×128
   - 0.375x → 48×48
   - 0.125x → 16×16

### Method 4: Use Emoji as Base

Quick and simple:

1. Take a screenshot of ⚡ emoji
2. Crop to square
3. Resize to required dimensions
4. Save as PNG

## Example Design

Here's a simple SVG you can convert:

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#1D9BF0"/>

  <!-- Lightning bolt -->
  <path d="M 70 20 L 45 70 L 60 70 L 55 108 L 85 58 L 70 58 Z"
        fill="#FFFFFF"/>
</svg>
```

Save this as `icon.svg` and convert to PNG using:
- Online tool: [CloudConvert](https://cloudconvert.com/svg-to-png)
- Or ImageMagick: `convert -background none icon.svg -resize 128x128 icon128.png`

## Testing Your Icons

After creating icons:

1. Place them in `assets/icons/`
2. Reload extension in Chrome
3. Check appearance in:
   - Extension toolbar
   - `chrome://extensions/` page
   - Extension popup

## Pro Tips

- **Test in both themes**: Light and dark mode
- **Use transparency**: Makes icons adaptable
- **Keep it simple**: Complex designs don't scale well
- **Add padding**: Leave ~10% margin around the graphic
- **Export at 2x**: Create at double size, then scale down for crisp edges

## Need Help?

Can't create icons? Options:

1. **Use placeholders**: Simple colored squares work for testing
2. **Hire designer**: Fiverr, Upwork (~$5-20)
3. **Ask community**: Post in design subreddits
4. **Use AI**: DALL-E, Midjourney can generate icon designs

## Current Status

⚠️ **Icons not included in repository**

You need to create and add them before using the extension.

**Quick Start:**
```bash
# Create placeholder icons (requires ImageMagick)
cd x-virality-extension
mkdir -p assets/icons
convert -size 16x16 xc:#1D9BF0 assets/icons/icon16.png
convert -size 48x48 xc:#1D9BF0 assets/icons/icon48.png
convert -size 128x128 xc:#1D9BF0 assets/icons/icon128.png
```

Or use any online PNG generator to create 16px, 48px, and 128px blue squares.
