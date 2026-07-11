import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);

export const setupCheckpointer = async () => {
  console.log("Setting up checkpointer...");
  await checkpointer.setup();
  console.log("Checkpointer setup complete!");
};

export default checkpointer;