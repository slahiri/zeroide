# Gemini CLI Architecture Design

## Overview
The Gemini CLI is a React-based terminal application built with Ink that provides an interactive chat interface with AI capabilities. It operates in two main modes: **Setup Mode** and **Chat Mode**.

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GEMINI CLI                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Setup Mode    │    │   Chat Mode     │    │ Non-Interactive │
│  │   (Initial)     │    │  (Interactive)  │    │    Mode     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Configuration │    │   UI Layer      │    │   Core      │ │
│  │   Management    │    │   (Ink/React)   │    │   Services  │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Authentication│    │   Theme System  │    │   Tools     │ │
│  │   & Auth Types  │    │   & Styling     │    │   Registry  │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key NPM Libraries:
- **ink**: Terminal UI framework for React
- **react**: UI library for component-based architecture
- **@google/genai**: Google's Generative AI SDK
- **chalk**: Terminal string styling
- **strip-json-comments**: JSON parsing with comments support

### Main Entry Point:
```typescript
// packages/cli/src/gemini.tsx
export async function main() {
  setupUnhandledRejectionHandler();
  const workspaceRoot = process.cwd();
  const settings = loadSettings(workspaceRoot);
  
  const argv = await parseArguments();
  const extensions = loadExtensions(workspaceRoot);
  const config = await loadCliConfig(settings.merged, extensions, sessionId, argv);
  
  // Determine mode and render appropriate UI
  if (shouldBeInteractive) {
    const instance = render(
      <React.StrictMode>
        <AppWrapper config={config} settings={settings} startupWarnings={startupWarnings} version={version} />
      </React.StrictMode>,
      { exitOnCtrlC: false }
    );
  } else {
    await runNonInteractive(nonInteractiveConfig, input, prompt_id);
  }
}
```

## 2. Application Entry Point Flow

```
┌─────────────────┐
│   main()        │
│   Entry Point   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Load Settings   │
│ • System        │
│ • User          │
│ • Workspace     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Parse Arguments │
│ • CLI flags     │
│ • Environment   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Load Extensions │
│ • MCP Servers   │
│ • Custom Tools  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Initialize      │
│ Configuration   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Check Auth      │
│ & Sandbox       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Determine Mode  │
│ • Interactive   │
│ • Non-Interactive│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│ Interactive     │    │ Non-Interactive │
│ Mode            │    │ Mode            │
│ • Render UI     │    │ • Process Input │
│ • Show Dialogs  │    │ • Stream Output │
│ • Handle Input  │    │ • Exit          │
└─────────────────┘    └─────────────────┘
```

### Configuration Loading:
```typescript
// packages/cli/src/config/settings.ts
export function loadSettings(workspaceDir: string): LoadedSettings {
  const systemSettings = loadSettingsFile(getSystemSettingsPath());
  const userSettings = loadSettingsFile(USER_SETTINGS_PATH);
  const workspaceSettings = loadSettingsFile(path.join(workspaceDir, SETTINGS_DIRECTORY_NAME, 'settings.json'));
  
  return new LoadedSettings(systemSettings, userSettings, workspaceSettings, errors);
}

// packages/cli/src/config/config.ts
export async function loadCliConfig(
  settings: Settings,
  extensions: Extension[],
  sessionId: string,
  argv: CliArgs
): Promise<Config> {
  const config = new Config(settings, extensions, sessionId, argv);
  await config.initialize();
  return config;
}
```

## 3. Setup Mode Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SETUP MODE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   App Renders   │                                            │
│  │   (First Time)  │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │ Check Auth      │                                            │
│  │ Status          │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Auth Dialog   │    │  Theme Dialog   │    │ Editor      │ │
│  │   (if needed)   │    │  (if needed)    │    │ Settings    │ │
│  │                 │    │                 │    │ Dialog      │ │
│  │ • Login Google  │    │ • Built-in      │    │ • VSCode    │ │
│  │ • API Key       │    │ • Custom        │    │ • Vim       │ │
│  │ • Cloud Shell   │    │ • Preview       │    │ • Nano      │ │
│  │ • Vertex AI     │    │ • Apply         │    │ • Apply     │ │
│  └─────────┬───────┘    └─────────┬───────┘    └─────┬───────┘ │
│            │                      │                  │         │
│            ▼                      ▼                  ▼         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Save Auth     │    │   Save Theme    │    │ Save Editor │ │
│  │   Settings      │    │   Settings      │    │ Settings    │ │
│  └─────────┬───────┘    └─────────┬───────┘    └─────┬───────┘ │
│            │                      │                  │         │
│            └──────────────────────┼──────────────────┘         │
│                                   │                            │
│                                   ▼                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Setup Complete - Enter Chat Mode               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Chat Mode Implementation:
```typescript
// packages/cli/src/ui/App.tsx
const App = ({ config, settings, startupWarnings = [], version }: AppProps) => {
  const { history, addItem } = useHistory();
  const { streamingState, submitQuery } = useGeminiStream(geminiClient, history, addItem, setShowHelp, config);
  
  return (
    <StreamingContext.Provider value={streamingState}>
      <Box flexDirection="column" width="90%">
        {/* Header with ASCII logo and tips */}
        <Static items={[<Header terminalWidth={terminalWidth} version={version} />, <Tips config={config} />]}>
          {(item) => item}
        </Static>
        
        {/* Message history - static area */}
        <Static items={history.map(h => <HistoryItemDisplay key={h.id} item={h} />)}>
          {(item) => item}
        </Static>
        
        {/* Dynamic streaming area */}
        <Box ref={pendingHistoryItemRef}>
          {pendingHistoryItems.map((item, i) => (
            <HistoryItemDisplay key={i} item={item} isPending={true} />
          ))}
        </Box>
        
        {/* Input area */}
        <InputPrompt
          buffer={buffer}
          onSubmit={handleFinalSubmit}
          config={config}
          slashCommands={slashCommands}
        />
        
        {/* Footer with model info and stats */}
        <Footer model={currentModel} targetDir={config.getTargetDir()} />
      </Box>
    </StreamingContext.Provider>
  );
};
```

### Key UI Components:
```typescript
// packages/cli/src/ui/components/Header.tsx
export const Header: React.FC<HeaderProps> = ({ terminalWidth, version, nightly }) => {
  const displayTitle = terminalWidth >= widthOfLongLogo ? longAsciiLogo : shortAsciiLogo;
  
  return (
    <Box alignItems="flex-start" width={artWidth} flexDirection="column">
      <Gradient colors={Colors.GradientColors}>
        <Text>{displayTitle}</Text>
      </Gradient>
      {nightly && <Text>v{version}</Text>}
    </Box>
  );
};

// packages/cli/src/ui/components/InputPrompt.tsx
export const InputPrompt: React.FC<InputPromptProps> = ({ buffer, onSubmit, config, slashCommands }) => {
  const completion = useCompletion(buffer, config.getTargetDir(), slashCommands);
  
  return (
    <Box flexDirection="column">
      <TextBuffer buffer={buffer} />
      <SuggestionsDisplay suggestions={completion.suggestions} />
    </Box>
  );
};
```

## 4. Chat Mode Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHAT MODE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    HEADER                                  │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │ │
│  │  │   ASCII Logo    │  │   Version       │  │   Tips      │ │ │
│  │  │   (Gemini)      │  │   Info          │  │   Display   │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  MESSAGE HISTORY                            │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Static Area (Previous Messages)                        │ │ │
│  │  │  • User Messages                                        │ │ │
│  │  │  • AI Responses                                          │ │ │
│  │  │  • Tool Outputs                                          │ │ │
│  │  │  • Error Messages                                        │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Dynamic Area (Current Stream)                          │ │ │
│  │  │  • Streaming Response                                   │ │ │
│  │  │  • Loading Indicators                                   │ │ │
│  │  │  • Tool Execution Status                                │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  INPUT AREA                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Input Prompt                                           │ │ │
│  │  │  • Text Buffer                                          │ │ │
│  │  │  • Suggestions                                          │ │ │
│  │  │  • Slash Commands                                       │ │ │
│  │  │  • File References (@path)                              │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    FOOTER                                  │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │ │
│  │  │   Model Info    │  │   Sandbox       │  │   Stats     │ │ │
│  │  │   & Path        │  │   Status        │  │   & Errors  │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Structure:
```typescript
// packages/cli/src/ui/App.tsx
export const AppWrapper = (props: AppProps) => (
  <VimModeProvider>
    <SessionStatsProvider>
      <App {...props} />
    </SessionStatsProvider>
  </VimModeProvider>
);

// packages/cli/src/ui/contexts/SessionContext.tsx
export const SessionStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<SessionStats>({
    lastPromptTokenCount: 0,
    totalTokens: 0,
    turnCount: 0
  });
  
  return (
    <SessionStatsContext.Provider value={{ stats, setStats }}>
      {children}
    </SessionStatsContext.Provider>
  );
};
```

### Custom Hooks:
```typescript
// packages/cli/src/ui/hooks/useGeminiStream.ts
export const useGeminiStream = (
  geminiClient: GeminiClient,
  history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  config: Config
) => {
  const [streamingState, setStreamingState] = useState<StreamingState>(StreamingState.Idle);
  const [pendingHistoryItems, setPendingHistoryItems] = useState<HistoryItemWithoutId[]>([]);
  
  const submitQuery = useCallback(async (input: string) => {
    setStreamingState(StreamingState.Responding);
    // ... streaming logic
  }, [geminiClient, addItem]);
  
  return { streamingState, submitQuery, pendingHistoryItems };
};

// packages/cli/src/ui/hooks/useHistoryManager.ts
export const useHistory = (): UseHistoryManagerReturn => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const addItem = useCallback((item: Omit<HistoryItem, 'id'>, timestamp: number) => {
    const newItem: HistoryItem = { ...item, id: Date.now() };
    setHistory(prev => [...prev, newItem]);
  }, []);
  
  return { history, addItem, clearItems: () => setHistory([]) };
};
```

## 5. Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   AppWrapper    │                                            │
│  │   (Root)        │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │      App        │                                            │
│  │   (Main Logic)  │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    UI COMPONENTS                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Header    │  │   Footer    │  │   InputPrompt       │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │                                                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ ThemeDialog │  │ AuthDialog  │  │ EditorSettingsDialog│ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │                                                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │HistoryItem  │  │LoadingIndic │  │   Suggestions       │ │ │
│  │  │Display      │  │ator         │  │   Display           │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Implementation:
```typescript
// packages/cli/src/ui/hooks/useGeminiStream.ts
export const useGeminiStream = (
  geminiClient: GeminiClient,
  history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  config: Config
) => {
  const submitQuery = useCallback(async (input: string) => {
    // 1. Add user message to history
    addItem({ type: MessageType.USER, text: input }, Date.now());
    
    // 2. Initialize streaming state
    setStreamingState(StreamingState.Responding);
    
    // 3. Send to Gemini API
    const chat = await geminiClient.getChat();
    const responseStream = await chat.sendMessageStream({
      message: [{ role: 'user', parts: [{ text: input }] }],
      config: { tools: toolRegistry.getFunctionDeclarations() }
    });
    
    // 4. Process streaming response
    for await (const response of responseStream) {
      if (response.candidates?.[0]?.content?.parts) {
        const text = response.candidates[0].content.parts
          .filter(part => part.text)
          .map(part => part.text)
          .join('');
        
        // 5. Update UI with streaming text
        setPendingHistoryItems(prev => [...prev, { type: MessageType.ASSISTANT, text }]);
      }
    }
    
    // 6. Finalize response
    setStreamingState(StreamingState.Idle);
  }, [geminiClient, addItem]);
  
  return { submitQuery, streamingState };
};
```

### Tool Execution Flow:
```typescript
// packages/cli/src/ui/hooks/useReactToolScheduler.ts
export const useReactToolScheduler = () => {
  const [trackedToolCalls, setTrackedToolCalls] = useState<TrackedToolCall[]>([]);
  
  const executeToolCall = useCallback(async (toolCall: FunctionCall) => {
    // 1. Add tool call to tracking
    setTrackedToolCalls(prev => [...prev, { ...toolCall, status: ToolCallStatus.Pending }]);
    
    // 2. Execute tool
    const result = await executeToolCall(toolCall);
    
    // 3. Update status
    setTrackedToolCalls(prev => prev.map(tc => 
      tc.name === toolCall.name 
        ? { ...tc, status: ToolCallStatus.Completed, result }
        : tc
    ));
  }, []);
  
  return { trackedToolCalls, executeToolCall };
};
```

## 6. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   User Input    │                                            │
│  │   (Text/Commands)│                                           │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   InputPrompt   │                                            │
│  │   Component     │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   useGeminiStream│                                           │
│  │   Hook          │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   Gemini Client │                                            │
│  │   (API)         │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   Tool Registry │                                            │
│  │   (if needed)   │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   Stream        │                                            │
│  │   Processing    │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   History       │                                            │
│  │   Management    │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   UI Update     │                                            │
│  │   (Rendering)   │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### State Management Implementation:
```typescript
// packages/cli/src/ui/App.tsx
const App = ({ config, settings, startupWarnings = [], version }: AppProps) => {
  // Local state for UI components
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInputActive, setIsInputActive] = useState<boolean>(true);
  
  // Context state
  const { stats: sessionStats } = useSessionStats();
  const { vimMode, vimHandleInput } = useVimMode();
  
  // Settings state
  const [currentModel, setCurrentModel] = useState(config.getModel());
  const [shellModeActive, setShellModeActive] = useState(false);
  
  // State update handlers
  const handleModelChange = useCallback((newModel: string) => {
    setCurrentModel(newModel);
    config.setModel(newModel);
  }, [config]);
  
  const handleThemeChange = useCallback((theme: string) => {
    settings.setValue(SettingScope.User, 'theme', theme);
    themeManager.setActiveTheme(theme);
  }, [settings]);
};
```

### Context Providers:
```typescript
// packages/cli/src/ui/contexts/StreamingContext.tsx
export const StreamingContext = createContext<StreamingState>(StreamingState.Idle);

// packages/cli/src/ui/contexts/SessionContext.tsx
interface SessionStats {
  lastPromptTokenCount: number;
  totalTokens: number;
  turnCount: number;
}

export const SessionStatsContext = createContext<{
  stats: SessionStats;
  setStats: React.Dispatch<React.SetStateAction<SessionStats>>;
}>({ stats: { lastPromptTokenCount: 0, totalTokens: 0, turnCount: 0 }, setStats: () => {} });

// packages/cli/src/ui/contexts/VimModeContext.tsx
export const VimModeContext = createContext<{
  vimMode: VimMode;
  vimHandleInput: (key: Key) => boolean;
}>({ vimMode: VimMode.Normal, vimHandleInput: () => false });
```

## 7. State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Local State   │    │   Context       │    │   Settings  │ │
│  │   (useState)    │    │   (React)       │    │   (Config)  │ │
│  │                 │    │                 │    │             │ │
│  │ • Dialog States │    │ • Session Stats │    │ • Theme     │ │
│  │ • Input Buffer  │    │ • Streaming     │    │ • Auth      │ │
│  │ • UI State      │    │ • Focus         │    │ • Tools     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│            │                      │                  │         │
│            └──────────────────────┼──────────────────┘         │
│                                   │                            │
│                                   ▼                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    STATE FLOW                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Input     │  │   Process   │  │   Update UI         │ │ │
│  │  │   Change    │  │   State     │  │   Components        │ │ │
│  │  └─────┬───────┘  └─────┬───────┘  └─────────┬───────────┘ │ │
│  │        │                │                    │             │ │
│  │        └────────────────┼────────────────────┘             │ │
│  │                         │                                  │ │
│  │                         ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              Re-render Cycle                            │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Implementation:
```typescript
// packages/cli/src/ui/hooks/useAuthCommand.ts
export const useAuthCommand = (
  settings: LoadedSettings,
  setAuthError: (error: string | null) => void,
  config: Config
) => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(
    settings.merged.selectedAuthType === undefined
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthSelect = useCallback(
    async (authType: AuthType | undefined, scope: SettingScope) => {
      if (authType) {
        await clearCachedCredentialFile();
        settings.setValue(scope, 'selectedAuthType', authType);
        
        if (authType === AuthType.LOGIN_WITH_GOOGLE && config.isBrowserLaunchSuppressed()) {
          console.log('Logging in with Google... Please restart Gemini CLI to continue.');
          process.exit(0);
        }
      }
      setIsAuthDialogOpen(false);
      setAuthError(null);
    },
    [settings, setAuthError, config]
  );

  return { isAuthDialogOpen, openAuthDialog, handleAuthSelect, isAuthenticating };
};
```

### Auth Types and Configuration:
```typescript
// packages/cli/src/config/auth.ts
export enum AuthType {
  LOGIN_WITH_GOOGLE = 'LOGIN_WITH_GOOGLE',
  USE_GEMINI = 'USE_GEMINI',
  USE_VERTEX_AI = 'USE_VERTEX_AI',
  CLOUD_SHELL = 'CLOUD_SHELL'
}

export function validateAuthMethod(authType: AuthType): string | null {
  switch (authType) {
    case AuthType.LOGIN_WITH_GOOGLE:
      return process.env.GEMINI_CLI_NO_BROWSER ? 'Browser launch is disabled' : null;
    case AuthType.USE_GEMINI:
      return process.env.GEMINI_API_KEY ? null : 'GEMINI_API_KEY not set';
    case AuthType.USE_VERTEX_AI:
      return process.env.GOOGLE_APPLICATION_CREDENTIALS ? null : 'GOOGLE_APPLICATION_CREDENTIALS not set';
    default:
      return null;
  }
}

// packages/cli/src/ui/components/AuthDialog.tsx
export function AuthDialog({ onSelect, settings, initialErrorMessage }: AuthDialogProps) {
  const items = [
    { label: 'Login with Google', value: AuthType.LOGIN_WITH_GOOGLE },
    { label: 'Use Gemini API Key', value: AuthType.USE_GEMINI },
    { label: 'Vertex AI', value: AuthType.USE_VERTEX_AI }
  ];

  return (
    <Box flexDirection="column">
      <Text>Select authentication method:</Text>
      <RadioButtonSelect items={items} onSelect={(authType) => onSelect(authType, SettingScope.User)} />
    </Box>
  );
}
```

## 8. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   App Start     │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │ Check Auth      │                                            │
│  │ Settings        │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   No Auth       │    │   Auth Found    │    │   Auth      │ │
│  │   Configured    │    │   (Valid)       │    │   Error     │ │
│  └─────────┬───────┘    └─────────┬───────┘    └─────┬───────┘ │
│            │                      │                  │         │
│            ▼                      ▼                  ▼         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Show Auth     │    │   Initialize    │    │   Show Auth │ │
│  │   Dialog        │    │   Client        │    │   Dialog    │ │
│  └─────────┬───────┘    └─────────┬───────┘    └─────┬───────┘ │
│            │                      │                  │         │
│            ▼                      │                  │         │
│  ┌─────────────────┐              │                  │         │
│  │   Auth Types    │              │                  │         │
│  │                 │              │                  │         │
│  │ • Google Login  │              │                  │         │
│  │ • API Key       │              │                  │         │
│  │ • Cloud Shell   │              │                  │         │
│  │ • Vertex AI     │              │                  │         │
│  └─────────┬───────┘              │                  │         │
│            │                      │                  │         │
│            ▼                      │                  │         │
│  ┌─────────────────┐              │                  │         │
│  │   Save Auth     │              │                  │         │
│  │   Settings      │              │                  │         │
│  └─────────┬───────┘              │                  │         │
│            │                      │                  │         │
│            └──────────────────────┼──────────────────┘         │
│                                   │                            │
│                                   ▼                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Authentication Complete                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Theme System Implementation:
```typescript
// packages/cli/src/ui/themes/theme-manager.ts
export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private activeTheme: Theme | null = null;

  constructor() {
    this.registerBuiltInThemes();
  }

  private registerBuiltInThemes() {
    this.registerTheme(new DefaultDark());
    this.registerTheme(new DefaultLight());
    this.registerTheme(new DraculaTheme());
    this.registerTheme(new GitHubTheme());
    // ... more themes
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

  loadCustomThemes(customThemes: Record<string, CustomTheme>) {
    Object.entries(customThemes).forEach(([name, themeConfig]) => {
      const theme = new CustomTheme(name, themeConfig);
      this.registerTheme(theme);
    });
  }
}

export const themeManager = new ThemeManager();
```

### Theme Definition:
```typescript
// packages/cli/src/ui/themes/theme.ts
export interface Theme {
  name: string;
  type: 'built-in' | 'custom';
  colors: {
    primary: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
    gray: string;
    lightBlue: string;
  };
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
}

// packages/cli/src/ui/themes/default.ts
export class DefaultDark implements Theme {
  name = 'default';
  type = 'built-in' as const;
  colors = {
    primary: '#ffffff',
    accent: '#00ff00',
    error: '#ff0000',
    warning: '#ffff00',
    success: '#00ff00',
    gray: '#888888',
    lightBlue: '#87ceeb'
  };
}
```

### Theme Hook:
```typescript
// packages/cli/src/ui/hooks/useThemeCommand.ts
export const useThemeCommand = (
  loadedSettings: LoadedSettings,
  setThemeError: (error: string | null) => void,
  addItem: (item: Omit<HistoryItem, 'id'>, timestamp: number) => void
): UseThemeCommandReturn => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const handleThemeSelect = useCallback(
    (themeName: string | undefined, scope: SettingScope) => {
      try {
        loadedSettings.setValue(scope, 'theme', themeName);
        if (loadedSettings.merged.customThemes) {
          themeManager.loadCustomThemes(loadedSettings.merged.customThemes);
        }
        themeManager.setActiveTheme(loadedSettings.merged.theme);
        setThemeError(null);
      } finally {
        setIsThemeDialogOpen(false);
      }
    },
    [loadedSettings, setThemeError]
  );

  return { isThemeDialogOpen, openThemeDialog, handleThemeSelect, handleThemeHighlight };
};
```

## 9. Theme System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    THEME SYSTEM                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   ThemeManager  │                                            │
│  │   (Singleton)   │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    THEME TYPES                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Built-in  │  │   Custom    │  │   Default           │ │ │
│  │  │   Themes    │  │   Themes    │  │   Theme             │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Dark      │  │ • User      │  │ • Fallback          │ │ │
│  │  │ • Light     │  │   Defined   │  │ • System            │ │ │
│  │  │ • Dracula   │  │ • Workspace │  │   Default           │ │ │
│  │  │ • GitHub    │  │   Defined   │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    THEME COMPONENTS                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Colors    │  │   Gradients │  │   Text Styles       │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ • Primary   │  │ • Logo      │  │ • Headers           │ │ │
│  │  │ • Accent    │  │ • Text      │  │ • Messages          │ │ │
│  │  │ • Error     │  │ • Borders   │  │ • Input             │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tool Execution Implementation:
```typescript
// packages/cli/src/ui/hooks/useReactToolScheduler.ts
export const useReactToolScheduler = () => {
  const [trackedToolCalls, setTrackedToolCalls] = useState<TrackedToolCall[]>([]);

  const executeToolCall = useCallback(async (toolCall: FunctionCall) => {
    // 1. Add to tracking with pending status
    setTrackedToolCalls(prev => [...prev, {
      ...toolCall,
      status: ToolCallStatus.Pending,
      startTime: Date.now()
    }]);

    try {
      // 2. Execute the tool
      const result = await executeToolCall(toolCall);
      
      // 3. Update with completed status
      setTrackedToolCalls(prev => prev.map(tc => 
        tc.name === toolCall.name 
          ? { ...tc, status: ToolCallStatus.Completed, result, endTime: Date.now() }
          : tc
      ));
      
      return result;
    } catch (error) {
      // 4. Update with error status
      setTrackedToolCalls(prev => prev.map(tc => 
        tc.name === toolCall.name 
          ? { ...tc, status: ToolCallStatus.Error, error, endTime: Date.now() }
          : tc
      ));
      throw error;
    }
  }, []);

  return { trackedToolCalls, executeToolCall };
};
```

### Tool Registry and Types:
```typescript
// packages/cli/src/core/tools/tool-registry.ts
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  getFunctionDeclarations() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(args);
  }
}

// Built-in tools
export const fileReadTool: Tool = {
  name: 'read_file',
  description: 'Read contents of a file',
  parameters: [{ name: 'path', type: 'string', description: 'File path' }],
  execute: async (args: { path: string }) => {
    return await fs.readFile(args.path, 'utf-8');
  }
};

export const shellTool: Tool = {
  name: 'shell',
  description: 'Execute shell command',
  parameters: [{ name: 'command', type: 'string', description: 'Shell command' }],
  execute: async (args: { command: string }) => {
    return await exec(args.command);
  }
};
```

### MCP Server Integration:
```typescript
// packages/cli/src/core/tools/mcp-tool.ts
export class McpTool implements Tool {
  constructor(
    private serverName: string,
    private mcpClient: McpClient
  ) {}

  async execute(args: any) {
    const response = await this.mcpClient.callTool({
      name: this.name,
      arguments: args
    });
    return response.result;
  }
}

// packages/cli/src/core/tools/mcp-client.ts
export class McpClient {
  constructor(private serverConfig: McpServerConfig) {}

  async callTool(request: ToolCallRequest): Promise<ToolCallResponse> {
    // Implementation for MCP protocol communication
    const response = await this.sendRequest(request);
    return response;
  }
}
```

## 10. Tool Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOOL EXECUTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   AI Request    │                                            │
│  │   (with tools)  │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   Tool Call     │                                            │
│  │   Detection     │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐                                            │
│  │   Tool Registry │                                            │
│  │   Lookup        │                                            │
│  └─────────┬───────┘                                            │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Built-in      │    │   MCP Server    │    │   Custom    │ │
│  │   Tools         │    │   Tools         │    │   Tools     │ │
│  │                 │    │                 │    │             │ │
│  │ • File Read     │    │ • External      │    │ • User      │ │
│  │ • File Write    │    │   Services      │    │   Defined   │ │
│  │ • Shell Exec    │    │ • Database      │    │ • Scripts   │ │
│  │ • Web Search    │    │ • APIs          │    │ • Commands  │ │
│  └─────────┬───────┘    └─────────┬───────┘    └─────┬───────┘ │
│            │                      │                  │         │
│            └──────────────────────┼──────────────────┘         │
│                                   │                            │
│                                   ▼                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    TOOL EXECUTION                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Execute   │  │   Stream    │  │   Format Output     │ │ │
│  │  │   Tool      │  │   Results   │  │   for Display       │ │ │
│  │  └─────┬───────┘  └─────┬───────┘  └─────────┬───────────┘ │ │
│  │        │                │                    │             │ │
│  │        └────────────────┼────────────────────┘             │ │
│  │                         │                                  │ │
│  │                         ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              Update UI with Results                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 11. Key Features Summary

### Setup Mode Features:
- **Authentication Setup**: Multiple auth methods (Google, API Key, Cloud Shell, Vertex AI)
- **Theme Configuration**: Built-in and custom themes with live preview
- **Editor Settings**: Configure preferred text editor
- **Privacy Notice**: User consent and data handling information

### Chat Mode Features:
- **Interactive Input**: Rich text input with suggestions and slash commands
- **Message History**: Persistent conversation history with static rendering
- **Streaming Responses**: Real-time AI response streaming
- **Tool Integration**: Built-in and external tool execution
- **File Context**: @path references for file inclusion
- **Vim Mode**: Advanced text editing capabilities
- **Error Handling**: Comprehensive error display and recovery

### Technical Features:
- **Sandbox Support**: Security isolation for tool execution
- **MCP Integration**: Model Context Protocol server support
- **Telemetry**: Usage analytics and error reporting
- **Memory Management**: Efficient memory usage and cleanup
- **Cross-platform**: Works on macOS, Windows, and Linux

### Key NPM Dependencies:
```json
{
  "dependencies": {
    "ink": "^4.4.1",
    "react": "^18.2.0",
    "@google/genai": "^0.2.1",
    "chalk": "^5.3.0",
    "strip-json-comments": "^5.2.0",
    "string-width": "^5.1.2",
    "ansi-escapes": "^5.0.0",
    "ink-gradient": "^2.0.0",
    "ink-select-input": "^4.0.0",
    "ink-text-input": "^5.0.0",
    "ink-spinner": "^5.0.0",
    "ink-progress-bar": "^1.0.0",
    "ink-table": "^2.0.0",
    "ink-big-text": "^1.2.0",
    "ink-confirm-input": "^1.0.0",
    "ink-multi-select": "^0.4.0",
    "ink-autocomplete": "^1.0.0",
    "ink-prompt": "^1.0.0",
    "ink-prompt-select": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## 12. File Structure Overview

```
packages/cli/src/
├── gemini.tsx              # Main entry point
├── nonInteractiveCli.ts    # Non-interactive mode
├── config/                 # Configuration management
│   ├── settings.ts         # Settings loading/saving
│   ├── auth.ts            # Authentication logic
│   └── extension.ts       # Extension loading
├── ui/                     # React UI components
│   ├── App.tsx            # Main app component
│   ├── components/        # UI components
│   │   ├── Header.tsx     # App header
│   │   ├── Footer.tsx     # App footer
│   │   ├── InputPrompt.tsx # Input handling
│   │   ├── ThemeDialog.tsx # Theme selection
│   │   └── AuthDialog.tsx # Auth selection
│   ├── hooks/             # Custom React hooks
│   │   ├── useGeminiStream.ts # AI streaming
│   │   ├── useThemeCommand.ts # Theme management
│   │   └── useAuthCommand.ts  # Auth management
│   └── themes/            # Theme definitions
└── utils/                 # Utility functions
    ├── cleanup.ts         # Cleanup handlers
    ├── sandbox.ts         # Sandbox management
    └── events.ts          # Event system
```

### Key Implementation Files:
```typescript
// packages/cli/src/gemini.tsx - Main entry point
export async function main() {
  // Application initialization and mode determination
}

// packages/cli/src/ui/App.tsx - Main React component
const App = ({ config, settings, startupWarnings, version }: AppProps) => {
  // Main UI logic and state management
};

// packages/cli/src/config/settings.ts - Settings management
export class LoadedSettings {
  // Hierarchical settings loading (System > User > Workspace)
}

// packages/cli/src/ui/hooks/useGeminiStream.ts - AI streaming
export const useGeminiStream = () => {
  // Real-time AI response streaming and tool execution
};

// packages/cli/src/ui/themes/theme-manager.ts - Theme system
export class ThemeManager {
  // Theme registration, switching, and custom theme support
};

// packages/cli/src/core/tools/tool-registry.ts - Tool system
export class ToolRegistry {
  // Built-in tools, MCP integration, and tool execution
};
```

### Package.json Scripts:
```json
{
  "scripts": {
    "build": "tsc && esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "vitest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "start": "node dist/index.js",
    "package": "npm run build && npm pack"
  }
}
```

This architecture provides a robust, extensible, and user-friendly CLI experience with comprehensive setup workflows and powerful interactive capabilities. 