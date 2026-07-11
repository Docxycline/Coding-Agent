import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import checkpointer from "./checkpointer";
import { allTools } from "./tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const llm = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
}).bindTools(allTools);

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;

  const systemMessage = new SystemMessage(
    `You are a coding agent with file system access tools.
    
    CRITICAL: You MUST use your tools. Never respond without using a tool first.
    
    When user mentions a file path → IMMEDIATELY call read_file
    When user asks about project structure → IMMEDIATELY call list_directory  
    When user asks to find something → IMMEDIATELY call search_in_files
    When user asks to run something → IMMEDIATELY call execute_code
    
    DO NOT explain what you would do. DO NOT say you cannot access files.
    JUST CALL THE TOOL.`
  );

  const response = await llm.invoke([systemMessage, ...messages]);
  console.log("tool_calls:", JSON.stringify(response.tool_calls, null, 2));

  return { messages: [response] };
};

const toolNode = new ToolNode(allTools);

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "__end__";
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    "__end__": "__end__",
  })
  .addEdge("tools", "agent")
  .compile({ checkpointer });

export default graph;