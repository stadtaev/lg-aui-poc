import { useMemo, useRef } from 'react'
import { useLocalRuntime } from '@assistant-ui/react'
import {
  AssistantStream,
  AssistantTransportDecoder,
  AssistantMessageAccumulator
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
