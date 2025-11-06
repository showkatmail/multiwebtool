// Global variables
let currentImageData = null;
let originalImageData = null;
let selectedMergeImages = [];
let mergedImageData = null;
let currentTool = null;
let imageHistory = [];
let historyIndex = -1;
let zoomLevel = 1;
let recentFiles = [];
let batchImages = [];
let activeFilters = []; // New: To track filter stacking
let currentTheme = 'light';
let currentAccent = 'indigo'; // New: Default accent color

// Notepad-specific global variables
let notes = [];
let currentNoteId = null;
let noteSaveTimeout = null;
let NOTE_AUTOSAVE_DELAY = 1500;
let NOTE_VERSION_LIMIT = 10;

// Accent Color map for Tailwind/CSS variables
const ACCENT_COLORS = {
    indigo: { 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 900: '#252355', 100: '#e0e7ff', 50: '#f0f3ff' },
    teal: { 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 900: '#042f2e', 100: '#ccfbf1', 50: '#f0fffa' },
    rose: { 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 900: '#4c0519', 100: '#ffe4e6', 50: '#fff1f2' },
    yellow: { 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 900: '#451a03', 100: '#fef3c7', 50: '#fffbeb' },
    sky: { 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 900: '#072540', 100: '#e0f2fe', 50: '#f0f9ff' }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeTabs();
    initializeEditor();
    initializeImageTools();
    initializeSettings();
    loadRecentFiles();
    initializeKeyboardShortcuts();
    updateStorageInfo();
});

// --- Core Utility Functions ---

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    
    const typeClasses = {
        success: 'bg-green-500 text-white shadow-lg shadow-green-500/50',
        error: 'bg-red-500 text-white shadow-lg shadow-red-500/50',
        info: `bg-accent-600 text-white shadow-lg shadow-accent-500/50` // Use accent color
    };
    const iconClasses = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    notification.className = `mb-2 px-6 py-3 rounded-xl flex items-center space-x-3 transform transition-all duration-300 translate-x-full ${typeClasses[type] || typeClasses.info} animate-slide-up`;
    notification.innerHTML = `<i class="${iconClasses[type] || iconClasses.info}"></i> <span>${message}</span>`;
    
    container.prepend(notification); // Prepend to show newest on top
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 10);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        notification.classList.remove('opacity-100');
        notification.classList.add('opacity-0');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// --- Theme Management (Enhanced) ---

function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const accentPicker = document.getElementById('accent-color-picker');

    // Load saved theme/accent preference
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const savedAccent = localStorage.getItem('accent') || 'indigo';

    setAccentColor(savedAccent);
    setTheme(savedTheme);
    
    // Listeners
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleTheme);
    
    if (accentPicker) {
        accentPicker.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => setAccentColor(option.getAttribute('data-color')));
        });
    }
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    const html = document.documentElement;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (theme === 'dark') {
        html.classList.add('dark');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        html.classList.remove('dark');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
}

function setAccentColor(color) {
    currentAccent = color;
    localStorage.setItem('accent', color);

    const colors = ACCENT_COLORS[color];
    const root = document.documentElement;
    const accentPicker = document.getElementById('accent-color-picker');

    // Update CSS variables
    for (const [shade, hex] of Object.entries(colors)) {
        root.style.setProperty(`--color-accent-${shade}`, hex);
    }
    
    // Update active state in picker
    if (accentPicker) {
        accentPicker.querySelectorAll('.theme-option').forEach(option => {
            if (option.getAttribute('data-color') === color) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    showNotification(`Accent color set to ${color.charAt(0).toUpperCase() + color.slice(1)}`, 'info');
}

// --- Keyboard Shortcuts (Enhanced) ---

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const isCtrlCmd = e.ctrlKey || e.metaKey;
        const activeTabPanel = document.querySelector('.tab-panel:not(.hidden)');
        
        // General Shortcuts
        if (e.key === '?' && !isCtrlCmd) {
            e.preventDefault();
            toggleHelpModal();
            return;
        }
        
        if (isCtrlCmd) {
            switch(e.key) {
                case 'd': // Ctrl/Cmd + D for Dark Mode
                    e.preventDefault();
                    toggleTheme();
                    return;
                case 's': // Ctrl/Cmd + S for Save
                    e.preventDefault();
                    saveCurrentWork();
                    return;
                case '1': // Ctrl/Cmd + 1 for Notepad
                    e.preventDefault();
                    switchTab('notepad');
                    return;
                case '2': // Ctrl/Cmd + 2 for Image Tools
                    e.preventDefault();
                    switchTab('image-tools');
                    return;
                case '3': // Ctrl/Cmd + 3 for Settings
                    e.preventDefault();
                    switchTab('settings');
                    return;
                case 'k': // Ctrl/Cmd + K for Link in Notepad
                    if (activeTabPanel && activeTabPanel.id === 'notepad-tab') {
                        e.preventDefault();
                        const url = prompt('Enter URL:');
                        if (url) document.execCommand('createLink', false, url);
                    }
                    return;
            }
        }
        
        // Image Tools Shortcuts (Zoom/Reset)
        if (activeTabPanel && activeTabPanel.id === 'image-tools-tab' && isCtrlCmd) {
            switch(e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    if (currentImageData) zoomImage(1.2);
                    return;
                case '-':
                    e.preventDefault();
                    if (currentImageData) zoomImage(0.8);
                    return;
                case '0':
                    e.preventDefault();
                    if (currentImageData) resetZoom();
                    return;
                case 'r':
                    e.preventDefault();
                    if (currentImageData) resetImage();
                    return;
            }
        }
    });

    // Help Modal Search
    const searchInput = document.getElementById('shortcut-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('#shortcut-list > div > div').forEach(group => {
                group.querySelectorAll('.flex').forEach(shortcut => {
                    const text = shortcut.getAttribute('data-shortcut');
                    if (text && text.includes(searchTerm)) {
                        shortcut.classList.remove('hidden');
                    } else {
                        shortcut.classList.add('hidden');
                    }
                });
            });
        });
    }
}

function toggleHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if(helpModal) helpModal.classList.toggle('hidden');
}

function saveCurrentWork() {
    const activeTab = document.querySelector('.tab-btn.active-tab');
    if (!activeTab) return;
    
    const tabName = activeTab.getAttribute('data-tab');
    
    if (tabName === 'notepad') {
        saveNotesToLocal();
        showNotification('All notes have been saved.', 'success');
    } else if (tabName === 'image-tools' && currentImageData) {
        // Assume saving the final processed image if there is one
        showNotification('Current state saved (stub).', 'success');
    }
}

// --- Tab Management (Polished) ---

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.getAttribute('data-tab'));
        });
    });
}

function switchTab(targetTab) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(btn => {
        btn.classList.remove('active-tab', 'text-accent-600', 'border-accent-600', 'border-b-2');
        btn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:text-accent-600');
    });
    
    const targetButton = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    if (targetButton) {
        targetButton.classList.add('active-tab', 'text-accent-600', 'border-accent-600', 'border-b-2');
    }
    
    tabPanels.forEach(panel => {
        panel.classList.add('hidden');
    });
    
    const targetPanel = document.getElementById(`${targetTab}-tab`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('animate-fade-in');
    }
}

// --- Notepad Functions (Enhanced) ---

function initializeEditor() {
    const editor = document.getElementById('editor');
    if (!editor) {
        console.error("Editor element (#editor) not found. Cannot initialize Notepad.");
        return;
    }

    // Note Management
    loadNotesFromLocal(); 

    // Core Note Management Listeners (FIX for 'Cannot read properties of null')
    const newNoteBtn = document.getElementById('new-note-btn');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const noteSelector = document.getElementById('note-selector');

    if (newNoteBtn && deleteNoteBtn && noteSelector) {
        newNoteBtn.addEventListener('click', createNewNote);
        deleteNoteBtn.addEventListener('click', deleteCurrentNote);
        noteSelector.addEventListener('change', switchNote);
    } else {
        console.error("Notepad core management buttons/selector not found. Functionality reduced.");
    }
    
    // Editor Toolbar
    const editorButtons = document.querySelectorAll('.editor-btn');
    editorButtons.forEach(button => {
        button.addEventListener('mousedown', (e) => {
            e.preventDefault(); 
            const command = button.getAttribute('data-command');
            
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) document.execCommand(command, false, url);
            } else if (command === 'blockquote' || command === 'insertCodeBlock') {
                // Custom handler for block elements
                handleFormatBlock(command);
            } else {
                document.execCommand(command, false, null);
            }
            editor.focus();
            updateCurrentNoteContent(); // Immediate save on command
        });
    });

    const headingSelector = document.getElementById('heading-selector');
    const fontSizeSelect = document.getElementById('font-size');
    const fontFamilySelect = document.getElementById('font-family');
    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');

    if (headingSelector) headingSelector.addEventListener('change', () => {
        handleFormatBlock('heading', headingSelector.value);
        editor.focus();
    });

    if (fontSizeSelect) fontSizeSelect.addEventListener('change', () => {
        document.execCommand('fontSize', false, fontSizeSelect.value);
        editor.focus();
    });
    
    if (fontFamilySelect) fontFamilySelect.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamilySelect.value);
        editor.focus();
    });

    if (textColorInput) textColorInput.addEventListener('input', () => {
        document.execCommand('foreColor', false, textColorInput.value);
    });

    if (bgColorInput) bgColorInput.addEventListener('input', () => {
        document.execCommand('hiliteColor', false, bgColorInput.value);
    });

    // Editor Actions
    if (document.getElementById('clear-editor')) document.getElementById('clear-editor').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the content of this note?')) {
            editor.innerHTML = '';
            updateCurrentNoteContent(true); // Force save on clear
        }
    });
    
    if (document.getElementById('export-html')) document.getElementById('export-html').addEventListener('click', exportHtml);
    if (document.getElementById('export-md')) document.getElementById('export-md').addEventListener('click', exportMarkdown); // New
    if (document.getElementById('export-pdf')) document.getElementById('export-pdf').addEventListener('click', exportPdf);     // New
    if (document.getElementById('save-local')) document.getElementById('save-local').addEventListener('click', saveCurrentWork);
    if (document.getElementById('download-text')) document.getElementById('download-text').addEventListener('click', downloadText);

    // Auto-save & Live Stats on input
    editor.addEventListener('input', () => {
        updateLiveStats();
        updateCurrentNoteContent();
    });
}

function handleFormatBlock(command, value = null) {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && editor) {
        editor.focus();
        
        if (command === 'blockquote') {
            document.execCommand('formatBlock', false, 'blockquote');
        } else if (command === 'insertCodeBlock') {
            // Check if selected content is already inside a <pre>
            let currentBlock = selection.getRangeAt(0).startContainer.parentNode;
            while(currentBlock && currentBlock !== editor && currentBlock.tagName !== 'PRE') {
                currentBlock = currentBlock.parentNode;
            }

            if (currentBlock && currentBlock.tagName === 'PRE') {
                // If already in <pre>, remove the blockquote and pre tags (i.e. 'P')
                document.execCommand('formatBlock', false, 'p');
            } else {
                // Wrap selection in <pre><code>...</code></pre>
                const content = selection.toString() || 'Insert code here...';
                document.execCommand('insertHTML', false, `<pre><code>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
            }
        } else if (command === 'heading' && value) {
            document.execCommand('formatBlock', false, value);
        }
    }
}

function updateLiveStats() {
    const editor = document.getElementById('editor');
    if (!editor) return;

    const text = editor.innerText;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const characters = text.length;
    // Count paragraphs by splitting on double newlines and filtering out empty strings
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.length > 0) : [];
    
    const wordCount = document.getElementById('word-count-value');
    const charCount = document.getElementById('char-count-value');
    const paraCount = document.getElementById('paragraph-count-value');

    if (wordCount) wordCount.textContent = words.length;
    if (charCount) charCount.textContent = characters;
    if (paraCount) paraCount.textContent = paragraphs.length;
}

function updateCurrentNoteContent(forceSave = false) {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (!currentNote) return;

    // Clear previous timeout
    if (noteSaveTimeout) clearTimeout(noteSaveTimeout);

    // Set saving status icon
    const saveIcon = document.getElementById('save-status-icon');
    if (saveIcon) {
        saveIcon.className = 'fas fa-circle text-xs status-saving tooltip-right';
        saveIcon.title = 'Note Status: Saving...';
    }

    // Set new timeout for auto-save
    noteSaveTimeout = setTimeout(() => {
        const editorContent = document.getElementById('editor').innerHTML;
        
        // Save version history before updating content
        if (currentNote.content !== editorContent) {
            saveNoteVersion(currentNote);
        }
        
        currentNote.content = editorContent;
        saveNotesToLocal();

        // Set saved status icon
        if (saveIcon) {
            saveIcon.className = 'fas fa-circle text-xs status-saved tooltip-right';
            saveIcon.title = 'Note Status: Saved';
        }
    }, forceSave ? 10 : NOTE_AUTOSAVE_DELAY);
}

// --- Versioning (New Feature) ---

function saveNoteVersion(note) {
    if (!note.versions) note.versions = [];
    
    // Simple check to avoid saving identical versions too close together
    const lastVersion = note.versions[0];
    if (lastVersion && lastVersion.content === note.content) return;

    note.versions.unshift({
        timestamp: Date.now(),
        content: note.content
    });

    // Enforce version limit
    if (note.versions.length > NOTE_VERSION_LIMIT) {
        note.versions.pop();
    }
    
    renderVersionHistory();
}

function renderVersionHistory() {
    const historyContainer = document.getElementById('version-history');
    if (!historyContainer) return;

    historyContainer.innerHTML = '';
    const currentNote = notes.find(note => note.id === currentNoteId);

    if (!currentNote || !currentNote.versions || currentNote.versions.length === 0) {
        historyContainer.innerHTML = '<p class="text-gray-500 text-sm">No versions saved yet.</p>';
        return;
    }

    currentNote.versions.forEach((version, index) => {
        const time = new Date(version.timestamp).toLocaleTimeString();
        const date = new Date(version.timestamp).toLocaleDateString();
        const versionDiv = document.createElement('div');
        versionDiv.className = 'flex justify-between items-center text-xs p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors';
        versionDiv.innerHTML = `
            <span>Version ${currentNote.versions.length - index} <span class="font-bold">@ ${time}</span></span>
            <button class="text-accent-600 hover:text-accent-500 font-bold ml-2 transition-colors version-rollback-btn" data-index="${index}">
                Rollback
            </button>
        `;
        historyContainer.appendChild(versionDiv);
    });

    historyContainer.querySelectorAll('.version-rollback-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.closest('button').getAttribute('data-index'));
            rollbackToVersion(index);
        });
    });
}

function rollbackToVersion(index) {
    const currentNote = notes.find(note => note.id === currentNoteId);
    const editor = document.getElementById('editor');

    if (!currentNote || !currentNote.versions || !currentNote.versions[index] || !editor) return;

    if (confirm('Are you sure you want to rollback to this version? Your current changes will be saved as a new version.')) {
        // Save current state as a new version before rolling back
        saveNoteVersion(currentNote);

        const targetVersion = currentNote.versions[index];
        editor.innerHTML = targetVersion.content;
        updateCurrentNoteContent(true); // Force save the rolled-back content
        showNotification('Note rolled back successfully.', 'info');
        renderVersionHistory(); // Re-render to show the new version
    }
}

// --- Notepad Persistence & Selector ---

function loadNotesFromLocal() {
    const savedNotes = localStorage.getItem('multi-tool-notes-pro');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
        } catch (e) {
            notes = [];
        }
    }

    if (!notes || notes.length === 0) {
        const firstNote = {
            id: Date.now(),
            name: 'My First Note',
            content: 'Welcome to your new notepad! Create more notes using the "New" button.',
            versions: []
        };
        notes = [firstNote];
    }
    
    const lastActiveNoteId = parseInt(localStorage.getItem('last-active-note-id'));
    const lastActiveNote = notes.find(note => note.id === lastActiveNoteId);

    if (lastActiveNote) {
        currentNoteId = lastActiveNote.id;
    } else if (notes.length > 0) {
        currentNoteId = notes[0].id;
    }

    const currentNote = notes.find(note => note.id === currentNoteId);
    const editor = document.getElementById('editor');

    if (currentNote && editor) {
        editor.innerHTML = currentNote.content;
        updateLiveStats();
        renderVersionHistory();
    }
    saveNotesToLocal();
}

function saveNotesToLocal() {
    localStorage.setItem('multi-tool-notes-pro', JSON.stringify(notes));
    updateStorageInfo();
}

function renderNoteSelector() {
    const noteSelector = document.getElementById('note-selector');
    if (!noteSelector) return;

    noteSelector.innerHTML = '';
    notes.forEach(note => {
        const option = document.createElement('option');
        option.value = note.id;
        option.textContent = note.name;
        if (note.id === currentNoteId) {
            option.selected = true;
        }
        noteSelector.appendChild(option);
    });
}

function switchNote() {
    const noteSelector = document.getElementById('note-selector');
    const editor = document.getElementById('editor');

    if (!noteSelector || !editor) return;

    const selectedId = parseInt(noteSelector.value);
    const newNote = notes.find(note => note.id === selectedId);
    if (newNote) {
        currentNoteId = selectedId;
        editor.innerHTML = newNote.content;
        localStorage.setItem('last-active-note-id', currentNoteId);
        updateLiveStats();
        renderVersionHistory();
        const saveIcon = document.getElementById('save-status-icon');
        if (saveIcon) {
            saveIcon.className = 'fas fa-circle text-xs status-saved tooltip-right';
            saveIcon.title = 'Note Status: Saved';
        }
    }
}

function createNewNote() {
    const noteName = prompt('Enter a name for your new note:', `Note ${notes.length + 1}`);
    if (noteName && noteName.trim() !== '') {
        const newNote = {
            id: Date.now(),
            name: noteName.trim(),
            content: '',
            versions: []
        };
        notes.push(newNote);
        currentNoteId = newNote.id;
        localStorage.setItem('last-active-note-id', currentNoteId);
        
        const editor = document.getElementById('editor');
        if (editor) editor.innerHTML = '';
        
        renderNoteSelector();
        saveNotesToLocal();
        switchNote();
        showNotification('New note created.', 'success');
    }
}

function deleteCurrentNote() {
    if (notes.length <= 1) {
        showNotification('Cannot delete the last note.', 'error');
        return;
    }

    const currentNote = notes.find(note => note.id === currentNoteId);
    if (confirm(`Are you sure you want to delete "${currentNote.name}"? This action cannot be undone.`)) {
        notes = notes.filter(note => note.id !== currentNoteId);
        currentNoteId = notes[0].id; // Switch to the first note
        localStorage.setItem('last-active-note-id', currentNoteId);
        switchNote();
        renderNoteSelector();
        saveNotesToLocal();
        showNotification('Note deleted successfully', 'info');
    }
}

// --- Notepad Exporting (Enhanced) ---

function exportHtml() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const currentNote = notes.find(n => n.id === currentNoteId);
    
    const htmlContent = editor.innerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, `${currentNote ? currentNote.name : 'note'}.html`);
    showNotification('HTML exported successfully', 'success');
}

function downloadText() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const currentNote = notes.find(n => n.id === currentNoteId);

    const content = editor.innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, `${currentNote ? currentNote.name : 'note'}.txt`);
    showNotification('File downloaded successfully', 'success');
}

function exportMarkdown() {
    // *** Placeholder for client-side library like turndown.js ***
    const editor = document.getElementById('editor');
    if (!editor) return;
    const currentNote = notes.find(n => n.id === currentNoteId);

    const htmlContent = editor.innerHTML;
    // const markdownContent = turndown.turndown(htmlContent); 
    const markdownContent = 'Markdown Export: ' + htmlContent.replace(/<br>/g, '\n').replace(/<[^>]+>/g, ''); 
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    downloadBlob(blob, `${currentNote ? currentNote.name : 'note'}.md`);
    showNotification('Markdown exported successfully (using stub).', 'info');
}

function exportPdf() {
    // *** Placeholder for client-side library like jsPDF ***
    // const editorContent = document.getElementById('editor');
    // if (editorContent) jsPDF().html(editorContent, { callback: (doc) => doc.save('note.pdf') });
    showNotification('PDF export initiated (using jsPDF stub).', 'info');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Image Tools Functions (Expanded) ---

function initializeImageTools() {
    const toolButtons = document.querySelectorAll('.image-tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tool = button.getAttribute('data-tool');
            setTool(tool);
        });
    });
    
    // File Input & Drag/Drop
    const imageUpload = document.getElementById('image-upload');
    const dropZone = document.querySelector('label[for="image-upload"] div');

    if (imageUpload) imageUpload.addEventListener('change', handleImageUpload);
    
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('ring-4', 'ring-accent-500'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('ring-4', 'ring-accent-500'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('ring-4', 'ring-accent-500');
            handleImageUpload({ target: { files: e.dataTransfer.files } });
        });
    }
    
    // General Image Actions
    if (document.getElementById('zoom-in')) document.getElementById('zoom-in').addEventListener('click', () => currentImageData && zoomImage(1.2));
    if (document.getElementById('zoom-out')) document.getElementById('zoom-out').addEventListener('click', () => currentImageData && zoomImage(0.8));
    if (document.getElementById('zoom-fit')) document.getElementById('zoom-fit').addEventListener('click', () => currentImageData && resetZoom());
    if (document.getElementById('reset-image')) document.getElementById('reset-image').addEventListener('click', resetImage);
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    if (files.length > 1) {
        // Handle batch/merge scenario
        batchImages = Array.from(files);
        showNotification(`${files.length} images loaded for batch/merge. Select Batch Process or Image Merger.`, 'info');
    } else {
        // Handle single image scenario
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            // Set both current and original data on first load
            originalImageData = e.target.result;
            currentImageData = e.target.result;
            displayImage(currentImageData);
            resetZoom();
            addToRecentFiles(file.name, currentImageData ? currentImageData.length : 0);
        };
        reader.readAsDataURL(file);
    }
    // Clear the file input to allow uploading the same file again
    event.target.value = ''; 
}

function displayImage(dataURL) {
    const container = document.getElementById('image-preview-container');
    const resetBtn = document.getElementById('reset-image');
    const compareBtn = document.getElementById('compare-toggle');

    if (!container) return;
    
    container.innerHTML = `<img id="main-image-preview" src="${dataURL}" alt="Image Preview" style="transform: scale(${zoomLevel}); transition: none;" class="max-w-full max-h-full object-contain mx-auto">`;
    if (resetBtn) resetBtn.classList.remove('hidden');
    if (compareBtn) compareBtn.classList.remove('hidden');
}

function zoomImage(factor) {
    const preview = document.getElementById('main-image-preview');
    if (!preview) return;
    zoomLevel *= factor;
    preview.style.transform = `scale(${zoomLevel})`;
}

function resetZoom() {
    const preview = document.getElementById('main-image-preview');
    const container = document.getElementById('image-preview-container');
    if (!preview || !container) return;
    zoomLevel = 1;
    preview.style.transform = `scale(${zoomLevel})`;
    container.scrollTo(0, 0); // Reset scroll
}

function resetImage() {
    if (currentImageData && originalImageData) {
        currentImageData = originalImageData;
        displayImage(currentImageData);
        resetZoom();
        activeFilters = []; // Clear filter stack on reset
        renderToolControls(currentTool); // Re-render filter list
        showNotification('Image reset to original state.', 'info');
    }
}

// Stubs for new tools
function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.image-tool-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`.image-tool-btn[data-tool="${tool}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    renderToolControls(tool);
}

function renderToolControls(tool) {
    const controls = document.getElementById('tool-controls');
    if (!controls) return;
    
    controls.innerHTML = '';
    let html = '';

    if (!currentImageData && tool !== 'batch' && tool !== 'merge') {
        controls.innerHTML = `<p class="text-red-500">Please upload an image first.</p>`;
        return;
    }

    // Existing Tool Controls (Condensed)
    switch(tool) {
        case 'thumbnail':
            html = `
                <h3 class="font-bold text-lg mb-2 text-accent-600">Thumbnail Generator</h3>
                <label class="block mb-2">Width (px): <input type="number" id="thumb-width" value="100" class="control-input"></label>
                <label class="block mb-4">Height (px): <input type="number" id="thumb-height" value="100" class="control-input"></label>
                <label class="flex items-center mb-4"><input type="checkbox" id="thumb-crop" class="control-checkbox mr-2"> Crop to Fit</label>
                <button class="btn-primary w-full bg-accent-600 hover:bg-accent-700">Generate Thumbnail (Stub)</button>
            `;
            break;
        case 'filter':
            html = `
                <h3 class="font-bold text-lg mb-4 text-accent-600">Filters & Effects</h3>
                <div class="grid grid-cols-2 gap-3">
                    <button class="btn-secondary filter-apply-btn" data-filter="grayscale">Grayscale</button>
                    <button class="btn-secondary filter-apply-btn" data-filter="sepia">Sepia</button>
                    <button class="btn-secondary filter-apply-btn" data-filter="invert">Invert</button>
                    <button class="btn-secondary filter-apply-btn" data-filter="blur">Blur (New)</button>
                    <button class="btn-secondary filter-apply-btn" data-filter="brightness">Brightness</button>
                </div>
                <h4 class="font-bold mt-4 mb-2">Applied Filters (Stack)</h4>
                <div id="filter-stack" class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg min-h-[50px]">
                    ${activeFilters.map((f, i) => `<div class="flex justify-between items-center p-1 border-b dark:border-gray-600 text-sm"><span>${f.name}</span><button class="text-red-500 remove-filter-btn" data-index="${i}"><i class="fas fa-times"></i></button></div>`).join('') || '<p class="text-gray-500 text-xs">No filters applied.</p>'}
                </div>
                <button class="btn-primary w-full bg-green-600 hover:bg-green-700 mt-4">Apply & Download (Stub)</button>
            `;
            break;
        // ... (Other existing tools like resize, compress, convert, watermark, metadata, merge, batch remain similar stubs)
        // New Tools
        case 'crop-rotate':
            html = `
                <h3 class="font-bold text-lg mb-2 text-accent-600">Cropper & Rotator</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Interactive cropper overlay would appear on the image canvas.</p>
                <label class="block mb-2">Rotate Angle (deg): <input type="number" id="rotate-angle" value="0" class="control-input"></label>
                <button class="btn-primary w-full bg-accent-600 hover:bg-accent-700">Apply Crop/Rotation (Stub)</button>
            `;
            break;
        case 'exif-editor':
            html = `
                <h3 class="font-bold text-lg mb-2 text-accent-600">EXIF Metadata Editor</h3>
                <p class="text-sm text-red-500 dark:text-red-400 mb-4">Note: EXIF editing only works on JPEG files.</p>
                <div id="exif-data" class="space-y-2 text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <div class="flex justify-between"><span>Camera Model:</span><input type="text" value="Canon EOS R5 (Stub)" class="control-input w-2/3"></div>
                    <div class="flex justify-between"><span>Date Taken:</span><input type="text" value="2024:01:01 12:00:00" class="control-input w-2/3"></div>
                    <div class="flex justify-between"><span>Software:</span><input type="text" value="Photoshop (Stub)" class="control-input w-2/3"></div>
                </div>
                <button class="btn-primary w-full bg-accent-600 hover:bg-accent-700 mt-4">Save Changes (Stub)</button>
                <button class="btn-secondary w-full bg-red-600 hover:bg-red-700 mt-2">Strip All Metadata (Stub)</button>
            `;
            break;
        case 'color-palette':
            html = `
                <h3 class="font-bold text-lg mb-4 text-accent-600">Color Palette Extractor</h3>
                <div id="palette-result" class="grid grid-cols-5 gap-3">
                    <!-- Color swatches will be generated by JS stub -->
                    <div class="color-swatch-stub" style="background-color: #1a1a1a;">#1A1A1A</div>
                    <div class="color-swatch-stub" style="background-color: #554477;">#554477</div>
                    <div class="color-swatch-stub" style="background-color: #aa7744;">#AA7744</div>
                    <div class="color-swatch-stub" style="background-color: #bbbbbb;">#BBBBBB</div>
                    <div class="color-swatch-stub" style="background-color: #eeeeee;">#EEEEEE</div>
                </div>
                <button class="btn-primary w-full bg-accent-600 hover:bg-accent-700 mt-4">Run Extraction (Stub)</button>
            `;
            break;
        default:
            html = `<p class="text-gray-500 dark:text-gray-400">Controls for ${tool} tool (stub).</p>`;
            break;
    }

    controls.innerHTML = html;
    
    // Add listeners for filter stacking (Only if filter tool is active)
    if (tool === 'filter') {
        document.querySelectorAll('.filter-apply-btn').forEach(button => {
            button.addEventListener('click', () => {
                const filterName = button.getAttribute('data-filter');
                activeFilters.push({ name: filterName, value: 1 }); // Simple filter object
                showNotification(`${filterName} added to stack.`, 'info');
                renderToolControls('filter'); // Re-render to show new stack
            });
        });
        document.querySelectorAll('.remove-filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                const removed = activeFilters.splice(index, 1);
                showNotification(`${removed[0].name} removed from stack.`, 'info');
                renderToolControls('filter');
            });
        });
        // In a real app, 'Apply & Download' would use a canvas to process the image with all filters in activeFilters array.
    }
}

// --- Recent Files Management ---

function loadRecentFiles() {
    const savedRecents = localStorage.getItem('multi-tool-recents');
    if (savedRecents) {
        try {
            recentFiles = JSON.parse(savedRecents);
        } catch (e) {
            recentFiles = [];
        }
    }
    renderRecentFiles();
}

function addToRecentFiles(filename, size) {
    // Check if already exists to avoid duplicates
    const existingIndex = recentFiles.findIndex(f => f.name === filename);
    if (existingIndex > -1) {
        recentFiles.splice(existingIndex, 1);
    }
    
    // Add new file to the start
    recentFiles.unshift({
        name: filename,
        timestamp: Date.now(),
        size: size
    });
    
    // Keep list length reasonable
    if (recentFiles.length > 5) recentFiles.pop();
    
    localStorage.setItem('multi-tool-recents', JSON.stringify(recentFiles));
    renderRecentFiles();
}

function renderRecentFiles() {
    const container = document.getElementById('recent-files');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (recentFiles.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">No recent files.</p>';
        return;
    }

    recentFiles.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'flex justify-between items-center text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer';
        fileDiv.innerHTML = `
            <span class="truncate">${file.name}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">${formatFileSize(file.size)}</span>
        `;
        // In a real app, clicking this would re-load the image data URL from a cache
        container.appendChild(fileDiv);
    });
}

// --- Settings & Storage Functions (Enhanced) ---

function initializeSettings() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const clearStorageBtn = document.getElementById('clear-storage');

    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleTheme);
    
    if (clearStorageBtn) clearStorageBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear ALL local data? This action cannot be undone.')) {
            localStorage.clear();
            showNotification('All local data cleared', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateStorageInfo() {
    let totalSize = 0;
    let notesSize = 0;
    let recentsSize = 0;
    let settingsSize = 0;

    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            const size = (new Blob([localStorage[key]])).size;
            totalSize += size;
            
            if (key.startsWith('multi-tool-notes-pro')) {
                notesSize += size;
            } else if (key.startsWith('multi-tool-recents')) {
                recentsSize += size;
            } else {
                settingsSize += size;
            }
        }
    }

    // Update breakdown values (New Feature)
    const storageNotes = document.getElementById('storage-notes-value');
    const storageImage = document.getElementById('storage-image-value');
    const storageSettings = document.getElementById('storage-settings-value');
    const storageUsed = document.getElementById('storage-used');
    const storageBar = document.getElementById('storage-bar');

    if (storageNotes) storageNotes.textContent = formatFileSize(notesSize);
    if (storageImage) storageImage.textContent = formatFileSize(recentsSize);
    if (storageSettings) storageSettings.textContent = formatFileSize(settingsSize);

    // Update total bar
    if (storageUsed) storageUsed.textContent = formatFileSize(totalSize);
    const maxStorage = 5 * 1024 * 1024; // 5 MB soft limit
    const percentage = Math.min(100, (totalSize / maxStorage) * 100);
    
    if (storageBar) {
        storageBar.style.width = `${percentage}%`;
        
        // Show a warning if storage is high
        if (percentage > 80) {
            storageBar.classList.add('bg-red-500');
            showNotification('Warning: Local Storage usage is high.', 'error');
        } else {
            storageBar.classList.remove('bg-red-500');
            storageBar.style.backgroundColor = `var(--color-accent-600)`;
        }
    }
}
