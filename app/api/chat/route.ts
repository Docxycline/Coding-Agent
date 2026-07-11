import { HumanMessage } from "@langchain/core/messages";
import { setupCheckpointer } from "@/app/lib/checkpointer";
import graph from "@/app/lib/agent";

export async function POST(req: Request) {
  try {
    const { messages, thread_id } = await req.json();
   
    await setupCheckpointer();
  

    const latestMessage = messages[messages.length - 1]?.content;

    const config = {
      configurable: { thread_id },
    };

    // run the full ReAct loop — tools fire here, memory saves here
    const result = await graph.invoke(
      { messages: [new HumanMessage(latestMessage)] },
      config
    );

    // get final AI response
    const lastMessage = result.messages[result.messages.length - 1];
    const aiResponse = lastMessage.content as string;
    // const aiResponse = typeof lastMessage.content === "string"
    //  ? lastMessage.content
    //  : Array.isArray(lastMessage.content)
    //  ? lastMessage.content
    //   .map((c: any) => (typeof c === "string" ? c : c.text || ""))
    //   .join("")
    //  : String(lastMessage.content);

    // stream it back word by word using the correct Vercel AI protocol
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // split into words and stream them with small delays
        // this gives the streaming feel without needing a second LLM call
        const words = aiResponse.split(" ");
        for (const word of words) {
          const formatted = `0:${JSON.stringify(word + " ")}\n`;
          controller.enqueue(encoder.encode(formatted));
          // tiny delay between words so frontend renders progressively
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (err) {
    console.error("Agent error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}