// Compress Tool Functions
function showCompressControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Compress Image</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Quality (1-100)</label>
                <input type="range" id="compress-quality" min="1" max="100" value="80" class="w-full">
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Low Quality</span>
                    <span id="quality-value">80</span>
                    <span>High Quality</span>
                </div>
            </div>
            <div class="mb-4">
                <p>Original Size: ${currentImageData ? formatFileSize(currentImageData.size) : 'N/A'}</p>
                <p>Estimated New Size: <span id="estimated-size">Calculating...</span></p>
            </div>
            <div class="flex space-x-2">
                <button id="apply-compress" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    Apply Compression
                </button>
                <button id="download-compressed" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Download
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('compress-quality').addEventListener('input', function() {
        document.getElementById('quality-value').textContent = this.value;
        if (currentImageData) {
            const estimatedSize = Math.round(currentImageData.size * (this.value / 100));
            document.getElementById('estimated-size').textContent = formatFileSize(estimatedSize);
        }
    });
    
    document.getElementById('apply-compress').addEventListener('click', function() {
        const quality = parseInt(document.getElementById('compress-quality').value) / 100;
        compressImage(quality);
    });
    
    document.getElementById('download-compressed').addEventListener('click', function() {
        if (currentImageData) {
            const quality = parseInt(document.getElementById('compress-quality').value) / 100;
            compressImageForDownload(quality);
        }
    });
}

function compressImage(quality) {
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
            showNotification(`Image compressed to ${formatFileSize(blob.size)}`, 'success');
        }, 'image/jpeg', quality);
    };
    
    img.src = currentImageData.url;
}

function compressImageForDownload(quality) {
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
            downloadBlob(blob, `compressed_${nameWithoutExt}.jpeg`);
            showNotification('Compressed image downloaded successfully', 'success');
        }, 'image/jpeg', quality);
    };
    
    img.src = currentImageData.url;
}