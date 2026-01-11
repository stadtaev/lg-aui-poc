import { useMemo } from 'react'
import { useLocalRuntime } from '@assistant-ui/react'
import {
  AssistantStream,
  AssistantTransportDecoder,
} from 'assistant-stream'

function createChatModelAdapter({ threadId, onThreadCreated }) {
  return {
    async *run({ messages, abortSignal }) {
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

      if (!threadId) {
        onThreadCreated?.(crypto.randomUUID())
      }
    },
  }
}

export function useLangGraphChatRuntime({ threadId, onThreadCreated }) {
  const adapter = useMemo(
    () => createChatModelAdapter({ threadId, onThreadCreated }),
    [threadId, onThreadCreated]
  )

  return useLocalRuntime(adapter)
}
