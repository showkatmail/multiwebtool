// Resize Tool Functions
function showResizeControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Resize Image</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Width (px)</label>
                    <input type="number" id="resize-width" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="${currentImageData ? currentImageData.width : ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Height (px)</label>
                    <input type="number" id="resize-height" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="${currentImageData ? currentImageData.height : ''}">
                </div>
            </div>
            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="maintain-aspect" class="mr-2" checked>
                    <span>Maintain aspect ratio</span>
                </label>
            </div>
            <div class="flex space-x-2">
                <button id="apply-resize" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Apply Resize
                </button>
                <button id="download-resized" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('maintain-aspect').addEventListener('change', function() {
        const widthInput = document.getElementById('resize-width');
        const heightInput = document.getElementById('resize-height');
        
        if (this.checked && currentImageData) {
            const aspectRatio = currentImageData.width / currentImageData.height;
            
            widthInput.addEventListener('input', function() {
                heightInput.value = Math.round(this.value / aspectRatio);
            });
            
            heightInput.addEventListener('input', function() {
                widthInput.value = Math.round(this.value * aspectRatio);
            });
        }
    });
    
    document.getElementById('apply-resize').addEventListener('click', function() {
        const width = parseInt(document.getElementById('resize-width').value);
        const height = parseInt(document.getElementById('resize-height').value);
        
        if (width && height && currentImageData) {
            resizeImage(width, height);
        }
    });
    
    document.getElementById('download-resized').addEventListener('click', function() {
        if (currentImageData) {
            const width = parseInt(document.getElementById('resize-width').value);
            const height = parseInt(document.getElementById('resize-height').value);
            
            if (width && height && currentImageData) {
                resizeImageForDownload(width, height);
            }
        }
    });
}

function resizeImage(width, height) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            currentImageData = {
                ...currentImageData,
                url: url,
                width: width,
                height: height,
                size: blob.size
            };
            
            displayImage(url);
            addToImageHistory();
            showNotification('Image resized successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}

function resizeImageForDownload(width, height) {
    if (!currentImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(function(blob) {
            const originalName = currentImageData ? currentImageData.name : 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            downloadBlob(blob, `resized_${nameWithoutExt}.jpeg`);
            showNotification('Resized image downloaded successfully', 'success');
        }, 'image/jpeg', 0.9);
    };
    
    img.src = currentImageData.url;
}