import { useState, useCallback } from 'react'
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react'
import {
  AssistantStream,
  AssistantTransportDecoder,
} from 'assistant-stream'

function LangGraphChatInner({ threadId, setThreadId }) {
  const [messages, setMessages] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const onNew = useCallback(async (message) => {
    const userText = message.content[0]?.text || ''
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: [{ type: 'text', text: userText }],
    }
    setMessages(prev => [...prev, userMessage])
    setIsRunning(true)

    const assistantMessageId = crypto.randomUUID()

    try {
      const response = await fetch('/api/langgraph/lgchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          thread_id: threadId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      // Decode the AssistantTransportResponse stream
      const stream = AssistantStream.fromResponse(
        response,
        new AssistantTransportDecoder()
      )

      let accumulatedText = ''

      // Add initial assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
      }])

      // Process the stream
      const reader = stream.getReader()
      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break

        // Handle different chunk types
        if (chunk.type === 'text-delta') {
          accumulatedText += chunk.textDelta
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: [{ type: 'text', text: accumulatedText }] }
              : msg
          ))
        }
      }

      // If no thread_id was set, we might need to extract it from stream
      // For now, generate one if not provided
      if (!threadId) {
        const newThreadId = crypto.randomUUID()
        setThreadId(newThreadId)
      }

    } catch (err) {
      console.error('Stream error:', err)
      setMessages(prev => {
        // Remove the empty assistant message if it exists
        const filtered = prev.filter(m => m.id !== assistantMessageId)
        return [...filtered, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: [{ type: 'text', text: `Error: ${err.message}` }],
        }]
      })
    } finally {
      setIsRunning(false)
    }
  }, [threadId, setThreadId])

  const convertMessage = useCallback((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
  }), [])

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
      <ComposerPrimitive.Input
        placeholder="Type a message..."
        className="aui-input"
      />
      <ComposerPrimitive.Send className="aui-send">Send</ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  )
}

export default function LangGraphChat() {
  const [threadId, setThreadId] = useState(null)

  function startNewThread() {
    setThreadId(null)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new-thread" onClick={startNewThread}>+ New Thread</button>
        <div className="thread-info">
          {threadId ? `Thread: ${threadId.slice(0, 8)}...` : 'New conversation'}
        </div>
      </aside>

      <main className="chat langgraph-chat">
        <LangGraphChatInner
          key={threadId || 'new'}
          threadId={threadId}
          setThreadId={setThreadId}
        />
      </main>
    </div>
  )
}
