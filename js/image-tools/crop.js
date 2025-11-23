// Crop Tool Functions
function showCropControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Crop Image</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Aspect Ratio</label>
                <select id="crop-aspect-ratio" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                    <option value="free">Free</option>
                    <option value="1.77">16:9</option>
                    <option value="1.33">4:3</option>
                    <option value="1">1:1</option>
                    <option value="0.75">3:4</option>
                    <option value="0.56">9:16</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" id="crop-guide" class="mr-2" checked>
                    <span>Show Guides</span>
                </label>
            </div>
            <div class="flex space-x-2">
                <button id="cancel-crop" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                    Cancel
                </button>
                <button id="download-cropped" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Crop & Download
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('crop-aspect-ratio').addEventListener('change', updateCropAspectRatio);
    document.getElementById('crop-guide').addEventListener('change', toggleCropGuides);
    document.getElementById('cancel-crop').addEventListener('click', cancelCrop);
    document.getElementById('download-cropped').addEventListener('click', downloadCroppedImage);
    
    initializeCropper();
}

function initializeCropper() {
    if (!currentImageData) return;
    
    const image = document.getElementById('preview-image');
    if (!image) return;
    
    if (cropper) {
        cropper.destroy();
    }
    
    cropper = new Cropper(image, {
        aspectRatio: NaN,
        viewMode: 1,
        guides: true,
        center: true,
        highlight: true,
        background: true,
        autoCrop: true,
        autoCropArea: 0.8,
        movable: true,
        rotatable: false,
        scalable: false,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
}

function updateCropAspectRatio() {
    if (!cropper) return;
    
    const aspectRatio = document.getElementById('crop-aspect-ratio').value;
    cropper.setAspectRatio(aspectRatio === 'free' ? NaN : parseFloat(aspectRatio));
}

function toggleCropGuides() {
    if (!cropper) return;
    
    const showGuides = document.getElementById('crop-guide').checked;
    cropper.setOption('guides', showGuides);
    cropper.setOption('center', showGuides);
    cropper.setOption('highlight', showGuides);
}

function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    if (originalImageData) {
        currentImageData = {...originalImageData};
        displayImage(originalImageData.url);
    }
}

function downloadCroppedImage() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    
    if (!canvas) {
        showNotification('Failed to crop image', 'error');
        return;
    }
    
    canvas.toBlob(function(blob) {
        if (!blob) {
            showNotification('Failed to process cropped image', 'error');
            return;
        }
        
        const originalName = currentImageData ? currentImageData.name : 'image';
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        downloadBlob(blob, `cropped_${nameWithoutExt}.jpeg`);
        
        showNotification('Cropped image downloaded successfully', 'success');
    }, 'image/jpeg', 0.9);
}