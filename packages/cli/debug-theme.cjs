// Quick debug script to test theme detection
const { execSync } = require('child_process');

function detectSystemTheme() {
    const colorTerm = process.env['COLORFGBG'];
    const term = process.env['TERM'];
    
    console.log('Environment variables:');
    console.log('TERM:', term);
    console.log('COLORFGBG:', colorTerm);
    
    // Check macOS system appearance
    try {
        if (process.platform === 'darwin') {
            const result = execSync('defaults read -g AppleInterfaceStyle 2>/dev/null || echo "Light"', { encoding: 'utf8' });
            console.log('macOS system appearance:', result.trim());
            if (result.trim() === 'Dark') {
                console.log('Detected: dark (macOS)');
                return 'dark';
            }
        }
    } catch (error) {
        console.log('macOS detection failed:', error.message);
    }

    // Check COLORFGBG environment variable
    if (colorTerm) {
        const parts = colorTerm.split(';');
        console.log('COLORFGBG parts:', parts);
        if (parts.length >= 2 && parts[1]) {
            const bg = parseInt(parts[1], 10);
            console.log('Background color code:', bg);
            if (bg >= 0 && bg <= 7) {
                console.log('Detected: dark (COLORFGBG)');
                return 'dark';
            } else if (bg >= 8 && bg <= 15) {
                console.log('Detected: light (COLORFGBG)');
                return 'light';
            }
        }
    }

    // Check terminal type
    if (term && (term.includes('dark') || term.includes('256color'))) {
        console.log('Detected: dark (terminal type)');
        return 'dark';
    }

    console.log('Detected: dark (default)');
    return 'dark';
}

const detected = detectSystemTheme();
console.log('Final detection:', detected);