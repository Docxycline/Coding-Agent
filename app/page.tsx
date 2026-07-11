"use client"
import Image from "next/image"
import fitgptLogo from "./assets/fitgptLogo.png"
// import fitgptLogo from "./assets/fitgptLogo.png"
import { useState } from "react"  // ← add this
import { useChat } from "ai/react"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggetionsRow from "./components/PromptSuggetionsRow"
import Bubble from "./components/Bubble"

const HomePage = () => {
  // ← add this block
  const [threadId] = useState(() => {
    if (typeof window === "undefined") return crypto.randomUUID();
    const stored = localStorage.getItem("fitgpt_thread_id");
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem("fitgpt_thread_id", newId);
    return newId;
  });

  // ← add body option here
  const { append, messages, isLoading, input, handleInputChange, handleSubmit } = useChat({
    body: {
      thread_id: threadId,
    },
  })
  const noMessages = !messages || messages.length === 0

  const handlePrompt = (promptText: string) => {
    append({
      role: "user",
      content: promptText
    })
  }

  return (
    <main>
      <Image src={fitgptLogo} width={100} alt="fitgptLogo" />
      <section className={noMessages ? "empty" : "populated"}>
        {noMessages ? (
          <div>
            <p className="starter-text">
              Hello! I'm Qinser, your personal coding agent. How can I help you today?
            </p>
            <br />
            <PromptSuggetionsRow onPromptClick={handlePrompt} />
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me anything..." />
        <input type="submit" value="Send" />
      </form>
    </main>
  )
}

export default HomePage;