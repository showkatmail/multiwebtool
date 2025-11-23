// Image Merge Tool Functions
function showMergeControls(container) {
    container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-medium mb-4">Image Merger</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Select Images to Merge</label>
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
                    <input type="file" id="merge-image-upload" accept="image/*" multiple class="hidden">
                    <button id="merge-upload-btn" class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Add Images
                    </button>
                </div>
                <div id="merge-images-container" class="grid grid-cols-3 gap-2 mb-4 max-h-60 overflow-y-auto">
                    <!-- Selected images will be displayed here -->
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Layout</label>
                    <select id="merge-layout" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800">
                        <option value="grid">Grid</option>
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Background Color</label>
                    <input type="color" id="merge-bg-color" class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800" value="#ffffff">
                </div>
                <div class="flex space-x-2">
                    <button id="merge-images" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Merge Images
                    </button>
                    <button id="download-merged" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Download
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('merge-upload-btn').addEventListener('click', () => {
        document.getElementById('merge-image-upload').click();
    });
    
    document.getElementById('merge-image-upload').addEventListener('change', handleMergeImageUpload);
    document.getElementById('merge-images').addEventListener('click', mergeSelectedImages);
    document.getElementById('download-merged').addEventListener('click', downloadMergedImage);
    
    // Display any previously selected images
    updateMergeImagesDisplay();
}

// Handle merge image upload
function handleMergeImageUpload(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const imageData = {
                    id: Date.now() + Math.random(),
                    url: event.target.result,
                    name: file.name,
                    width: img.width,
                    height: img.height
                };
                
                selectedMergeImages.push(imageData);
                updateMergeImagesDisplay();
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

// Update the display of selected merge images
function updateMergeImagesDisplay() {
    const container = document.getElementById('merge-images-container');
    container.innerHTML = '';
    
    selectedMergeImages.forEach((image, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'relative group';
        imageContainer.innerHTML = `
            <img src="${image.url}" alt="${image.name}" class="w-full h-24 object-cover rounded">
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <button class="delete-merge-image bg-red-500 hover:bg-red-600 text-white p-1 rounded mr-1" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="swap-left-merge-image bg-blue-500 hover:bg-blue-600 text-white p-1 rounded mr-1" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button class="swap-right-merge-image bg-blue-500 hover:bg-blue-600 text-white p-1 rounded" data-index="${index}" ${index === selectedMergeImages.length - 1 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(imageContainer);
    });
    
    // Add event listeners for delete and swap buttons
    document.querySelectorAll('.delete-merge-image').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            selectedMergeImages.splice(index, 1);
            updateMergeImagesDisplay();
        });
    });
    
    document.querySelectorAll('.swap-left-merge-image').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (index > 0) {
                [selectedMergeImages[index], selectedMergeImages[index - 1]] = [selectedMergeImages[index - 1], selectedMergeImages[index]];
                updateMergeImagesDisplay();
            }
        });
    });
    
    document.querySelectorAll('.swap-right-merge-image').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (index < selectedMergeImages.length - 1) {
                [selectedMergeImages[index], selectedMergeImages[index + 1]] = [selectedMergeImages[index + 1], selectedMergeImages[index]];
                updateMergeImagesDisplay();
            }
        });
    });
}

// Merge selected images
function mergeSelectedImages() {
    if (selectedMergeImages.length < 2) {
        showNotification('Please select at least 2 images to merge', 'error');
        return;
    }
    
    const layout = document.getElementById('merge-layout').value;
    const bgColor = document.getElementById('merge-bg-color').value;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions based on layout
    if (layout === 'grid') {
        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(selectedMergeImages.length));
        const rows = Math.ceil(selectedMergeImages.length / cols);
        
        // Find the smallest aspect ratio among all images
        let minAspectRatio = Infinity;
        selectedMergeImages.forEach(image => {
            const aspectRatio = image.width / image.height;
            if (aspectRatio < minAspectRatio) {
                minAspectRatio = aspectRatio;
            }
        });
        
        // Set canvas dimensions (assuming each cell is 300px wide)
        const cellWidth = 300;
        const cellHeight = cellWidth / minAspectRatio;
        canvas.width = cols * cellWidth;
        canvas.height = rows * cellHeight;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw images in grid
        let loadedImages = 0;
        selectedMergeImages.forEach((imageData, index) => {
            const img = new Image();
            img.onload = function() {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = col * cellWidth;
                const y = row * cellHeight;
                
                // Calculate dimensions to maintain aspect ratio
                let drawWidth = cellWidth;
                let drawHeight = cellHeight;
                const aspectRatio = img.width / img.height;
                
                if (aspectRatio > minAspectRatio) {
                    drawHeight = cellWidth / aspectRatio;
                } else {
                    drawWidth = cellHeight * aspectRatio;
                }
                
                // Center the image in the cell
                const offsetX = (cellWidth - drawWidth) / 2;
                const offsetY = (cellHeight - drawHeight) / 2;
                
                ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                
                loadedImages++;
                if (loadedImages === selectedMergeImages.length) {
                    // All images loaded, create blob and display
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        mergedImageData = {
                            url: url,
                            width: canvas.width,
                            height: canvas.height,
                            size: blob.size
                        };
                        displayImage(url);
                        addToImageHistory();
                        showNotification('Images merged successfully', 'success');
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = imageData.url;
        });
    } else if (layout === 'horizontal') {
        // Find the smallest height among all images
        let minHeight = Infinity;
        selectedMergeImages.forEach(image => {
            if (image.height < minHeight) {
                minHeight = image.height;
            }
        });
        
        // Calculate total width
        let totalWidth = 0;
        selectedMergeImages.forEach(image => {
            const aspectRatio = image.width / image.height;
            totalWidth += minHeight * aspectRatio;
        });
        
        canvas.width = totalWidth;
        canvas.height = minHeight;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw images horizontally
        let loadedImages = 0;
        let currentX = 0;
        
        selectedMergeImages.forEach(imageData => {
            const img = new Image();
            img.onload = function() {
                const aspectRatio = img.width / img.height;
                const drawWidth = minHeight * aspectRatio;
                
                ctx.drawImage(img, currentX, 0, drawWidth, minHeight);
                currentX += drawWidth;
                
                loadedImages++;
                if (loadedImages === selectedMergeImages.length) {
                    // All images loaded, create blob and display
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        mergedImageData = {
                            url: url,
                            width: canvas.width,
                            height: canvas.height,
                            size: blob.size
                        };
                        displayImage(url);
                        addToImageHistory();
                        showNotification('Images merged successfully', 'success');
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = imageData.url;
        });
    } else if (layout === 'vertical') {
        // Find the smallest width among all images
        let minWidth = Infinity;
        selectedMergeImages.forEach(image => {
            if (image.width < minWidth) {
                minWidth = image.width;
            }
        });
        
        // Calculate total height
        let totalHeight = 0;
        selectedMergeImages.forEach(image => {
            const aspectRatio = image.height / image.width;
            totalHeight += minWidth * aspectRatio;
        });
        
        canvas.width = minWidth;
        canvas.height = totalHeight;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw images vertically
        let loadedImages = 0;
        let currentY = 0;
        
        selectedMergeImages.forEach(imageData => {
            const img = new Image();
            img.onload = function() {
                const aspectRatio = img.height / img.width;
                const drawHeight = minWidth * aspectRatio;
                
                ctx.drawImage(img, 0, currentY, minWidth, drawHeight);
                currentY += drawHeight;
                
                loadedImages++;
                if (loadedImages === selectedMergeImages.length) {
                    // All images loaded, create blob and display
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        mergedImageData = {
                            url: url,
                            width: canvas.width,
                            height: canvas.height,
                            size: blob.size
                        };
                        displayImage(url);
                        addToImageHistory();
                        showNotification('Images merged successfully', 'success');
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = imageData.url;
        });
    }
}

// Download merged image
function downloadMergedImage() {
    if (!mergedImageData) {
        showNotification('No merged image to download', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = mergedImageData.url;
    link.download = 'merged-image.jpeg';
    link.click();
    
    showNotification('Merged image downloaded successfully', 'success');
}