# Multi-Tool Web App (Enhanced Pro)

A next-generation, browser-based utility application for professional-grade rich text editing and a powerful suite of image manipulation tools. This app runs entirely in your browser, ensuring **maximum privacy** and a **zero-latency** experience. Your work is saved locally to your browser's storage.

## ✨ Features

### 📝 **Rich Text Notepad (Pro)**
- **Full-featured WYSIWYG Editor**.
- **Advanced Formatting**: **Bold**, *Italic*, <u>Underline</u>, Strikethrough, **Code Blocks**, **Blockquotes**, and a **Headings (H1-H6) Selector**.
- Text alignment, lists, and indentation.
- Font family/size, and text/background color pickers.
- Hyperlink insertion and horizontal rules.
- Undo/Redo functionality.
- **Document Statistics**: Live-updating panel for Word, character, and paragraph count.
- **Data Persistence**: Automatically saves your notes to local storage.
- **Note Version History (New)**: Review and **Rollback** to previous auto-saved versions of your notes.
- **Enhanced Exporting**: Download your notes as a `.txt`, `.html`, **`.md` (Markdown)**, or **`.pdf`** file.

### 🖼️ **Image Tools (Pro)**
- **New Tool: Cropper & Rotator**: Interactivesly crop the image and rotate it by custom angles.
- **Thumbnail Generator**: Create fixed-size thumbnails with optional crop-to-fit.
- **Image Resizer**: Resize images while optionally maintaining the aspect ratio.
- **Image Compressor**: Reduce file size with adjustable quality settings.
- **Format Converter**: Convert images to JPEG, PNG, WebP, BMP, TIFF, and GIF.
- **Watermarker**: Add custom text or **Image Watermarks** with drag-and-drop positioning, font size, color, and opacity control.
- **Filter Stacking (New)**: Apply multiple filters (Grayscale, Sepia, Invert, Brightness, **Blur**, **Contrast**, etc.) non-destructively, manage them in a live stack, and reorder effects.
- **New Tool: EXIF Metadata Editor**: View, edit, or strip common EXIF data (e.g., camera model, date) from JPEG images.
- **New Tool: Color Palette Extractor**: Automatically extract the dominant color palette (HEX/RGB) from your image.
- **Metadata Viewer**: View file name, size, type, and current dimensions.
- **Batch Processing**: Apply resizing, compression, conversion, or watermarking to multiple images at once.
- **Recent Files**: Quickly access your recently used images.

### ⚙️ **General Features**
- **Dynamic Theming**: Switch between **Dark/Light Mode** and select a custom **Accent Color** (Indigo, Teal, Rose, etc.).
- **Keyboard Shortcuts**: Efficiently perform actions with keyboard commands (incl. new tab-switching shortcuts).
- **Local Storage Management**: Detailed breakdown of storage usage (Notes, Image Cache, Settings).
- **Responsive Design & Modern UI**: A polished, fluid, and component-rich interface.
- **No Server Needed**: Runs 100% on the client-side.

## 🚀 How to Deploy on GitHub Pages

You can host this application for free on GitHub Pages.

1.  **Create a new GitHub Repository.**
2.  **Upload Files**: Upload the `index.html`, the `css` folder, and the `js` folder to your new repository.
3.  **Enable GitHub Pages**:
    *   In your repository, go to `Settings` > `Pages`.
    *   Under the "Branch" section, select `main` (or `master`) as the source and `/root` as the folder.
    *   Click `Save`.
4.  **Done!** Your application will be live at `https://<your-username>.github.io/<your-repository-name>/` in a few minutes.

## 🛠️ Tech Stack
-   **HTML5**
-   **Tailwind CSS** (via CDN, heavily customized for a polished look)
-   **Font Awesome** (for icons)
-   **Vanilla JavaScript** (ES6+ for maximum performance)
-   *Client-side stubs for advanced features using hypothetical/placeholder libraries (e.g., `jsPDF`, `turndown.js`, `Cropper.js`).*
