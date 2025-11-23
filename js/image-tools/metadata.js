// Metadata Tool Functions
function showMetadataControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Image Metadata</h3>
            <div id="metadata-content">
                ${currentImageData ? `
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="font-medium">Name:</span>
                            <span>${currentImageData.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Size:</span>
                            <span>${formatFileSize(currentImageData.size)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Type:</span>
                            <span>${currentImageData.type}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Dimensions:</span>
                            <span>${currentImageData.width} × ${currentImageData.height} px</span>
                        </div>
                    </div>
                ` : '<p>No image selected</p>'}
            </div>
            <div class="flex space-x-2 mt-4">
                <button id="remove-metadata" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Remove Metadata
                </button>
                <button id="download-current" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('remove-metadata').addEventListener('click', function() {
        if (currentImageData) {
            removeMetadata();
        }
    });
    
    document.getElementById('download-current').addEventListener('click', function() {
        if (currentImageData) {
            removeMetadataForDownload();
        }
    });
}

function removeMetadata() {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification('Metadata removed successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

function removeMetadataForDownload() {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `metadata_removed_${nameWithoutExt}.jpeg`);
            showNotification('Image without metadata downloaded successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}