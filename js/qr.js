// qr.js - QR Code Generator functionality
let qrText = '';
let qrOptions = {
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 4,
    width: 256,
    color: {
        dark: '#000000',
        light: '#ffffff',
    }
};
let qrDataUrl = '';

// Initialize QR Code Generator
function initializeQRCodeGenerator() {
    // Add event listeners
    document.getElementById('qr-text-input').addEventListener('input', updateQRText);
    document.getElementById('qr-size-slider').addEventListener('input', updateQRSize);
    document.getElementById('qr-dark-color').addEventListener('input', updateQRDarkColor);
    document.getElementById('qr-light-color').addEventListener('input', updateQRLightColor);
    document.getElementById('download-qr-png').addEventListener('click', () => downloadQR('png'));
    document.getElementById('download-qr-svg').addEventListener('click', () => downloadQR('svg'));
    
    // Generate initial QR code
    generateQRCode();
}

// Update QR text
function updateQRText(e) {
    qrText = e.target.value;
    generateQRCode();
}

// Update QR size
function updateQRSize(e) {
    qrOptions.width = parseInt(e.target.value);
    document.getElementById('qr-size-value').textContent = `${qrOptions.width}px`;
    generateQRCode();
}

// Update QR dark color
function updateQRDarkColor(e) {
    qrOptions.color.dark = e.target.value;
    generateQRCode();
}

// Update QR light color
function updateQRLightColor(e) {
    qrOptions.color.light = e.target.value;
    generateQRCode();
}

// Generate QR code
function generateQRCode() {
    if (!qrText) {
        qrDataUrl = '';
        document.getElementById('qr-preview').innerHTML = `
            <div class="text-center text-gray-400">
                <i class="fas fa-qrcode text-8xl mb-4"></i>
                <p>Your QR Code will appear here.</p>
            </div>
        `;
        return;
    }
    
    // Use QRCode library to generate QR code
    QRCode.toDataURL(qrText, qrOptions, (err, url) => {
        if (err) {
            showNotification('Failed to generate QR code', 'error');
            console.error(err);
            return;
        }
        qrDataUrl = url;
        document.getElementById('qr-preview').innerHTML = `
            <img src="${url}" alt="Generated QR Code" style="width: ${qrOptions.width}px; height: ${qrOptions.width}px" class="bg-white p-4 rounded-lg shadow-inner" />
        `;
    });
}

// Download QR code
function downloadQR(format) {
    if (!qrText || !qrDataUrl) {
        showNotification('Please generate a QR code first.', 'error');
        return;
    }
    
    if (format === 'svg') {
        QRCode.toString(qrText, {type: 'svg', ...qrOptions}, (err, string) => {
            if(err) {
                showNotification('Failed to generate SVG', 'error');
                console.error(err);
                return;
            }
            const blob = new Blob([string], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'qrcode.svg';
            link.click();
            URL.revokeObjectURL(url);
        });
    } else {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = 'qrcode.png';
        link.click();
    }
    showNotification(`QR Code downloaded as ${format.toUpperCase()}`, 'success');
}