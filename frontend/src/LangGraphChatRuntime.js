import { useMemo, useRef } from 'react'
import { useLocalRuntime } from '@assistant-ui/react'
import {
  AssistantStream,
  AssistantTransportDecoder,
  AssistantMessageAccumulator,
} from 'assistant-stream'

function createChatModelAdapter({ threadIdRef, onThreadCreated }) {
  return {
    async *run({ messages, abortSignal }) {
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.role !== 'user') return

      const userText = lastMessage.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('')

      // Generate threadId on first message if not set
      if (!threadIdRef.current) {
        threadIdRef.current = crypto.randomUUID()
        onThreadCreated?.(threadIdRef.current)
      }

      const response = await fetch('/api/langgraph/lgchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          thread_id: threadIdRef.current,
        }),
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      // Decode and accumulate the stream
      const messageStream = AssistantStream.fromResponse(
        response,
        new AssistantTransportDecoder()
      ).pipeThrough(new AssistantMessageAccumulator())

      // Yield accumulated messages as they update
      for await (const message of messageStream) {
        const textContent = message.content
          .filter(part => part.type === 'text')
          .map(part => ({ type: 'text', text: part.text }))

        yield { content: textContent }
      }
    },
  }
}

export function useLangGraphChatRuntime({ threadId, onThreadCreated }) {
  const threadIdRef = useRef(threadId)
  threadIdRef.current = threadId

  const adapter = useMemo(
    () => createChatModelAdapter({ threadIdRef, onThreadCreated }),
    [onThreadCreated]
  )

  return useLocalRuntime(adapter)
}
