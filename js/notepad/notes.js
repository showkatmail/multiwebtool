// Note Management Functions with Enhanced Features
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
            content: 'Welcome to your enhanced notepad! Create more notes using the "New" button.',
            tags: ['welcome'],
            category: 'General',
            color: '#6366f1',
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
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
        applyNoteColor(currentNote.color);
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
        currentNote.updatedAt = Date.now();
        saveNotesToLocal();
    }
}

function renderNoteSelector() {
    const noteSelector = document.getElementById('note-selector');
    noteSelector.innerHTML = '';
    
    // Sort notes: pinned first, then by update time
    const sortedNotes = [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
    });
    
    sortedNotes.forEach(note => {
        const option = document.createElement('option');
        option.value = note.id;
        
        // Add pin indicator
        const pinIcon = note.pinned ? '📌 ' : '';
        option.textContent = `${pinIcon}${note.name}`;
        
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
        // Save current note to history before switching
        saveToHistory();
        
        currentNoteId = selectedId;
        document.getElementById('editor').innerHTML = newNote.content;
        localStorage.setItem('last-active-note-id', currentNoteId);
        
        // Apply note color
        applyNoteColor(newNote.color);
        
        // Update UI with note metadata
        updateNoteMetadata(newNote);
    }
}

function createNewNote() {
    const noteName = prompt('Enter a name for your new note:', `Note ${notes.length + 1}`);
    if (noteName && noteName.trim() !== '') {
        const newNote = {
            id: Date.now(),
            name: noteName.trim(),
            content: '',
            tags: [],
            category: 'General',
            color: '#6366f1',
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        notes.push(newNote);
        currentNoteId = newNote.id;
        localStorage.setItem('last-active-note-id', currentNoteId);
        document.getElementById('editor').innerHTML = '';
        renderNoteSelector();
        saveNotesToLocal();
        showNotification('New note created', 'success');
    }
}

function deleteCurrentNote() {
    if (notes.length <= 1) {
        showNotification('Cannot delete the last note.', 'error');
        return;
    }

    const currentNote = notes.find(note => note.id === currentNoteId);
    if (confirm(`Are you sure you want to delete "${currentNote.name}"? This action cannot be undone.`)) {
        // Move to trash instead of permanent delete
        moveToTrash(currentNote);
        
        notes = notes.filter(note => note.id !== currentNoteId);
        currentNoteId = notes[0].id;
        localStorage.setItem('last-active-note-id', currentNoteId);
        switchNote();
        renderNoteSelector();
        saveNotesToLocal();
        showNotification('Note moved to trash', 'info');
    }
}

// Trash/Recycle Bin
let trashedNotes = [];

function loadTrashedNotes() {
    const saved = localStorage.getItem('trashed-notes');
    if (saved) {
        try {
            trashedNotes = JSON.parse(saved);
        } catch (e) {
            trashedNotes = [];
        }
    }
}

function moveToTrash(note) {
    loadTrashedNotes();
    trashedNotes.push({
        ...note,
        deletedAt: Date.now()
    });
    localStorage.setItem('trashed-notes', JSON.stringify(trashedNotes));
}

function restoreFromTrash(noteId) {
    loadTrashedNotes();
    const note = trashedNotes.find(n => n.id === noteId);
    if (note) {
        delete note.deletedAt;
        notes.push(note);
        trashedNotes = trashedNotes.filter(n => n.id !== noteId);
        localStorage.setItem('trashed-notes', JSON.stringify(trashedNotes));
        saveNotesToLocal();
        renderNoteSelector();
        showNotification('Note restored', 'success');
    }
}

function emptyTrash() {
    if (confirm('Permanently delete all notes in trash? This cannot be undone.')) {
        trashedNotes = [];
        localStorage.setItem('trashed-notes', JSON.stringify(trashedNotes));
        showNotification('Trash emptied', 'success');
    }
}

// Note Organization Features
function pinNote() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        currentNote.pinned = !currentNote.pinned;
        saveNotesToLocal();
        renderNoteSelector();
        showNotification(currentNote.pinned ? 'Note pinned' : 'Note unpinned', 'success');
    }
}

function duplicateNote() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        const duplicate = {
            ...currentNote,
            id: Date.now(),
            name: `${currentNote.name} (Copy)`,
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        notes.push(duplicate);
        saveNotesToLocal();
        renderNoteSelector();
        showNotification('Note duplicated', 'success');
    }
}

function renameNote() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        const newName = prompt('Enter new name:', currentNote.name);
        if (newName && newName.trim() !== '') {
            currentNote.name = newName.trim();
            currentNote.updatedAt = Date.now();
            saveNotesToLocal();
            renderNoteSelector();
            showNotification('Note renamed', 'success');
        }
    }
}

// Tags and Categories
function addTag() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        const tag = prompt('Enter tag:');
        if (tag && tag.trim() !== '') {
            if (!currentNote.tags) currentNote.tags = [];
            if (!currentNote.tags.includes(tag.trim())) {
                currentNote.tags.push(tag.trim());
                saveNotesToLocal();
                showNotification('Tag added', 'success');
            }
        }
    }
}

function removeTag(tag) {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote && currentNote.tags) {
        currentNote.tags = currentNote.tags.filter(t => t !== tag);
        saveNotesToLocal();
        showNotification('Tag removed', 'success');
    }
}

function setCategory(category) {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        currentNote.category = category;
        currentNote.updatedAt = Date.now();
        saveNotesToLocal();
        showNotification(`Category set to ${category}`, 'success');
    }
}

// Color Coding
function setNoteColor(color) {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (currentNote) {
        currentNote.color = color;
        applyNoteColor(color);
        saveNotesToLocal();
        showNotification('Note color updated', 'success');
    }
}

function applyNoteColor(color) {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.style.borderLeftColor = color;
        editor.style.borderLeftWidth = '4px';
        editor.style.borderLeftStyle = 'solid';
    }
}

// Search and Filter
function searchNotes(query) {
    if (!query) return notes;
    
    const lowerQuery = query.toLowerCase();
    return notes.filter(note => 
        note.name.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
}

function filterByCategory(category) {
    return notes.filter(note => note.category === category);
}

function filterByTag(tag) {
    return notes.filter(note => note.tags && note.tags.includes(tag));
}

// Note Statistics
function getNoteStatistics() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (!currentNote) return null;
    
    const text = document.getElementById('editor').innerText;
    const words = text.trim().split(/\s+/).length;
    const characters = text.length;
const created = new Date(currentNote.createdAt).toLocaleDateString();
const updated = new Date(currentNote.updatedAt).toLocaleDateString();
return {
name: currentNote.name,
    words: words,
    characters: characters,
    created: created,
    updated: updated,
    tags: currentNote.tags || [],
    category: currentNote.category,
    pinned: currentNote.pinned
};
}
// Update note metadata display
function updateNoteMetadata(note) {
const metadataContainer = document.getElementById('note-metadata');
if (!metadataContainer) return;
const created = new Date(note.createdAt).toLocaleString();
const updated = new Date(note.updatedAt).toLocaleString();

metadataContainer.innerHTML = `
    <div class="text-xs text-gray-500 dark:text-gray-400">
        <span>Created: ${created}</span> | 
        <span>Updated: ${updated}</span>
        ${note.category ? ` | Category: ${note.category}` : ''}
    </div>
`;
}
// Export/Import all notes
function exportAllNotes() {
const exportData = {
notes: notes,
trashedNotes: trashedNotes,
exportDate: Date.now(),
version: '2.0'
};
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
downloadBlob(blob, `notepad-backup-${Date.now()}.json`);
showNotification('All notes exported successfully', 'success');
}
function importNotes() {
const input = document.createElement('input');
input.type = 'file';
input.accept = 'application/json';
input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importData = JSON.parse(event.target.result);
            
            if (confirm('This will merge imported notes with existing notes. Continue?')) {
                // Merge notes
                if (importData.notes && Array.isArray(importData.notes)) {
                    importData.notes.forEach(note => {
                        // Check for duplicates
                        if (!notes.find(n => n.id === note.id)) {
                            notes.push(note);
                        }
                    });
                }
                
                // Merge trashed notes
                if (importData.trashedNotes && Array.isArray(importData.trashedNotes)) {
                    loadTrashedNotes();
                    importData.trashedNotes.forEach(note => {
                        if (!trashedNotes.find(n => n.id === note.id)) {
                            trashedNotes.push(note);
                        }
                    });
                    localStorage.setItem('trashed-notes', JSON.stringify(trashedNotes));
                }
                
                saveNotesToLocal();
                renderNoteSelector();
                showNotification('Notes imported successfully', 'success');
            }
        } catch (error) {
            showNotification('Failed to import notes. Invalid file format.', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
};

input.click();
}

// Sort notes
function sortNotes(sortBy) {
switch(sortBy) {
case 'name':
notes.sort((a, b) => a.name.localeCompare(b.name));
break;
case 'created':
notes.sort((a, b) => b.createdAt - a.createdAt);
break;
case 'updated':
notes.sort((a, b) => b.updatedAt - a.updatedAt);
break;
case 'category':
notes.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
break;
}
saveNotesToLocal();
renderNoteSelector();
}

// Merge notes
function mergeNotes(noteIds) {
if (noteIds.length < 2) {
showNotification('Select at least 2 notes to merge', 'error');
return;
}
const notesToMerge = notes.filter(note => noteIds.includes(note.id));
const mergedContent = notesToMerge.map(note => 
    `<h2>${note.name}</h2>${note.content}`
).join('<hr>');

const mergedNote = {
    id: Date.now(),
    name: 'Merged Note - ' + new Date().toLocaleDateString(),
    content: mergedContent,
    tags: [...new Set(notesToMerge.flatMap(n => n.tags || []))],
    category: notesToMerge[0].category,
    color: notesToMerge[0].color,
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
};

notes.push(mergedNote);
currentNoteId = mergedNote.id;
saveNotesToLocal();
renderNoteSelector();
switchNote();
showNotification('Notes merged successfully', 'success');
}

// Note Encryption (Basic)
function encryptNote(password) {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (!currentNote) return;
    
    // Simple encryption (for demonstration - use proper encryption in production)
    const encrypted = btoa(currentNote.content + '::' + password);
    currentNote.content = '🔒 ' + encrypted;
    currentNote.encrypted = true;

    saveNotesToLocal();
    showNotification('Note encrypted', 'success');
}

// Initialize shared note loading
document.addEventListener('DOMContentLoaded', loadSharedNote);

// Note templates by category
const categoryTemplates = {
    'Work': ['Meeting Notes', 'Project Plan', 'Task List'],
    'Personal': ['Journal Entry', 'Goals', 'Ideas'],
    'Study': ['Lecture Notes', 'Research', 'Summary'],
    'Creative': ['Story Outline', 'Poem', 'Brainstorm']
};

function getCategoryTemplates(category) {
    return categoryTemplates[category] || [];
}

// Auto-tag suggestions based on content
function suggestTags() {
    const editor = document.getElementById('editor');
    const content = editor.innerText.toLowerCase();
    const tagKeywords = {
        'work': ['meeting', 'project', 'task', 'deadline', 'client'],
        'personal': ['today', 'feel', 'think', 'remember', 'diary'],
        'study': ['learn', 'research', 'study', 'course', 'notes'],
        'important': ['urgent', 'important', 'critical', 'asap', 'priority'],
        'idea': ['idea', 'concept', 'brainstorm', 'creative', 'innovation']
    };

    const suggestions = [];

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
            suggestions.push(tag);
        }
    }

    return suggestions;
}

// Batch operations
function batchDeleteNotes(noteIds) {
    if (confirm(`Delete ${noteIds.length} notes?`)) {
        noteIds.forEach(id => {
            const note = notes.find(n => n.id === id);
            if (note) moveToTrash(note);
        });
        notes = notes.filter(note => !noteIds.includes(note.id));
        saveNotesToLocal();
        renderNoteSelector();
        showNotification(`${noteIds.length} notes moved to trash`, 'info');
    }
}

function batchExportNotes(noteIds) {
    const notesToExport = notes.filter(note => noteIds.includes(note.id));
    const exportData = {
        notes: notesToExport,
        exportDate: Date.now(),
        count: notesToExport.length
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `selected-notes-${Date.now()}.json`);
    showNotification(`${noteIds.length} notes exported`, 'success');
}

// Note analytics
function getNoteAnalytics() {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        const text = tempDiv.innerText;
        return sum + (text.trim().split(/\s+/).length);
    }, 0);
    const categories = [...new Set(notes.map(n => n.category))];
    const allTags = [...new Set(notes.flatMap(n => n.tags || []))];
    const pinnedCount = notes.filter(n => n.pinned).length;

    const mostRecentNote = notes.reduce((latest, note) => 
        note.updatedAt > latest.updatedAt ? note : latest
    , notes[0]);

    return {
        totalNotes,
        totalWords,
        categories: categories.length,
        tags: allTags.length,
        pinnedNotes: pinnedCount,
        trashedNotes: trashedNotes.length,
        mostRecentNote: mostRecentNote ? mostRecentNote.name : 'N/A',
        averageWordsPerNote: Math.round(totalWords / totalNotes)
    };
}

function showAnalyticsDashboard() {
    const analytics = getNoteAnalytics();
    const modal = document.getElementById('analytics-modal');
    const content = document.getElementById('analytics-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <div class="text-2xl font-bold">${analytics.totalNotes}</div>
                <div class="text-sm">Total Notes</div>
            </div>
            <div class="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <div class="text-2xl font-bold">${analytics.totalWords}</div>
                <div class="text-sm">Total Words</div>
            </div>
            <div class="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <div class="text-2xl font-bold">${analytics.categories}</div>
                <div class="text-sm">Categories</div>
            </div>
            <div class="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <div class="text-2xl font-bold">${analytics.tags}</div>
                <div class="text-sm">Unique Tags</div>
            </div>
            <div class="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <div class="text-2xl font-bold">${analytics.pinnedNotes}</div>
                <div class="text-sm">Pinned Notes</div>
            </div>
            <div class="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                <div class="text-2xl font-bold">${analytics.trashedNotes}</div>
                <div class="text-sm">In Trash</div>
            </div>
        </div>
        <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-sm"><strong>Most Recent:</strong> ${analytics.mostRecentNote}</div>
            <div class="text-sm"><strong>Avg Words/Note:</strong> ${analytics.averageWordsPerNote}</div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// Share note function
function shareNote() {
    const currentNote = notes.find(note => note.id === currentNoteId);
    if (!currentNote) {
        showNotification('No note to share', 'error');
        return;
    }

    // Create a shareable URL (in a real app, this would be a server-generated link)
    const shareData = {
        title: currentNote.name,
        text: currentNote.content,
        url: window.location.href
    };

    // Check if the Web Share API is available
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showNotification('Note shared successfully', 'success'))
            .catch((error) => showNotification('Error sharing note', 'error'));
    } else {
        // Fallback: copy to clipboard
        const textToCopy = `${currentNote.name}\n\n${currentNote.content}`;
        navigator.clipboard.writeText(textToCopy)
            .then(() => showNotification('Note copied to clipboard', 'success'))
            .catch(() => showNotification('Failed to copy note', 'error'));
    }
}

// Load shared note function
function loadSharedNote() {
    // In a real application, this would load a note from a shared link
    // For now, we'll just check if there's a shared note ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedNoteId = urlParams.get('shared');
    
    if (sharedNoteId) {
        // This is a placeholder for actual shared note loading
        showNotification('Shared note feature coming soon!', 'info');
    }
}