import { useState } from 'react'
import MinimalChat from './MinimalChat'
import AssistantChat from './AssistantChat'
import LangGraphChat from './LangGraphChat'

const UI_MODES = {
  MINIMAL: 'minimal',
  ASSISTANT: 'assistant',
  LANGGRAPH: 'langgraph',
}

function App() {
  const [uiMode, setUiMode] = useState(UI_MODES.MINIMAL)

  return (
    <div className="app-wrapper">
      <div className="ui-toggle">
        <button
          className={uiMode === UI_MODES.MINIMAL ? 'active' : ''}
          onClick={() => setUiMode(UI_MODES.MINIMAL)}
        >
          Minimal
        </button>
        <button
          className={uiMode === UI_MODES.ASSISTANT ? 'active' : ''}
          onClick={() => setUiMode(UI_MODES.ASSISTANT)}
        >
          ExternalStore
        </button>
        <button
          className={uiMode === UI_MODES.LANGGRAPH ? 'active' : ''}
          onClick={() => setUiMode(UI_MODES.LANGGRAPH)}
        >
          LangGraph
        </button>
      </div>

      {uiMode === UI_MODES.MINIMAL && <MinimalChat />}
      {uiMode === UI_MODES.ASSISTANT && <AssistantChat />}
      {uiMode === UI_MODES.LANGGRAPH && <LangGraphChat />}
    </div>
  )
}

export default App
