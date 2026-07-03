import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GEMINI_API_KEY,
} = process.env;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const fitnessData = [
    "https://www.healthline.com/nutrition/how-to-gain-muscle",
    "https://www.healthline.com/nutrition/how-much-protein-per-day",
    "https://www.healthline.com/nutrition/best-time-to-eat-protein",
    "https://www.healthline.com/nutrition/progressive-overload",
    "https://www.healthline.com/health/fitness-exercise/compound-exercises",
    "https://www.healthline.com/health/fitness-exercise/bodyweight-exercises",
    "https://www.healthline.com/health/fitness-exercise/how-to-start-working-out",
    "https://www.healthline.com/health/fitness-exercise/benefits-of-strength-training",
    "https://www.healthline.com/nutrition/creatine-benefits",
    "https://www.healthline.com/nutrition/how-to-lose-fat",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION!, {
    vector: {
      dimension: 3072,
      metric: similarityMetric,
    },
  });
  console.log(res);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION!);

  const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  for await (const url of fitnessData) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);

    for await (const chunk of chunks) {
      const embeddingResult = await embeddingModel.embedContent(chunk);
      const vector = embeddingResult.embedding.values;

      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });
      console.log(res);
    }
  }
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

createCollection().then(() => loadSampleData());