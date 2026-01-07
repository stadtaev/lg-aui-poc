import { useState, useCallback, useEffect } from 'react'
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react'

function convertMessage(msg) {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
  }
}

function AssistantChatInner({ threadId, setThreadId, onThreadCreated }) {
  const [messages, setMessages] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const onNew = useCallback(async (message) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.content,
    }
    setMessages(prev => [...prev, userMessage])
    setIsRunning(true)

    try {
      const res = await fetch('/chat-aui-es', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.content[0].text,
          thread_id: threadId,
        }),
      })
      const data = await res.json()

      if (!threadId) {
        setThreadId(data.thread_id)
        onThreadCreated?.()
      }

      setMessages(data.messages)
    } catch (err) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: [{ type: 'text', text: 'Error: Failed to get response' }],
      }])
    } finally {
      setIsRunning(false)
    }
  }, [threadId, setThreadId, onThreadCreated])

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    convertMessage,
    onNew,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="aui-thread">
        <ThreadPrimitive.Viewport className="aui-viewport">
          <ThreadPrimitive.Empty>
            <div className="aui-empty">Start a conversation</div>
          </ThreadPrimitive.Empty>
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessage,
              AssistantMessage: AssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>
        <Composer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="aui-message user">
      <span className="role">user</span>
      <MessagePrimitive.Content />
    </MessagePrimitive.Root>
  )
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="aui-message assistant">
      <span className="role">assistant</span>
      <MessagePrimitive.Content />
    </MessagePrimitive.Root>
  )
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="aui-composer">
      <ComposerPrimitive.Input
        placeholder="Type a message..."
        className="aui-input"
      />
      <ComposerPrimitive.Send className="aui-send">Send</ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  )
}

export default function AssistantChat() {
  const [threadId, setThreadId] = useState(null)
  const [threads, setThreads] = useState([])

  async function fetchThreads() {
    const res = await fetch('/threads')
    const data = await res.json()
    setThreads(data.thread_ids)
  }

  async function loadThread(id) {
    const res = await fetch(`/threads/${id}/history`)
    const data = await res.json()
    setThreadId(id)
  }

  function startNewThread() {
    setThreadId(null)
  }

  useEffect(() => {
    fetchThreads()
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new-thread" onClick={startNewThread}>+ New Thread</button>
        <div className="thread-list">
          {threads.map(id => (
            <button
              key={id}
              className={`thread-item ${id === threadId ? 'active' : ''}`}
              onClick={() => loadThread(id)}
            >
              {id.slice(0, 8)}...
            </button>
          ))}
        </div>
      </aside>

      <main className="chat assistant-ui-chat">
        <AssistantChatInner
          key={threadId || 'new'}
          threadId={threadId}
          setThreadId={setThreadId}
          onThreadCreated={fetchThreads}
        />
      </main>
    </div>
  )
}
