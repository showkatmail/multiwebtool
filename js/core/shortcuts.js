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
    } else if (tabName === 'qr-generator') {
        showNotification('QR codes are generated on-demand', 'info');
    }
}

// Help modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('help-toggle').addEventListener('click', toggleHelpModal);
    document.getElementById('close-help').addEventListener('click', toggleHelpModal);
});