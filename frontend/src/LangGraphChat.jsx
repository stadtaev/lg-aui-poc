import { useState, useEffect } from 'react'
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react'
import { useLangGraphRuntime } from '@assistant-ui/react-langgraph'

const API_BASE = '/api/langgraph'

async function createThread() {
  const res = await fetch(`${API_BASE}/threads`, { method: 'POST' })
  const data = await res.json()
  return data.thread_id
}

async function getThreadState(threadId) {
  const res = await fetch(`${API_BASE}/threads/${threadId}/state`)
  return res.json()
}

async function* streamRun(threadId, messages) {
  const res = await fetch(`${API_BASE}/threads/${threadId}/runs/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEvent = null
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ') && currentEvent) {
        const data = JSON.parse(line.slice(6))
        yield { event: currentEvent, data }
        currentEvent = null
      }
    }
  }
}

function LangGraphChatInner({ threadId: initialThreadId, setThreadId, onThreadCreated }) {
  const [currentThreadId, setCurrentThreadId] = useState(initialThreadId)

  const runtime = useLangGraphRuntime({
    stream: async function* (messages) {
      let threadId = currentThreadId

      if (!threadId) {
        threadId = await createThread()
        setCurrentThreadId(threadId)
        setThreadId(threadId)
        onThreadCreated?.()
      }

      // Convert assistant-ui messages to LangChain format
      const lcMessages = messages.map(msg => ({
        type: msg.role === 'user' ? 'human' : 'ai',
        content: typeof msg.content === 'string'
          ? msg.content
          : msg.content?.[0]?.text || '',
      }))

      yield* streamRun(threadId, lcMessages)
    },
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
              UserMessage,
              AssistantMessage,
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
      <ComposerPrimitive.Input placeholder="Type a message..." className="aui-input" />
      <ComposerPrimitive.Send className="aui-send">Send</ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  )
}

export default function LangGraphChat() {
  const [threadId, setThreadId] = useState(null)
  const [threads, setThreads] = useState([])

  async function fetchThreads() {
    const res = await fetch('/threads')
    const data = await res.json()
    setThreads(data.thread_ids)
  }

  useEffect(() => {
    fetchThreads()
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new-thread" onClick={() => setThreadId(null)}>
          + New Thread
        </button>
        <div className="thread-list">
          {threads.map(id => (
            <button
              key={id}
              className={`thread-item ${id === threadId ? 'active' : ''}`}
              onClick={() => setThreadId(id)}
            >
              {id.slice(0, 8)}...
            </button>
          ))}
        </div>
      </aside>

      <main className="chat assistant-ui-chat">
        <LangGraphChatInner
          key={threadId || 'new'}
          threadId={threadId}
          setThreadId={setThreadId}
          onThreadCreated={fetchThreads}
        />
      </main>
    </div>
  )
}
