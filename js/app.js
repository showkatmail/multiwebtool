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
let activeFilters = [];
let currentTheme = 'light';

// Notepad-specific global variables
let notes = [];
let currentNoteId = null;

// =========================================================================
// --- CORE UTILITY FUNCTIONS (Defined/Hoisted to ensure availability) -----
// =========================================================================

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return; 
    
    const notification = document.createElement('div');
    notification.className = `mb-2 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;

    const typeClasses = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    const iconClasses = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    notification.className += ` ${typeClasses[type] || typeClasses.info}`;
    notification.innerHTML = `<i class="${iconClasses[type] || iconClasses.info}"></i> <span>${message}</span>`;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    }, 10);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 3000);
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

function toggleHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if(helpModal) helpModal.classList.toggle('hidden');
}

function saveCurrentWork() {
    const activeTab = document.querySelector('.tab-btn.border-indigo-600, .tab-btn.dark\\:border-indigo-400');
    if (!activeTab) return;
    
    const tabName = activeTab.getAttribute('data-tab');
    
    if (tabName === 'notepad') {
        saveNotesToLocal();
        showNotification('All notes have been saved.', 'success');
    } else if (tabName === 'image-tools' && currentImageData) {
        // NOTE: The original code passed currentImageData as the argument, but the logic 
        // for addToRecentFiles in the previous context was a stub. Using a simple placeholder.
        addToRecentFiles("Processed Image.png"); 
        showNotification('Image saved to recent files', 'success');
    }
}

function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleTheme);
}

function initializeKeyboardShortcuts() {
    const helpToggle = document.getElementById('help-toggle');
    const closeHelp = document.getElementById('close-help');

    if (helpToggle) helpToggle.addEventListener('click', toggleHelpModal);
    if (closeHelp) closeHelp.addEventListener('click', toggleHelpModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleHelpModal();
            return;
        }
        
        if (e.ctrlKey || e.metaKey) {
            const activeTabPanel = document.querySelector('.tab-panel:not(.hidden)');
            if (!activeTabPanel) return;
            
            switch(e.key) {
                case 'd':
                    e.preventDefault();
                    toggleTheme();
                    break;
                case 's':
                    e.preventDefault();
                    saveCurrentWork();
                    break;
                case '+':
                case '=':
                    if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) zoomImage(1.2);
                    }
                    break;
                case '-':
                     if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) zoomImage(0.8);
                    }
                    break;
                case '0':
                     if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) resetZoom();
                    }
                    break;
                case 'r':
                     if (activeTabPanel.id === 'image-tools-tab') {
                        e.preventDefault();
                        if (currentImageData) resetImage();
                    }
                    break;
            }
        }
    });
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => {
                btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
                btn.classList.add('text-gray-600', 'dark:text-gray-400');
            });
            
            button.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-b-2', 'border-indigo-600', 'dark:border-indigo-400');
            
            tabPanels.forEach(panel => {
                panel.classList.add('hidden');
            });
            
            const targetPanel = document.getElementById(`${targetTab}-tab`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        });
    });
}

function initializeEditor() {
    const editor = document.getElementById('editor');
    if (!editor) return; // Robustness Check

    loadNotesFromLocal();
    renderNoteSelector();
    
    const newNoteBtn = document.getElementById('new-note-btn');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const noteSelector = document.getElementById('note-selector');
    const clearEditorBtn = document.getElementById('clear-editor');
    const wordCountBtn = document.getElementById('word-count');
    const closeWordCountBtn = document.getElementById('close-word-count');
    const exportHtmlBtn = document.getElementById('export-html');
    const saveLocalBtn = document.getElementById('save-local');
    const downloadTextBtn = document.getElementById('download-text');

    if (newNoteBtn) newNoteBtn.addEventListener('click', createNewNote);
    if (deleteNoteBtn) deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    if (noteSelector) noteSelector.addEventListener('change', switchNote);

    const editorButtons = document.querySelectorAll('.editor-btn');
    editorButtons.forEach(button => {
        button.addEventListener('mousedown', (e) => {
            e.preventDefault(); 
            const command = button.getAttribute('data-command');
            
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) {
                     document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, null);
            }
        });
    });

    const fontSizeSelect = document.getElementById('font-size');
    const fontFamilySelect = document.getElementById('font-family');
    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');

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

    if (clearEditorBtn) clearEditorBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the content of this note?')) {
            editor.innerHTML = '';
            updateCurrentNoteContent();
        }
    });

    if (wordCountBtn) wordCountBtn.addEventListener('click', () => {
        updateWordCount();
        const modal = document.getElementById('word-count-modal');
        if (modal) modal.classList.remove('hidden');
    });

    if (closeWordCountBtn) closeWordCountBtn.addEventListener('click', () => {
        const modal = document.getElementById('word-count-modal');
        if (modal) modal.classList.add('hidden');
    });
    
    if (exportHtmlBtn) exportHtmlBtn.addEventListener('click', () => {
        const htmlContent = editor.innerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        downloadBlob(blob, `note-${currentNoteId}.html`);
        showNotification('HTML exported successfully', 'success');
    });
    
    if (saveLocalBtn) saveLocalBtn.addEventListener('click', saveCurrentWork);

    if (downloadTextBtn) downloadTextBtn.addEventListener('click', () => {
        const content = editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        downloadBlob(blob, `note-${currentNoteId}.txt`);
        showNotification('File downloaded successfully', 'success');
    });

    editor.addEventListener('input', updateCurrentNoteContent);
}

function loadNotesFromLocal() {
    const savedNotes = localStorage.getItem('multi-tool-notes');
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
            content: 'Welcome to your new notepad! Create more notes using the "New" button.'
        };
        notes = [firstNote];
        saveNotesToLocal();
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
    }
}

function saveNotesToLocal() {
    localStorage.setItem('multi-tool-notes', JSON.stringify(notes));
    updateStorageInfo();
}

function updateCurrentNoteContent() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    const editor = document.getElementById('editor');
    if (currentNote && editor) {
        currentNote.content = editor.innerHTML;
        saveNotesToLocal();
    }
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
    }
}

function createNewNote() {
    const noteName = prompt('Enter a name for your new note:', `Note ${notes.length + 1}`);
    if (noteName && noteName.trim() !== '') {
        const newNote = {
            id: Date.now(),
            name: noteName.trim(),
            content: ''
        };
        notes.push(newNote);
        currentNoteId = newNote.id;
        localStorage.setItem('last-active-note-id', currentNoteId);
        
        const editor = document.getElementById('editor');
        if (editor) editor.innerHTML = '';
        
        renderNoteSelector();
        saveNotesToLocal();
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
        currentNoteId = notes[0].id;
        localStorage.setItem('last-active-note-id', currentNoteId);
        switchNote();
        renderNoteSelector();
        saveNotesToLocal();
        showNotification('Note deleted successfully', 'info');
    }
}

function updateWordCount() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const text = editor.innerText;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, '').length;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.length > 0) : [];
    
    if (document.getElementById('word-count-value')) document.getElementById('word-count-value').textContent = words.length;
    if (document.getElementById('char-count-value')) document.getElementById('char-count-value').textContent = characters;
    if (document.getElementById('char-no-space-count-value')) document.getElementById('char-no-space-count-value').textContent = charactersNoSpace;
    if (document.getElementById('paragraph-count-value')) document.getElementById('paragraph-count-value').textContent = paragraphs.length;
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

// =========================================================================
// --- IMAGE TOOL FUNCTIONS (Missing functions from original context) ------
// =========================================================================

function initializeImageTools() {
    // Stub implementation to prevent ReferenceError
    console.log('Image Tools Initialized (Stub)');
    // In a full implementation, event listeners for image tools would go here.
}

function zoomImage(factor) {
    // Stub
    console.log(`Zooming by factor: ${factor}`);
    // In a full implementation, this would manipulate the image preview's CSS scale transform.
}

function resetZoom() {
    // Stub
    console.log('Resetting zoom');
    // In a full implementation, this would reset the image preview's scale to 1.
}

function resetImage() {
    // Stub
    console.log('Resetting image');
    // In
