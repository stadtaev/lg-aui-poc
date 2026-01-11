import { useState } from 'react'
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react'
import { useLangGraphChatRuntime } from './LangGraphChatRuntime'

function LangGraphChatInner({ threadId, setThreadId }) {
  const runtime = useLangGraphChatRuntime({
    threadId,
    onThreadCreated: setThreadId,
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
  const [chatKey, setChatKey] = useState(0)

  function startNewThread() {
    setThreadId(null)
    setChatKey(k => k + 1)
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
          key={chatKey}
          threadId={threadId}
          setThreadId={setThreadId}
        />
      </main>
    </div>
  )
}
