# DOCX/EMF Converter

A powerful command-line tool to convert old DOC/DOCX files with EMF/WMF images to modern DOCX files with PNG images. This tool is essential for modernizing legacy documents that contain outdated image formats.

## Features

- 🔄 Convert EMF/WMF images to PNG within DOCX files
- 📄 Convert legacy DOC files to modern DOCX format
- 🚀 Batch processing with parallel conversion support
- 🎨 Customizable image conversion settings (DPI, quality, background)
- 📁 Directory traversal with recursive processing
- 🔍 Glob pattern matching for flexible file selection
- ✅ Dependency checking and installation guidance

## Prerequisites

### Required Dependencies

1. **ImageMagick** (for image conversion)
   ```bash
   # macOS
   brew install imagemagick

   # Ubuntu/Debian
   sudo apt-get install imagemagick

   # Windows
   # Download from https://imagemagick.org/script/download.php
   ```

### Recommended for Better EMF/WMF Support

For best EMF/WMF conversion results, install ONE of the following:

2. **LibreOffice** (best EMF/WMF support + DOC conversion)
   ```bash
   # macOS
   brew install --cask libreoffice

   # Ubuntu/Debian
   sudo apt-get install libreoffice

   # Windows
   # Download from https://www.libreoffice.org/download/download/
   ```

3. **Inkscape** (alternative EMF/WMF converter)
   ```bash
   # macOS
   brew install --cask inkscape

   # Ubuntu/Debian
   sudo apt-get install inkscape

   # Windows
   # Download from https://inkscape.org/release/
   ```

4. **libwmf** (improves WMF support in ImageMagick)
   ```bash
   # macOS
   brew install libwmf

   # Ubuntu/Debian
   sudo apt-get install libwmf-bin
   ```

### Quick Installation

Run the provided installation script:
```bash
./install-tools.sh
```

### Verify Installation

```bash
# Check dependencies
npm run convert -- check
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd converter

# Install Node.js dependencies
npm install

# Build the TypeScript code
npm run build
```

## Usage

### Basic Commands

#### Convert a Single File

```bash
# Convert a DOCX file with EMF/WMF images to PNG
npm run convert -- convert document.docx

# With options
npm run convert -- convert document.docx -o ./converted -v -q 90 -d 200
```

#### Convert a Directory

```bash
# Convert all DOCX files in a directory
npm run convert -- convert ./documents -o ./output

# Recursive conversion
npm run convert -- convert ./documents -r -o ./output

# Include DOC files
npm run convert -- convert ./documents --doc-to-docx -r
```

#### Batch Processing with Patterns

```bash
# Convert files matching a glob pattern
npm run convert -- batch "**/*.docx" -o ./output

# Parallel processing (4 workers)
npm run convert -- batch "**/*.docx" -p 4 -o ./output

# Include DOC files
npm run convert -- batch "**/*.{doc,docx}" --doc-to-docx -p 4
```

### Command Options

#### `convert` Command

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./output` |
| `-r, --recursive` | Process directories recursively | `false` |
| `-k, --keep-original` | Keep temporary files for debugging | `false` |
| `-v, --verbose` | Show detailed conversion logs | `false` |
| `-q, --quality <number>` | PNG quality (1-100) | `95` |
| `-d, --dpi <number>` | Image DPI for conversion | `150` |
| `-b, --background <color>` | Background color for transparent images | `white` |
| `--doc-to-docx` | Also convert DOC files to DOCX | `false` |

#### `batch` Command

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./output` |
| `-p, --parallel <number>` | Number of parallel conversions | `1` |
| `-v, --verbose` | Show detailed conversion logs | `false` |
| `--doc-to-docx` | Also convert DOC files to DOCX | `false` |

## Examples

### Example 1: Simple Conversion

Convert a single DOCX file with default settings:

```bash
npm run convert -- convert report.docx
```

Output: `./output/report_converted.docx`

### Example 2: High-Quality Conversion

Convert with high DPI and quality for print:

```bash
npm run convert -- convert presentation.docx -o ./print -q 100 -d 300
```

### Example 3: Batch Convert Legacy Documents

Convert all DOC and DOCX files in a folder structure:

```bash
npm run convert -- convert ./legacy-docs -r --doc-to-docx -o ./modernized
```

### Example 4: Parallel Batch Processing

Process hundreds of files efficiently:

```bash
npm run convert -- batch "archive/**/*.{doc,docx}" -p 8 --doc-to-docx -v
```

### Example 5: Custom Background for Transparent Images

Convert with a specific background color:

```bash
npm run convert -- convert diagram.docx -b "#f0f0f0" -q 90
```

## How It Works

1. **DOCX Extraction**: The tool extracts the DOCX file (which is a ZIP archive) to access its contents
2. **Image Detection**: Scans the `word/media` folder for EMF/WMF images
3. **Image Conversion**: Uses ImageMagick to convert EMF/WMF to PNG with specified settings
4. **Reference Updates**: Updates all XML files (document.xml, relationships, content types) to reference the new PNG files
5. **Repackaging**: Creates a new DOCX file with the converted images

## Supported Formats

### Input Formats
- **Documents**: DOC, DOCX
- **Images**: EMF, WMF (converted to PNG)

### Output Format
- Modern DOCX with PNG images

## Project Structure

```
converter/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── docx-converter.ts        # Main DOCX/EMF conversion logic
│   └── doc-to-docx-converter.ts # DOC to DOCX conversion
├── dist/                        # Compiled JavaScript
├── output/                      # Default output directory
├── temp/                        # Temporary files (auto-cleaned)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Build from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev -- convert test.docx
```

### Clean Build

```bash
# Remove build artifacts and temp files
npm run clean
```

## Troubleshooting

### ImageMagick Not Found

If you get "ImageMagick is not installed" error:

1. Verify installation:
   ```bash
   convert -version
   ```

2. On macOS, ensure ImageMagick is in PATH:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   ```

3. On Ubuntu, install with all codecs:
   ```bash
   sudo apt-get install imagemagick imagemagick-doc
   ```

### LibreOffice Not Found

For DOC conversion issues:

1. Verify installation:
   ```bash
   libreoffice --version
   ```

2. On macOS with Homebrew:
   ```bash
   brew reinstall --cask libreoffice
   ```

### Permission Errors

If you encounter permission errors:

```bash
# Make scripts executable
chmod +x node_modules/.bin/*

# Run with proper permissions
sudo npm run convert -- convert document.docx
```

### EMF/WMF Conversion Quality Issues

For better quality:

1. Increase DPI:
   ```bash
   npm run convert -- convert file.docx -d 300
   ```

2. Use maximum quality:
   ```bash
   npm run convert -- convert file.docx -q 100
   ```

3. Set appropriate background:
   ```bash
   npm run convert -- convert file.docx -b white
   ```

## Performance Tips

1. **Parallel Processing**: Use `-p` flag for batch operations
2. **SSD Storage**: Place temp and output directories on SSD
3. **Memory**: Ensure sufficient RAM for large documents
4. **File System**: Use local file system, not network drives

## Limitations

- Large files (>100MB) may take significant time
- Some complex EMF drawings may lose fidelity
- DOC conversion requires LibreOffice
- Batch processing memory usage scales with parallel count

### EMF/WMF Conversion Notes

EMF (Enhanced Metafile) and WMF (Windows Metafile) are legacy Windows vector formats that can be challenging to convert on non-Windows systems:

1. **Best Results**: Install LibreOffice for the most accurate EMF/WMF conversion
2. **Alternative**: Inkscape provides good EMF support but may need manual installation
3. **Fallback**: If conversion fails, the tool creates placeholder images to maintain document structure
4. **Quality**: Vector-to-raster conversion may lose some detail - adjust DPI settings for better quality

For critical documents with EMF/WMF images, consider:
- Using Windows with native EMF support
- Converting on a system with LibreOffice installed
- Manually replacing complex EMF images with high-quality exports

## License

MIT

## Contributing

Contributions are welcome! Please submit pull requests or issues on GitHub.

## Support

For issues or questions, please create an issue in the GitHub repository.