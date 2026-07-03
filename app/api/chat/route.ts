import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GEMINI_API_KEY,
} = process.env;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
const db = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN).db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = "";
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(latestMessage);
    const embedding = embeddingResult.embedding.values;

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION!);
      const cursor = collection.find(null, {
        sort: { $vector: embedding },
        limit: 10,
      });
      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (err) {
      console.log("Error querying db....", err);
    }
    const systemPrompt = `You are FitGPT, an expert AI fitness coach who knows everything about health, fitness, nutrition, and wellness.
    Use the below context to augment what you know about fitness, workouts, diet, and healthy lifestyle.
    The context will provide you with the most recent data from trusted fitness and nutrition sources.
    If the context doesn't include the information you need, answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include.
    Format responses using markdown where applicable and don't return images.
    ------------------
    START CONTEXT
    ${docContext}
    END CONTEXT
    ------------------
    `;
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: geminiMessages.slice(0, -1), 
    });

  try {
  const result = await chat.sendMessageStream(latestMessage);
  const stream = GoogleGenerativeAIStream(result);
  return new StreamingTextResponse(stream);
} catch (err: any) {
  if (err?.status === 429) {
    return new Response("Rate limit hit, please try again in a moment.", { status: 429 });
  }
  throw err;
}
  } catch (err) {
    throw err;
  }
}