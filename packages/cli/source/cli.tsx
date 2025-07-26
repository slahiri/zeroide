#!/usr/bin/env node
import React, {useState, useEffect} from 'react';
import {render, Text, Box, useInput, useApp} from 'ink';
import {themeManager, Theme} from './themes/theme-manager.js';

// Embedded logo
const getLogo = () => {
	const logoContent = `░▒▓████████▓▒░ ░▒▓████████▓▒░ ░▒▓███████▓▒░   ░▒▓██████▓▒░  ░▒▓█▓▒░ ░▒▓███████▓▒░  ░▒▓████████▓▒░ 
       ░▒▓█▓▒░ ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        
     ░▒▓██▓▒░  ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        
   ░▒▓██▓▒░    ░▒▓██████▓▒░   ░▒▓███████▓▒░  ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓██████▓▒░   
 ░▒▓██▓▒░      ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        
░▒▓█▓▒░        ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        
░▒▓████████▓▒░ ░▒▓████████▓▒░ ░▒▓█▓▒░░▒▓█▓▒░  ░▒▓██████▓▒░  ░▒▓█▓▒░ ░▒▓███████▓▒░  ░▒▓████████▓▒░`;
	return logoContent.split('\n').filter(line => line.trim());
};

// Custom components for the chat interface
const Logo = ({ theme }: { theme: Theme }) => {
	const [logoLines, setLogoLines] = useState<string[]>([]);

	useEffect(() => {
		setLogoLines(getLogo());
	}, []);

	return (
		<Box flexDirection="column" alignItems="center" marginBottom={2}>
			{logoLines.map((line, index) => (
				<Text key={index} color={theme.colors.primary}>{line}</Text>
			))}
		</Box>
	);
};

const Tips = ({ theme }: { theme: Theme }) => (
	<Box 
		borderStyle="round" 
		borderColor={theme.colors.border}
		paddingX={1}
		paddingY={0}
		marginBottom={2}
	>
		<Box flexDirection="column">
			<Text color={theme.colors.text} bold>Tips for getting started:</Text>
			<Text color={theme.colors.text}>1. Ask questions, edit files, or run commands.</Text>
			<Text color={theme.colors.text}>2. Be specific for the best results.</Text>
			<Text color={theme.colors.text}>3. <Text bold>/help</Text> for more information.</Text>
		</Box>
	</Box>
);

const ChatMessage = ({type, content, timestamp, theme}: {type: 'user' | 'ai' | 'tool' | 'status', content: string, timestamp?: string, theme: Theme}) => {
	const getPrefix = () => {
		switch (type) {
			case 'user':
				return <Text color={theme.colors.primary}>{'>'}</Text>;
			case 'ai':
				return <Text color={theme.colors.success}>◆</Text>;
			case 'tool':
				return <Text color={theme.colors.accent}>←</Text>;
			case 'status':
				return <Text color={theme.colors.warning}>:</Text>;
			default:
				return '';
		}
	};

	return (
		<Box marginBottom={1}>
			<Box marginRight={1}>
				{getPrefix()}
			</Box>
			<Box flexDirection="column" flexGrow={1}>
				<Text color={theme.colors.text}>{content}</Text>
				{timestamp && (
					<Text color={theme.colors.secondary} italic>{timestamp}</Text>
				)}
			</Box>
		</Box>
	);
};

const StatusBar = ({ theme }: { theme: Theme }) => (
	<Box 
		paddingX={1}
		justifyContent="space-between"
	>
		<Text color={theme.colors.text}>? for shortcuts</Text>
		<Box>
			<Text color={theme.colors.secondary}>{theme.name}</Text>
			<Text color={theme.colors.text}> | </Text>
			<Text color={theme.colors.primary}>cli.tsx</Text>
		</Box>
	</Box>
);

const Help = ({ theme }: { theme: Theme }) => (
	<Box flexDirection="column" marginBottom={1}>
		<Box justifyContent="space-between">
			<Box flexDirection="column" width="50%">
				<Text color={theme.colors.secondary} bold>Commands/Modes:</Text>
				<Text color={theme.colors.secondary}>! for bash mode</Text>
				<Text color={theme.colors.secondary}>/ for commands</Text>
				<Text color={theme.colors.secondary}>@ for file paths</Text>
				<Text color={theme.colors.secondary}># to memorize</Text>
			</Box>
			<Box flexDirection="column" width="50%">
				<Text color={theme.colors.secondary} bold>Shortcuts (? for this help):</Text>
				<Text color={theme.colors.secondary}>double tap esc to clear input</Text>
				<Text color={theme.colors.secondary}>shift + tab to auto-accept edits</Text>
				<Text color={theme.colors.secondary}>ctrl + r for verbose output</Text>
				<Text color={theme.colors.secondary}>option + ↵ for newline</Text>
				<Text color={theme.colors.secondary}>ctrl + _ to undo</Text>
				<Text color={theme.colors.secondary}>ctrl + z to suspend</Text>
			</Box>
		</Box>
	</Box>
);

const ExitConfirmation = ({ theme }: { theme: Theme }) => (
	<Box flexDirection="column" marginBottom={1}>
		<Text color={theme.colors.secondary}>Press Ctrl+C again to exit or ESC to cancel</Text>
	</Box>
);

const CommandPalette = ({ commands, selectedIndex, theme, scrollOffset }: { 
	commands: Array<{name: string, description: string}>, 
	selectedIndex: number, 
	theme: Theme,
	scrollOffset: number
}) => {
	const ITEMS_TO_SHOW = 5;
	const visibleCommands = commands.slice(scrollOffset, scrollOffset + ITEMS_TO_SHOW);
	
	return (
		<Box flexDirection="column" marginBottom={1}>
			{visibleCommands.map((command, index) => {
				const actualIndex = scrollOffset + index;
				return (
					<Text key={actualIndex} color={actualIndex === selectedIndex ? theme.colors.selection : theme.colors.secondary} bold={actualIndex === selectedIndex}>
						{command.name} {command.description}
					</Text>
				);
			})}
		</Box>
	);
};

const ThemeSelector = ({ 
	themes, 
	selectedTheme, 
	selectedThemeIndex
}: { 
	themes: Array<Theme>, 
	selectedTheme: string, 
	selectedThemeIndex: number
}) => {
	const selectedThemeObj = themes.find(t => t.name === selectedTheme) || themes[0];
	
	return (
		<Box flexDirection="row" height="100%">
			{/* Left Section - Theme Selection */}
			<Box flexDirection="column" width="50%" paddingX={1}>
				<Box marginBottom={1}>
					<Text color="white" bold>{'>'} Select Theme</Text>
				</Box>
				
				{/* Theme List */}
				<Box flexDirection="column" marginBottom={2}>
					{themes.map((theme, index) => (
						<Box key={index} marginBottom={1}>
							<Text color={selectedTheme === theme.name ? "green" : "white"} bold={index === selectedThemeIndex}>
								{selectedTheme === theme.name ? "●" : "○"} {theme.name}
							</Text>
							{theme.preview && (
								<Box marginLeft={2}>
									<Text color="gray" italic>{theme.preview}</Text>
								</Box>
							)}
						</Box>
					))}
				</Box>
				
				<Text color="gray" italic>(Use ↑/↓ to navigate, Enter to select)</Text>
				<Box marginTop={1}>
					<Text color="gray">Esc to cancel</Text>
				</Box>
			</Box>
			
			{/* Right Section - Live Preview */}
			<Box flexDirection="column" width="50%" paddingX={1}>
				<Box marginBottom={1}>
					<Text color="white" bold>Live Preview</Text>
				</Box>
				<Box 
					borderStyle="round" 
					borderColor={selectedThemeObj?.colors.border || "gray"}
					paddingX={1}
					paddingY={0}
					flexGrow={1}
				>
					<Box flexDirection="column">
						{/* Logo Preview */}
						<Box flexDirection="column" alignItems="center" marginBottom={1}>
							<Text color={selectedThemeObj?.colors.primary || "blue"}>ZeroIDE</Text>
						</Box>
						
						{/* Tips Preview */}
						<Box 
							borderStyle="round" 
							borderColor={selectedThemeObj?.colors.border || "gray"}
							paddingX={1}
							paddingY={0}
							marginBottom={1}
						>
							<Text color={selectedThemeObj?.colors.text || "white"} bold>Tips:</Text>
							<Text color={selectedThemeObj?.colors.text || "white"}>Type ? for help</Text>
						</Box>
						
						{/* Message Preview */}
						<Box marginBottom={1}>
							<Text color={selectedThemeObj?.colors.primary || "blue"}>{'>'}</Text>
							<Text color={selectedThemeObj?.colors.text || "white"}> User message</Text>
						</Box>
						<Box marginBottom={1}>
							<Text color={selectedThemeObj?.colors.success || "green"}>◆</Text>
							<Text color={selectedThemeObj?.colors.text || "white"}> AI response</Text>
						</Box>
						
						{/* Input Preview */}
						<Box 
							borderStyle="round" 
							borderColor={selectedThemeObj?.colors.border || "gray"}
							paddingX={1}
							paddingY={0}
						>
							<Text color={selectedThemeObj?.colors.primary || "blue"}>{'>'}</Text>
							<Text color={selectedThemeObj?.colors.input || "white"}> Type here...</Text>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

const InputBox = ({currentInput, placeholder, theme}: {currentInput: string, placeholder: string, theme: Theme}) => (
	<Box 
		borderStyle="round" 
		borderColor={theme.colors.border}
		paddingX={1}
		paddingY={0}
		marginBottom={1}
	>
		<Text color={theme.colors.primary}>{'>'}</Text>
		<Text color={theme.colors.input}> {currentInput}</Text>
		<Text color={theme.colors.input} inverse> </Text>
		{!currentInput && (
			<Text color={theme.colors.secondary} italic> {placeholder}</Text>
		)}
	</Box>
);

const ChatInterface = () => {
	const [messages, setMessages] = useState<Array<{type: 'user' | 'ai' | 'tool' | 'status', content: string, timestamp?: string}>>([]);
	const [currentInput, setCurrentInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [exitConfirmation, setExitConfirmation] = useState(false);
	const [showCommandPalette, setShowCommandPalette] = useState(false);
	const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
	const [commandScrollOffset, setCommandScrollOffset] = useState(0);
	const [showThemeSelector, setShowThemeSelector] = useState(false);
	const [selectedTheme, setSelectedTheme] = useState('Default Light');
	const [selectedThemeIndex, setSelectedThemeIndex] = useState(1); // Default Light index
	const [originalTheme, setOriginalTheme] = useState('Default Light'); // Track original theme for ESC
	const {exit: appExit} = useApp();

	// Get current theme object
	const getCurrentTheme = (): Theme => {
		const theme = themeManager.getTheme(selectedTheme);
		return theme || themeManager.getTheme('Default Light')!;
	};

	const commands = [
		{ name: '/help', description: 'Show detailed help and documentation' },
		{ name: '/select-theme', description: 'Choose a different theme' },
		{ name: '/exit', description: 'Exit the application' },
		{ name: '/clear', description: 'Clear chat history' },
		{ name: '/status', description: 'Show application status' },
		{ name: '/version', description: 'Show version information' },
		{ name: '/config', description: 'Show configuration' },
		{ name: '/about', description: 'About ZeroIDE CLI' }
	];







	useInput((input, key) => {
		if (key.escape) {
			if (exitConfirmation) {
				setExitConfirmation(false);
			} else if (showHelp) {
				setShowHelp(false);
			} else if (showCommandPalette) {
				setShowCommandPalette(false);
				setSelectedCommandIndex(0);
			} else if (showThemeSelector) {
				// Restore to original theme when ESC is pressed
				themeManager.setActiveTheme(originalTheme);
				setSelectedTheme(originalTheme);
				// Find the index of the original theme
				const allThemes = themeManager.getAllThemes();
				const originalIndex = allThemes.findIndex(t => t.name === originalTheme);
				if (originalIndex !== -1) {
					setSelectedThemeIndex(originalIndex);
				}
				setShowThemeSelector(false);
			} else if (currentInput) {
				// Clear input if there's text
				setCurrentInput('');
			}
			// Don't exit on ESC - only clear input or close dialogs
		}
		
		// If exit confirmation is active, only handle exit-related inputs
		if (exitConfirmation) {
			if (key.ctrl && input === 'c') {
				appExit();
				return;
			}
			if (input === 'q') {
				appExit();
				return;
			}
			// Any other input cancels the exit confirmation
			setExitConfirmation(false);
			return;
		}
		
		// Handle Ctrl+C for exit confirmation
		if (key.ctrl && input === 'c') {
			setExitConfirmation(true);
			setShowHelp(false); // Hide help when showing exit confirmation
			setShowCommandPalette(false); // Hide command palette when showing exit confirmation
			return;
		}
		
		if (input === 'q' && !currentInput) {
			setExitConfirmation(true);
			setShowHelp(false); // Hide help when showing exit confirmation
			setShowCommandPalette(false); // Hide command palette when showing exit confirmation
			return;
		}
		
		if (input === '?' && !currentInput) {
			setShowHelp(!showHelp);
			setShowCommandPalette(false); // Hide command palette when showing shortcut help
			setExitConfirmation(false); // Hide exit confirmation when showing help
			return;
		}
		
		// Show command palette when "/" is typed
		if (input === '/' && !currentInput) {
			setShowCommandPalette(true);
			setShowHelp(false); // Hide help when showing command palette
			setExitConfirmation(false); // Hide exit confirmation when showing command palette
			setSelectedCommandIndex(0);
			setCommandScrollOffset(0);
			setCurrentInput('/'); // Add / to input
			return;
		}
		
		// Handle command palette navigation
		if (showCommandPalette) {
			if (key.upArrow) {
				setSelectedCommandIndex(prev => {
					const newIndex = prev > 0 ? prev - 1 : commands.length - 1;
					// Adjust scroll offset if needed
					if (newIndex < commandScrollOffset) {
						setCommandScrollOffset(Math.max(0, newIndex));
					}
					return newIndex;
				});
				return;
			}
			if (key.downArrow) {
				setSelectedCommandIndex(prev => {
					const newIndex = prev < commands.length - 1 ? prev + 1 : 0;
					// Adjust scroll offset if needed
					if (newIndex >= commandScrollOffset + 5) {
						setCommandScrollOffset(Math.min(commands.length - 5, newIndex - 4));
					}
					return newIndex;
				});
				return;
			}
			if (key.return) {
				const selectedCommand = commands[selectedCommandIndex];
				if (selectedCommand) {
					if (selectedCommand.name === '/help') {
						// Add help dialog logic here
						const newMessage = {
							type: 'status' as const,
							content: 'Help dialog coming soon!',
							timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
						};
						setMessages(prev => [...prev, newMessage]);
					} else if (selectedCommand.name === '/select-theme') {
						// Save the current theme as original before opening selector
						const currentTheme = themeManager.getActiveTheme();
						if (currentTheme) {
							setOriginalTheme(currentTheme.name);
							// Find the index of the current theme
							const allThemes = themeManager.getAllThemes();
							const currentIndex = allThemes.findIndex(t => t.name === currentTheme.name);
							if (currentIndex !== -1) {
								setSelectedThemeIndex(currentIndex);
								setSelectedTheme(currentTheme.name);
							}
						}
						setShowThemeSelector(true);
					} else if (selectedCommand.name === '/exit') {
						// Exit the application
						appExit();
					}
				} else {
					// Unknown command - show error message
					const newMessage = {
						type: 'status' as const,
						content: `Command not found: ${currentInput}`,
						timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
					};
					setMessages(prev => [...prev, newMessage]);
				}
				setShowCommandPalette(false);
				setSelectedCommandIndex(0);
				setCurrentInput('');
				return;
			}
		}
		
		// Handle theme selector navigation
		if (showThemeSelector) {
			const allThemes = themeManager.getAllThemes();
			if (key.upArrow) {
				const newIndex = selectedThemeIndex > 0 ? selectedThemeIndex - 1 : allThemes.length - 1;
				setSelectedThemeIndex(newIndex);
				// Update the selected theme name as we navigate
				const theme = allThemes[newIndex];
				if (theme) {
					setSelectedTheme(theme.name);
				}
				return;
			}
			if (key.downArrow) {
				const newIndex = selectedThemeIndex < allThemes.length - 1 ? selectedThemeIndex + 1 : 0;
				setSelectedThemeIndex(newIndex);
				// Update the selected theme name as we navigate
				const theme = allThemes[newIndex];
				if (theme) {
					setSelectedTheme(theme.name);
				}
				return;
			}
			if (key.return) {
				const theme = allThemes[selectedThemeIndex];
				if (theme) {
					// Apply the theme permanently
					themeManager.setActiveTheme(theme.name);
					setShowThemeSelector(false); // Close the dialog after selection
					
					// Add a confirmation message
					const newMessage = {
						type: 'status' as const,
						content: `Theme changed to: ${theme.name}`,
						timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
					};
					setMessages(prev => [...prev, newMessage]);
				}
				return;
			}
		}
		
		if (key.return && currentInput.trim()) {
			// Add user message
			const newMessage = {
				type: 'user' as const,
				content: currentInput,
				timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
			};
			setMessages(prev => [...prev, newMessage]);
			setCurrentInput('');
			setIsLoading(true);

			// Simulate AI response after a delay
			setTimeout(() => {
				const aiResponse = {
					type: 'ai' as const,
					content: `I understand you're asking about "${newMessage.content}". Let me help you with that.`,
					timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
				};
				setMessages(prev => [...prev, aiResponse]);
				setIsLoading(false);
			}, 2000);
		} else if (key.backspace || key.delete) {
			const newInput = currentInput.slice(0, -1);
			setCurrentInput(newInput);
			
			// Hide command palette if / is deleted
			if (showCommandPalette && !newInput.startsWith('/')) {
				setShowCommandPalette(false);
				setSelectedCommandIndex(0);
			}
			
			// Auto-select command based on input
			if (showCommandPalette && newInput.startsWith('/')) {
				const searchTerm = newInput.slice(1).toLowerCase();
				const matchingIndex = commands.findIndex(cmd => 
					cmd.name.toLowerCase().includes(searchTerm) || 
					cmd.description.toLowerCase().includes(searchTerm)
				);
				setSelectedCommandIndex(matchingIndex >= 0 ? matchingIndex : -1); // -1 means no selection
			}
		} else if (input && input.length === 1) {
			const newInput = currentInput + input;
			setCurrentInput(newInput);
			
			// Auto-select command based on input
			if (showCommandPalette && newInput.startsWith('/')) {
				const searchTerm = newInput.slice(1).toLowerCase();
				const matchingIndex = commands.findIndex(cmd => 
					cmd.name.toLowerCase().includes(searchTerm) || 
					cmd.description.toLowerCase().includes(searchTerm)
				);
				setSelectedCommandIndex(matchingIndex >= 0 ? matchingIndex : -1); // -1 means no selection
			}
		}
	});

	const currentTheme = getCurrentTheme();
	
	return (
		<Box flexDirection="column" height="100%" padding={1}>
			{!showThemeSelector && (
				<>
					<Logo theme={currentTheme} />
					<Tips theme={currentTheme} />
					
					{/* Chat Area */}
					<Box flexDirection="column" flexGrow={1} marginBottom={2}>
						{messages.map((message, index) => (
							<ChatMessage 
								key={index}
								type={message.type}
								content={message.content}
								timestamp={message.timestamp}
								theme={currentTheme}
							/>
						))}
						
						{isLoading && (
							<Box marginBottom={1}>
								<Text color={currentTheme.colors.warning}>:</Text>
								<Text color={currentTheme.colors.text}> Processing your request</Text>
								<Text color={currentTheme.colors.secondary}> (esc to cancel, 2s)</Text>
							</Box>
						)}
					</Box>

					{/* Input Area */}
					<InputBox currentInput={currentInput} placeholder="Type your message..." theme={currentTheme} />

					{/* Help Section - Below Input Box */}
					{showHelp && <Help theme={currentTheme} />}

					{/* Command Palette */}
					{showCommandPalette && <CommandPalette commands={commands} selectedIndex={selectedCommandIndex} theme={currentTheme} scrollOffset={commandScrollOffset} />}

					{/* Exit Confirmation */}
					{exitConfirmation && <ExitConfirmation theme={currentTheme} />}

					<StatusBar theme={currentTheme} />
				</>
			)}

			{/* Theme Selector Dialog */}
			{showThemeSelector && (
				<Box 
					borderStyle="round" 
					borderColor="gray"
					padding={2}
					marginBottom={2}
				>
					<ThemeSelector 
						themes={themeManager.getAllThemes()}
						selectedTheme={selectedTheme}
						selectedThemeIndex={selectedThemeIndex}
					/>
				</Box>
			)}
		</Box>
	);
};

render(<ChatInterface />, { exitOnCtrlC: false });
