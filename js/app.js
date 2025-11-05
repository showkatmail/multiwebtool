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
        darkModeToggle.checked = true;
    } else {
        html.classList.remove('dark');
        darkModeToggle.checked = false;
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
                    if (document.getElementById('image-tools-tab').classList.contains('hidden')) return;
                    e.preventDefault();
                    if (currentImageData) zoomImage(1.2);
                    break;
                case '-':
                    if (document.getElementById('image-tools-tab').classList.contains('hidden')) return;
                    e.preventDefault();
                    if (currentImageData) zoomImage(0.8);
                    break;
                case '0':
                    if (document.getElementById('image-tools-tab').classList.contains('hidden')) return;
                    e.preventDefault();
                    if (currentImageData) resetZoom();
                    break;
                case 'r':
                     if (document.getElementById('image-tools-tab').classList.contains('hidden')) return;
                    e.preventDefault();
                    if (currentImageData) resetImage();
                    break;
            }
        }
    });
}

function toggleHelpModal() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.toggle('hidden');
}

function saveCurrentWork() {
    const activeTab = document.querySelector('.tab-btn[data-tab].border-indigo-600');
    if (!activeTab) return;
    
    const tabName = activeTab.getAttribute('data-tab');
    
    if (tabName === 'notepad') {
        saveNotesToLocal();
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
        // *** DEFINITIVE FIX: Use mousedown + preventDefault to keep editor focused ***
        button.addEventListener('mousedown', (e) => {
            e.preventDefault(); // This stops the button from stealing focus from the editor.
            
            const command = button.getAttribute('data-command');
            
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url && document.getSelection().toString()) {
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
    
    document.getElementById('save-local').addEventListener('click', () => {
        saveNotesToLocal();
        showNotification('All notes saved locally', 'success');
    });

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
            currentNoteId = notes.length > 0 ? notes[0].id : null;
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
        currentNoteId = firstNote.id;
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

    if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
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
    const paragraphs = text.trim() ? text.trim().split(/\n\n+/).filter(p => p.length > 0) : [];
    
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

// --- Image Tool Functions (Omitted for brevity - No Changes Here) ---

function initializeImageTools() {
    const imageToolButtons = document.querySelectorAll('.image-tool-btn');
    const imageUpload = document.getElementById('image-upload');
    
    imageToolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tool = button.id.replace('-tool', '');
            selectImageTool(tool);
        });
    });
    
    imageUpload.addEventListener('change', handleImageUpload);
    
    const uploadLabel = imageUpload.closest('label');
    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.firstElementChild.classList.add('border-indigo-500', 'dark:border-indigo-400');
    });
    
    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.firstElementChild.classList.remove('border-indigo-500', 'dark:border-indigo-400');
    });
    
    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.firstElementChild.classList.remove('border-indigo-500', 'dark:border-indigo-400');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) processImageFiles(files);
    });
    
    document.getElementById('zoom-in').addEventListener('click', () => { if (currentImageData) zoomImage(1.2) });
    document.getElementById('zoom-out').addEventListener('click', () => { if (currentImageData) zoomImage(0.8) });
    document.getElementById('zoom-fit').addEventListener('click', () => { if (currentImageData) resetZoom() });
    document.getElementById('reset-image').addEventListener('click', resetImage);
    document.getElementById('compare-toggle').addEventListener('click', toggleComparison);
    
    initializeThumbnailTool();
    initializeResizeTool();
    initializeCompressTool();
    initializeConvertTool();
    initializeWatermarkTool();
    initializeFilterTool();
    initializeMetadataTool();
    initializeBatchTool();
}

function selectImageTool(tool) {
    currentTool = tool;
    
    document.querySelectorAll('.image-tool-panel').forEach(panel => panel.classList.add('hidden'));
    
    if (tool !== 'merge') {
        selectedMergeImages = [];
        mergedImageData = null;
    }
    
    document.querySelectorAll('.image-tool-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'dark:text-white');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-700');
    });
    
    const activeButton = document.getElementById(`${tool}-tool`);
    if (activeButton) {
        activeButton.classList.remove('bg-gray-200', 'dark:bg-gray-700');
        activeButton.classList.add('bg-indigo-600', 'text-white', 'dark:text-white');
    }
    
    const controlPanel = document.getElementById(`${tool}-controls`);
    if (controlPanel) controlPanel.classList.remove('hidden');
    
    const uploadPrompt = document.getElementById('upload-prompt');
    if (tool === 'merge') {
        selectedMergeImages = [];
        mergedImageData = null;
        uploadPrompt.textContent = 'Select Multiple Images to Merge';
        showMergeControls();
    } else {
        uploadPrompt.textContent = `Select an Image`;
    }
    
    if (!currentImageData) {
        document.getElementById('reset-image').classList.add('hidden');
        document.getElementById('compare-toggle').classList.add('hidden');
    }
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) processImageFiles(files);
    e.target.value = '';
}

function processImageFiles(files) {
    const processFile = file => {
        if (!file.type.startsWith('image/')) {
            showNotification(`${file.name} is not a valid image file`, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = {
                name: file.name,
                size: file.size,
                type: file.type,
                dataURL: event.target.result,
                timestamp: Date.now()
            };

            if (currentTool === 'merge') {
                showImagePreview(imageData);
            } else {
                imageHistory = [];
                historyIndex = -1;
                currentImageData = imageData;
                originalImageData = JSON.parse(JSON.stringify(imageData));
                addToHistory(imageData);
                addToRecentFiles(imageData);
                showImagePreview(imageData);
                if (currentTool === 'resize') updateResizeDimensions(imageData);
                if (currentTool === 'metadata') updateMetadata(imageData);
            }
        };
        reader.readAsDataURL(file);
    };

    if (currentTool === 'merge' || currentTool === 'batch') {
        files.forEach(processFile);
    } else {
        processFile(files[0]);
    }
}

function showImagePreview(imageData) {
    const previewContainer = document.getElementById('image-preview-container');
    
    if (currentTool === 'merge') {
        if (!selectedMergeImages) selectedMergeImages = [];
        selectedMergeImages.push(imageData);

        previewContainer.innerHTML = '';
        const selectedImagesGrid = document.createElement('div');
        selectedImagesGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4';

        selectedMergeImages.forEach((img, index) => {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'relative group';
            const imgElement = document.createElement('img');
            imgElement.src = img.dataURL;
            imgElement.className = 'w-full h-32 object-cover rounded border-2 border-indigo-500';
            const removeBtn = document.createElement('button');
            removeBtn.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => removeMergeImage(index);
            imageWrapper.append(imgElement, removeBtn);
            selectedImagesGrid.appendChild(imageWrapper);
        });

        previewContainer.appendChild(selectedImagesGrid);
        
        let mergeResultPreview = document.getElementById('merge-result-preview');
        if (!mergeResultPreview) {
            mergeResultPreview = document.createElement('div');
            mergeResultPreview.id = 'merge-result-preview';
            mergeResultPreview.className = 'hidden mt-4';
            previewContainer.appendChild(mergeResultPreview);
        }
        updateMergeControlsState();
    } else {
        previewContainer.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.src = imageData.dataURL;
        imgElement.alt = 'Preview';
        imgElement.className = 'max-w-full max-h-[400px] object-contain mx-auto rounded-lg shadow-lg transition-transform duration-200';
        imgElement.id = 'preview-image';
        imgElement.style.transform = `scale(${zoomLevel})`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-xs text-center';
        infoDiv.innerHTML = `${imageData.name} (${formatFileSize(imageData.size)}) | Zoom: ${Math.round(zoomLevel * 100)}%`;
        
        previewContainer.append(imgElement, infoDiv);
        
        document.getElementById('reset-image').classList.remove('hidden');
        document.getElementById('compare-toggle').classList.remove('hidden');
    }
}

function zoomImage(factor) {
    if (!currentImageData) return;
    zoomLevel = Math.max(0.1, Math.min(5, zoomLevel * factor));
    const imgElement = document.getElementById('preview-image');
    if (imgElement) {
        imgElement.style.transform = `scale(${zoomLevel})`;
        const infoDiv = document.getElementById('image-preview-container').querySelector('.text-center');
        if(infoDiv) infoDiv.innerHTML = `${currentImageData.name} (${formatFileSize(currentImageData.size)}) | Zoom: ${Math.round(zoomLevel * 100)}%`;
    }
}

function resetZoom() {
    if (!currentImageData) return;
    zoomLevel = 1;
    zoomImage(1);
}

function addToHistory(imageData) {
    imageHistory = imageHistory.slice(0, historyIndex + 1);
    imageHistory.push(JSON.parse(JSON.stringify(imageData)));
    historyIndex++;
    if (imageHistory.length > 20) {
        imageHistory.shift();
        historyIndex--;
    }
}

function resetImage() {
    if (originalImageData) {
        currentImageData = JSON.parse(JSON.stringify(originalImageData));
        showImagePreview(currentImageData);
        addToHistory(currentImageData);
        showNotification('Image reset to original', 'info');
    }
}

function toggleComparison() { /* Unchanged */ }
function addToRecentFiles(imageData) { /* Unchanged */ }
function loadRecentFiles() { /* Unchanged */ }
function updateRecentFilesUI() { /* Unchanged */ }
function removeMergeImage(index) { /* Unchanged */ }
function showMergeControls() { /* Unchanged */ }
function updateMergeControlsState() { /* Unchanged */ }
function applyMerge() { /* Unchanged */ }
function downloadMergedImage() { /* Unchanged */ }
function updateResizeDimensions(imageData) { /* Unchanged */ }
function initializeThumbnailTool() { /* Unchanged */ }
function initializeResizeTool() { /* Unchanged */ }
function initializeCompressTool() { /* Unchanged */ }
function initializeConvertTool() { /* Unchanged */ }
function initializeWatermarkTool() { /* Unchanged */ }
function initializeFilterTool() { /* Unchanged */ }
function applyFilter(data, filter, width, height) { /* Unchanged */ }
function initializeMetadataTool() { /* Unchanged */ }
function updateMetadata(imageData) { /* Unchanged */ }
function initializeBatchTool() { /* Unchanged */ }
function updateBatchImagesUI() { /* Unchanged */ }
function removeBatchImage(index) { /* Unchanged */ }

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
