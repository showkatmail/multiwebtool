````markdown
# Multi-Tool Web App (Enhanced)

A comprehensive, browser-based utility application for rich text editing and a powerful suite of image manipulation tools. This app runs entirely in your browser, and your work can be saved to your browser's local storage.

## ✨ Features

### 📝 **Rich Text Notepad**
- Full-featured WYSIWYG editor.
- Formatting: **Bold**, *Italic*, <u>Underline</u>, Strikethrough.
- Text alignment, lists, and indentation.
- Font family and size selection.
- Text and background color pickers.
- Hyperlink insertion and horizontal rules.
- Undo/Redo functionality.
- Document Statistics: Word, character, and paragraph count.
- **Data Persistence**: Automatically saves your notes to your browser's local storage.
- **Exporting**: Download your notes as a `.txt` or `.html` file.

### 🖼️ **Image Tools**
- **Thumbnail Generator**: Create fixed-size thumbnails from your images, with an optional crop-to-fit feature.
- **Image Resizer**: Resize images to specific dimensions while optionally maintaining the aspect ratio.
- **Image Compressor**: Reduce file size with adjustable quality settings.
- **Format Converter**: Convert images to JPEG, PNG, WebP, BMP, TIFF, and GIF.
- **Watermarker**: Add custom text watermarks with control over position, font size, color, and opacity.
- **Image Merger**: Combine multiple images horizontally or vertically with custom spacing and background color.
- **Filters & Effects**: Apply common filters like Grayscale, Sepia, Invert, Brightness, and more.
- **Metadata Viewer**: View basic image metadata like file name, size, and type.
- **Batch Processing**: Apply resizing, compression, conversion, or watermarking to multiple images at once.
- **Recent Files**: Quickly access your recently used images.

### ⚙️ **General Features**
- **Dark/Light Mode**: Switch between themes for your comfort.
- **Keyboard Shortcuts**: Efficiently perform actions with keyboard commands.
- **Local Storage Management**: View storage usage and clear all local data.
- **Responsive Design**: Works on both desktop and mobile devices.
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
-   **Tailwind CSS** (via CDN)
-   **Font Awesome** (for icons)
-   **Vanilla JavaScript** (ES6)
````