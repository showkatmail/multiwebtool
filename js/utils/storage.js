// Storage Management Functions
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

function updateStorageInfo() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += (new Blob([localStorage[key]])).size;
        }
    }
    
    const storageUsedElement = document.getElementById('storage-used');
    const storageBarElement = document.getElementById('storage-bar');
    
    if (storageUsedElement) {
        storageUsedElement.textContent = formatFileSize(totalSize);
    }
    
    if (storageBarElement) {
        const maxStorage = 5 * 1024 * 1024;
        const percentage = Math.min(100, (totalSize / maxStorage) * 100);
        storageBarElement.style.width = `${percentage}%`;
    }
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progress-bar');
    if(progressBar) progressBar.style.width = `${percentage}%`;
}