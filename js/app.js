// V3 - Major Enhancement Update
'use strict';

// --- GLOBAL VARIABLES ---
let currentImageData = null;
let originalImageData = null;
let currentTool = null;
let zoomLevel = 1;
let isMarkdown = false;
let notes = [];
let currentNoteId = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeTabs();
    initializeNotepad();
    initializeImageTools();
    initializeSettings();
    initializeKeyboardShortcuts();
    initializeUI();
});

function initializeUI() {
    // Dynamically insert shared UI components to avoid repetition in HTML
    const editorToolbarHTML = `
        <button class="editor-btn" data-command="bold" title="Bold"><i class="fas fa-bold"></i></button>
        <button class="editor-btn" data-command="italic" title="Italic"><i class="fas fa-italic"></i></button>
        <button class="editor-btn" data-command="underline" title="Underline"><i class="fas fa-underline"></i></button>
        <div class="separator"></div>
        <button class="editor-btn" data-command="justifyLeft" title="Align Left"><i class="fas fa-align-left"></i></button>
        <button class="editor-btn" data-command="justifyCenter" title="Align Center"><i class="fas fa-align-center"></i></button>
        <button class="editor-btn" data-command="justifyRight" title="Align Right"><i class="fas fa-align-right"></i></button>
        <div class="separator"></div>
        <button class="editor-btn" data-command="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
        <button class="editor-btn" data-command="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
        <div class="separator"></div>
        <button class="editor-btn" data-command="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
        <button class="editor-btn" data-command="removeFormat" title="Clear Formatting"><i class="fas fa-eraser"></i></button>
    `;
    document.getElementById('editor-toolbar').innerHTML = editorToolbarHTML;

    // Add common styles for editor buttons
    document.querySelectorAll('#editor-toolbar .editor-btn').forEach(btn => {
        btn.className = 'px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    });
    document.querySelectorAll('#editor-toolbar .separator').forEach(sep => {
        sep.className = 'border-l border-gray-300 dark:border-gray-600 mx-2';
    });

    // Add event listeners after creation
    document.querySelectorAll('.editor-btn').forEach(button => {
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const command = button.getAttribute('data-command');
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, null);
            }
        });
    });
}

// --- THEME MANAGEMENT ---
function initializeTheme() { /* Unchanged */ }
function setTheme(theme) { /* Unchanged */ }
function toggleTheme() { /* Unchanged */ }

// --- KEYBOARD & UI ---
function initializeKeyboardShortcuts() { /* Unchanged */ }
function toggleHelpModal() { /* Unchanged */ }
function showLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}
function showNotification(message, type = 'info') { /* Unchanged */ }
function initializeTabs() { /* Unchanged */ }

// --- NOTEPAD MODULE ---
function initializeNotepad() {
    loadNotesFromLocal();
    renderNoteSelector();
    
    document.getElementById('new-note-btn').addEventListener('click', createNewNote);
    document.getElementById('delete-note-btn').addEventListener('click', deleteCurrentNote);
    document.getElementById('note-selector').addEventListener('change', switchNote);
    document.getElementById('toggle-markdown-btn').addEventListener('click', toggleMarkdownView);

    document.getElementById('editor').addEventListener('input', updateCurrentNoteContent);
    document.getElementById('word-count').addEventListener('click', () => { /* ... */ });
    document.getElementById('export-html').addEventListener('click', () => { /* ... */ });
    document.getElementById('download-text').addEventListener('click', () => { /* ... */ });
}

function loadNotesFromLocal() {
    const savedNotes = localStorage.getItem('multi-tool-notes');
    if (savedNotes) try { notes = JSON.parse(savedNotes); } catch (e) { notes = []; }

    if (!notes || notes.length === 0) {
        const firstNote = { id: Date.now(), name: 'My First Note', content: '## Welcome! \n\nThis is your first note. You can write in **Markdown** or use the rich text editor.' };
        notes = [firstNote];
        saveNotesToLocal();
    }
    
    const lastId = parseInt(localStorage.getItem('last-active-note-id'));
    currentNoteId = notes.find(n => n.id === lastId)?.id || notes[0].id;
    
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) document.getElementById('editor').innerHTML = currentNote.content;
}

function saveNotesToLocal() {
    localStorage.setItem('multi-tool-notes', JSON.stringify(notes));
    updateStorageInfo();
}

function updateCurrentNoteContent() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote && !isMarkdown) {
        currentNote.content = document.getElementById('editor').innerHTML;
        saveNotesToLocal();
    }
}

function renderNoteSelector() { /* Unchanged */ }

function switchNote() {
    currentNoteId = parseInt(document.getElementById('note-selector').value);
    const newNote = notes.find(note => note.id === currentNoteId);
    if (newNote) {
        document.getElementById('editor').innerHTML = newNote.content;
        localStorage.setItem('last-active-note-id', currentNoteId);
        if (isMarkdown) toggleMarkdownView(true); // Refresh markdown view
    }
}

function createNewNote() { /* Unchanged */ }
function deleteCurrentNote() { /* Unchanged */ }

function toggleMarkdownView(forceUpdate = false) {
    if (!forceUpdate) isMarkdown = !isMarkdown;
    
    const editor = document.getElementById('editor');
    const preview = document.getElementById('markdown-preview');
    const toolbar = document.getElementById('editor-toolbar');

    if (isMarkdown) {
        preview.innerHTML = marked.parse(editor.innerHTML);
        hljs.highlightAllUnder(preview);
        editor.classList.add('hidden');
        preview.classList.remove('hidden');
        toolbar.classList.add('hidden');
    } else {
        editor.classList.remove('hidden');
        preview.classList.add('hidden');
        toolbar.classList.remove('hidden');
    }
}


// --- IMAGE TOOLS MODULE ---
function initializeImageTools() {
    // Centralized event listeners
}
function selectImageTool(tool) { /* Modified for new tools */ }
function handleImageUpload(e) { /* Unchanged */ }
function processImageFiles(files) { /* Unchanged */ }
function showImagePreview(imageData) { /* Modified for better info */ }
function applyChangesToImage(newDataUrl) {
    currentImageData.dataURL = newDataUrl;
    // You might want to update size here if you can calculate it
    showImagePreview(currentImageData);
    showNotification('Changes applied. You can now apply another tool or download.', 'success');
}

// ... All individual tool functions (resize, compress, etc.) need to be modified ...
// EXAMPLE MODIFICATION for resize tool:
function applyResize() {
    // ... (get width, height)
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        // ... (draw to canvas with new size)
        const resizedDataURL = canvas.toDataURL();
        applyChangesToImage(resizedDataURL); // Instead of downloading, apply the change
    };
    img.src = currentImageData.dataURL;
}

// NEW: Color Picker Tool
function initializeColorPickerTool() {
    // ...
}

// NEW: QR Code Generator Tool
function initializeQRCodeGeneratorTool() {
    // ...
}

// --- SETTINGS MODULE ---
function initializeSettings() {
    loadSettings();
    document.getElementById('dark-mode-toggle').addEventListener('change', toggleTheme);
    document.getElementById('clear-storage').addEventListener('click', () => { /* ... */ });
    
    // NEW: Save preferences
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('export-data-btn').addEventListener('click', exportAllData);
    document.getElementById('import-data-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', importAllData);
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('multi-tool-settings')) || {};
    // Apply settings to form fields
}

function saveSettings() {
    const settings = {
        // Read values from form fields
    };
    localStorage.setItem('multi-tool-settings', JSON.stringify(settings));
    showNotification('Settings saved!', 'success');
    // Apply settings immediately (e.g., update editor font)
}

function exportAllData() {
    const data = {
        notes: JSON.parse(localStorage.getItem('multi-tool-notes')),
        settings: JSON.parse(localStorage.getItem('multi-tool-settings')),
        // Add any other data you want to back up
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `multi-tool-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.notes) {
                localStorage.setItem('multi-tool-notes', JSON.stringify(data.notes));
            }
            if (data.settings) {
                localStorage.setItem('multi-tool-settings', JSON.stringify(data.settings));
            }
            showNotification('Data imported successfully! The app will now reload.', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (err) {
            showNotification('Error: Invalid backup file.', 'error');
        }
    };
    reader.readAsText(file);
}
