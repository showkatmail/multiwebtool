// QR Code Generator Functions
function initializeQRCodeGenerator() {
    const textInput = document.getElementById('qr-text-input');
    const sizeSlider = document.getElementById('qr-size-slider');
    const sizeValue = document.getElementById('qr-size-value');
    const darkColor = document.getElementById('qr-dark-color');
    const lightColor = document.getElementById('qr-light-color');
    const downloadPngBtn = document.getElementById('download-qr-png');
    const downloadSvgBtn = document.getElementById('download-qr-svg');
    const preview = document.getElementById('qr-preview');
    
    let qrCode = null;
    
    function generateQRCode() {
        const text = textInput.value.trim();
        if (!text) {
            preview.innerHTML = `
                <div class="text-center text-gray-400">
                    <i class="fas fa-qrcode text-8xl mb-4"></i>
                    <p>Your QR Code will appear here.</p>
                </div>
            `;
            return;
        }
        
        preview.innerHTML = '';
        
        QRCode.toCanvas(text, {
            width: parseInt(sizeSlider.value),
            margin: 2,
            color: {
                dark: darkColor.value,
                light: lightColor.value
            }
        }, function(error, canvas) {
            if (error) {
                console.error(error);
                showNotification('Error generating QR code', 'error');
                return;
            }
            preview.appendChild(canvas);
        });
    }
    
    // Event listeners
    textInput.addEventListener('input', generateQRCode);
    sizeSlider.addEventListener('input', function() {
        sizeValue.textContent = this.value + 'px';
        generateQRCode();
    });
    darkColor.addEventListener('input', generateQRCode);
    lightColor.addEventListener('input', generateQRCode);
    
    downloadPngBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        if (!text) {
            showNotification('Please enter text to generate QR code', 'error');
            return;
        }
        
        QRCode.toDataURL(text, {
            width: parseInt(sizeSlider.value),
            margin: 2,
            color: {
                dark: darkColor.value,
                light: lightColor.value
            }
        }, function(error, url) {
            if (error) {
                console.error(error);
                showNotification('Error generating QR code', 'error');
                return;
            }
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qrcode.png';
            a.click();
            showNotification('QR Code downloaded as PNG', 'success');
        });
    });
    
    downloadSvgBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        if (!text) {
            showNotification('Please enter text to generate QR code', 'error');
            return;
        }
        
        QRCode.toString(text, {
            type: 'svg',
            width: parseInt(sizeSlider.value),
            margin: 2,
            color: {
                dark: darkColor.value,
                light: lightColor.value
            }
        }, function(error, svg) {
            if (error) {
                console.error(error);
                showNotification('Error generating QR code', 'error');
                return;
            }
            
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qrcode.svg';
            a.click();
            URL.revokeObjectURL(url);
            showNotification('QR Code downloaded as SVG', 'success');
        });
    });
    
    // Generate initial QR code if there's text
    generateQRCode();
}