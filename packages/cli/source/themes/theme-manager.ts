
// Theme system based on Gemini CLI architecture
export interface Theme {
	name: string;
	type: 'built-in' | 'custom';
	colors: {
		primary: string;
		accent: string;
		error: string;
		warning: string;
		success: string;
		text: string;
		secondary: string;
		border: string;
		input: string;
		selection: string;
		background?: string;
	};
	gradients?: string[];
	preview?: string;
}

export interface CustomThemeConfig {
	colors: Theme['colors'];
	gradients?: string[];
	preview?: string;
}

export class CustomTheme implements Theme {
	constructor(
		public name: string,
		private config: CustomThemeConfig
	) {}

	get colors() {
		return this.config.colors;
	}

	get type() {
		return 'custom' as const;
	}

	get gradients() {
		return this.config.gradients;
	}

	get preview() {
		return this.config.preview;
	}
}

export class ThemeManager {
	private themes: Map<string, Theme> = new Map();
	private activeTheme: Theme | null = null;

	constructor() {
		this.loadThemesFromFile();
	}

	private detectSystemTheme(): 'dark' | 'light' {
		// Check environment variables that might indicate theme preference
		const colorTerm = process.env['COLORFGBG'];
		const term = process.env['TERM'];
		
		// Check macOS system appearance
		try {
			const { execSync } = require('child_process');
			if (process.platform === 'darwin') {
				const result = execSync('defaults read -g AppleInterfaceStyle 2>/dev/null || echo "Light"', { encoding: 'utf8' });
				if (result.trim() === 'Dark') {
					return 'dark';
				}
			}
		} catch (error) {
			// Fallback if system detection fails
		}

		// Check COLORFGBG environment variable (format: foreground;background)
		if (colorTerm) {
			const parts = colorTerm.split(';');
			if (parts.length >= 2 && parts[1]) {
				const bg = parseInt(parts[1], 10);
				// Lower numbers typically indicate darker backgrounds
				if (bg >= 0 && bg <= 7) {
					return 'dark';
				} else if (bg >= 8 && bg <= 15) {
					return 'light';
				}
			}
		}

		// Check terminal type
		if (term && (term.includes('dark') || term.includes('256color'))) {
			return 'dark';
		}

		// Default to dark theme for most terminal environments
		return 'dark';
	}

	private loadThemesFromFile() {
		try {
			// Embedded themes data
			const themesConfig = {
				"themes": [
					{
						"name": "Default Dark",
						"type": "built-in",
						"colors": {
							"primary": "cyan",
							"accent": "yellow",
							"error": "red",
							"warning": "yellow",
							"success": "green",
							"text": "white",
							"secondary": "gray",
							"border": "gray",
							"input": "white",
							"selection": "cyan"
						},
						"preview": "Dark theme with cyan accents"
					},
					{
						"name": "Default Light",
						"type": "built-in",
						"colors": {
							"primary": "blue",
							"accent": "magenta",
							"error": "red",
							"warning": "yellow",
							"success": "green",
							"text": "black",
							"secondary": "gray",
							"border": "gray",
							"input": "black",
							"selection": "blue"
						},
						"preview": "Light theme with blue accents"
					},
					{
						"name": "Dracula",
						"type": "built-in",
						"colors": {
							"primary": "magenta",
							"accent": "cyan",
							"error": "red",
							"warning": "yellow",
							"success": "green",
							"text": "white",
							"secondary": "gray",
							"border": "gray",
							"input": "white",
							"selection": "magenta"
						},
						"preview": "Purple theme with cyan accents"
					},
					{
						"name": "GitHub Dark",
						"type": "built-in",
						"colors": {
							"primary": "blue",
							"accent": "red",
							"error": "red",
							"warning": "yellow",
							"success": "green",
							"text": "white",
							"secondary": "gray",
							"border": "gray",
							"input": "white",
							"selection": "blue"
						},
						"preview": "GitHub-style dark theme"
					},
					{
						"name": "GitHub Light",
						"type": "built-in",
						"colors": {
							"primary": "blue",
							"accent": "red",
							"error": "red",
							"warning": "yellow",
							"success": "green",
							"text": "black",
							"secondary": "gray",
							"border": "gray",
							"input": "black",
							"selection": "blue"
						},
						"preview": "GitHub-style light theme"
					}
				]
			};
			
			themesConfig.themes.forEach((themeConfig: any) => {
				const theme = new CustomTheme(themeConfig.name, {
					colors: themeConfig.colors,
					gradients: themeConfig.gradients,
					preview: themeConfig.preview
				});
				this.registerTheme(theme);
			});
			
			// Auto-select theme based on system detection
			const systemTheme = this.detectSystemTheme();
			const defaultThemeName = systemTheme === 'dark' ? 'Default Dark' : 'Default Light';
			this.setActiveTheme(defaultThemeName);
		} catch (error) {
			console.error('Failed to load embedded themes:', error);
			// Fallback to default theme
			const systemTheme = this.detectSystemTheme();
			this.registerDefaultTheme();
			const defaultThemeName = systemTheme === 'dark' ? 'Default Dark' : 'Default Light';
			this.setActiveTheme(defaultThemeName);
		}
	}

	private registerDefaultTheme() {
		// Register both light and dark fallback themes
		const lightTheme = new CustomTheme('Default Light', {
			colors: {
				primary: 'blue',
				accent: 'magenta',
				error: 'red',
				warning: 'yellow',
				success: 'green',
				text: 'black',
				secondary: 'gray',
				border: 'gray',
				input: 'black',
				selection: 'blue'
			},
			preview: 'Default light theme'
		});
		
		const darkTheme = new CustomTheme('Default Dark', {
			colors: {
				primary: 'cyan',
				accent: 'yellow',
				error: 'red',
				warning: 'yellow',
				success: 'green',
				text: 'white',
				secondary: 'gray',
				border: 'gray',
				input: 'white',
				selection: 'cyan'
			},
			preview: 'Default dark theme'
		});
		
		this.registerTheme(lightTheme);
		this.registerTheme(darkTheme);
	}

	registerTheme(theme: Theme): void {
		this.themes.set(theme.name, theme);
	}

	setActiveTheme(themeName: string): boolean {
		const theme = this.themes.get(themeName);
		if (theme) {
			this.activeTheme = theme;
			return true;
		}
		return false;
	}

	getActiveTheme(): Theme | null {
		return this.activeTheme;
	}

	getTheme(themeName: string): Theme | undefined {
		return this.themes.get(themeName);
	}

	getAllThemes(): Theme[] {
		return Array.from(this.themes.values());
	}

	loadCustomThemes(customThemes: Record<string, CustomThemeConfig>) {
		Object.entries(customThemes).forEach(([name, themeConfig]) => {
			const theme = new CustomTheme(name, themeConfig);
			this.registerTheme(theme);
		});
	}

	getThemeNames(): string[] {
		return Array.from(this.themes.keys());
	}

	reloadThemes(): void {
		this.themes.clear();
		this.loadThemesFromFile();
	}
}

// Singleton instance
export const themeManager = new ThemeManager(); 