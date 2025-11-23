// Helper Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function getFileIcon(fileType) {
    if (fileType.includes('jpeg') || fileType.includes('jpg')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('png')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('gif')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('webp')) {
        return 'fas fa-file-image';
    } else if (fileType.includes('bmp')) {
        return 'fas fa-file-image';
    } else {
        return 'fas fa-file';
    }
}

function dataURLtoBlob(dataURL) {
    try {
        if (!dataURL || typeof dataURL !== 'string') {
            console.error('Invalid data URL: not a string or empty');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        if (!dataURL.startsWith('data:')) {
            console.error('Invalid data URL: does not start with "data:"');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        const arr = dataURL.split(',');
        
        if (arr.length < 2) {
            console.error('Invalid data URL: could not split properly');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        const match = arr[0].match(/:(.*?);/);
        
        if (!match || match.length < 2) {
            console.error('Invalid data URL format: could not extract MIME type');
            return new Blob([], { type: 'image/jpeg' });
        }
        
        const mime = match[1];
        
        if (!arr[1]) {
            console.error('Invalid data URL: missing data part');
            return new Blob([], { type: mime });
        }
        
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    } catch (error) {
        console.error('Error converting data URL to blob:', error);
        return new Blob([], { type: 'image/jpeg' });
    }
}