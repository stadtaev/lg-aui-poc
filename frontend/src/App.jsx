import { useState } from 'react'
import MinimalChat from './MinimalChat'
import AssistantChat from './AssistantChat'

function App() {
  const [useAssistantUI, setUseAssistantUI] = useState(false)

  return (
    <div className="app-wrapper">
      <div className="ui-toggle">
        <button
          className={!useAssistantUI ? 'active' : ''}
          onClick={() => setUseAssistantUI(false)}
        >
          Minimal UI
        </button>
        <button
          className={useAssistantUI ? 'active' : ''}
          onClick={() => setUseAssistantUI(true)}
        >
          Assistant UI
        </button>
      </div>

      {useAssistantUI ? <AssistantChat /> : <MinimalChat />}
    </div>
  )
}

export default App
