import { useState, useMemo } from 'react'
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react'
import {
  AssistantStream,
  AssistantTransportDecoder,
} from 'assistant-stream'

function LangGraphChatInner({ threadId, setThreadId }) {
  const adapter = useMemo(() => ({
    async *run({ messages, abortSignal }) {
      // Get the last user message
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.role !== 'user') return

      const userText = lastMessage.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('')

      const response = await fetch('/api/langgraph/lgchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          thread_id: threadId,
        }),
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const stream = AssistantStream.fromResponse(
        response,
        new AssistantTransportDecoder()
      )

      let accumulatedText = ''
      const reader = stream.getReader()

      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break

        if (chunk.type === 'text-delta') {
          accumulatedText += chunk.textDelta
          yield {
            content: [{ type: 'text', text: accumulatedText }],
          }
        }
      }

      // Update threadId if it was newly created
      if (!threadId) {
        setThreadId(crypto.randomUUID())
      }
    },
  }), [threadId, setThreadId])

  const runtime = useLocalRuntime(adapter)

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
