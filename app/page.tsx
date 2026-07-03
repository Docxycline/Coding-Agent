// 
"use client"
import Image from "next/image"
import fitgptLogo from "./assets/fitgptLogo.png"
import { useChat } from "ai/react"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggetionsRow from "./components/PromptSuggetionsRow"
import Bubble from "./components/Bubble"

const HomePage = () => {
  const { append, messages, isLoading, input, handleInputChange, handleSubmit } = useChat()
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
              Hello! I'm FitGPT, your personal fitness coach. How can I help you today?
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