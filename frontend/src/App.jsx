import { useState, useEffect, useRef } from 'react'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState(null)
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchThreads()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchThreads() {
    const res = await fetch('/threads')
    const data = await res.json()
    setThreads(data.thread_ids)
  }

  async function loadThread(id) {
    const res = await fetch(`/threads/${id}/history`)
    const data = await res.json()
    setThreadId(id)
    setMessages(data.messages)
  }

  function startNewThread() {
    setThreadId(null)
    setMessages([])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, thread_id: threadId }),
      })
      const data = await res.json()

      if (!threadId) {
        setThreadId(data.thread_id)
        fetchThreads()
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response' }])
    } finally {
      setLoading(false)
    }
  }

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

      <main className="chat">
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty">Start a conversation</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <span className="role">{msg.role}</span>
              <p>{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <span className="role">assistant</span>
              <p className="loading">Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>Send</button>
        </form>
      </main>
    </div>
  )
}

export default App
