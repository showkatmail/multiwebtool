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

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', toggleTheme);
    darkModeToggle.addEventListener('change', toggleTheme);
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

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
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
        addToRecentFiles(currentImageData);
        showNotification('Image saved to recent files', 'success');
    }
}

// Tab Management
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

// --- Notepad Functions ---

function initializeEditor() {
    const editor = document.getElementById('editor');
    
    // Note Management
    loadNotesFromLocal();
    renderNoteSelector();
    
    document.getElementById('new-note-btn').addEventListener('click', createNewNote);
    document.getElementById('delete-note-btn').addEventListener('click', deleteCurrentNote);
    document.getElementById('note-selector').addEventListener('change', switchNote);

    // Editor Toolbar
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

    fontSizeSelect.addEventListener('change', () => {
        document.execCommand('fontSize', false, fontSizeSelect.value);
        editor.focus();
    });
    
    fontFamilySelect.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamilySelect.value);
        editor.focus();
    });

    textColorInput.addEventListener('input', () => {
        document.execCommand('foreColor', false, textColorInput.value);
    });

    bgColorInput.addEventListener('input', () => {
        document.execCommand('hiliteColor', false, bgColorInput.value);
    });

    // Editor Actions
    document.getElementById('clear-editor').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the content of this note?')) {
            editor.innerHTML = '';
            updateCurrentNoteContent(); // Save the cleared content
        }
    });

    document.getElementById('word-count').addEventListener('click', () => {
        updateWordCount();
        document.getElementById('word-count-modal').classList.remove('hidden');
    });

    document.getElementById('close-word-count').addEventListener('click', () => {
        document.getElementById('word-count-modal').classList.add('hidden');
    });
    
    document.getElementById('export-html').addEventListener('click', () => {
        const htmlContent = editor.innerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        downloadBlob(blob, `note-${currentNoteId}.html`);
        showNotification('HTML exported successfully', 'success');
    });
    
    document.getElementById('save-local').addEventListener('click', saveCurrentWork);

    document.getElementById('download-text').addEventListener('click', () => {
        const content = editor.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        downloadBlob(blob, `note-${currentNoteId}.txt`);
        showNotification('File downloaded successfully', 'success');
    });

    // Auto-save on input
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
    if (currentNote) {
        document.getElementById('editor').innerHTML = currentNote.content;
    }
}

function saveNotesToLocal() {
    localStorage.setItem('multi-tool-notes', JSON.stringify(notes));
    updateStorageInfo();
}

function updateCurrentNoteContent() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        currentNote.content = document.getElementById('editor').innerHTML;
        saveNotesToLocal();
    }
}

function renderNoteSelector() {
    const noteSelector = document.getElementById('note-selector');
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
    const selectedId = parseInt(document.getElementById('note-selector').value);
    const newNote = notes.find(note => note.id === selectedId);
    if (newNote) {
        currentNoteId = selectedId;
        document.getElementById('editor').innerHTML = newNote.content;
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
        document.getElementById('editor').innerHTML = '';
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
        currentNoteId = notes[0].id; // Switch to the first note
        localStorage.setItem('last-active-note-id', currentNoteId);
        switchNote();
        renderNoteSelector();
        saveNotesToLocal();
        showNotification('Note deleted successfully', 'info');
    }
}

function updateWordCount() {
    const text = document.getElementById('editor').innerText;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, '').length;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.length > 0) : [];
    
    document.getElementById('word-count-value').textContent = words.length;
    document.getElementById('char-count-value').textContent = characters;
    document.getElementById('char-no-space-count-value').textContent = charactersNoSpace;
    document.getElementById('paragraph-count-value').textContent = paragraphs.length;
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

// All Image Tool Functions remain the same and are omitted for brevity...
// ...
// --- END OF IMAGE TOOL FUNCTIONS ---

// --- Settings & Utility Functions ---

function initializeSettings() {
    document.getElementById('dark-mode-toggle').addEventListener('change', toggleTheme);
    document.getElementById('clear-storage').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear ALL local data? This action cannot be undone.')) {
            localStorage.clear();
            showNotification('All local data cleared', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progress-bar');
    if(progressBar) progressBar.style.width = `${percentage}%`;
}

function updateStorageInfo() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += (new Blob([localStorage[key]])).size;
        }
    }
    document.getElementById('storage-used').textContent = formatFileSize(totalSize);
    const maxStorage = 5 * 1024 * 1024;
    const percentage = Math.min(100, (totalSize / maxStorage) * 100);
    document.getElementById('storage-bar').style.width = `${percentage}%`;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
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

// Help modal
document.getElementById('help-toggle').addEventListener('click', toggleHelpModal);
document.getElementById('close-help').addEventListener('click', toggleHelpModal);
