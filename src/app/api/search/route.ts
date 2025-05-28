import { OpenAIController } from "@/controllers/openai";
import { ChromaClient } from "chromadb";
import { NextRequest } from "next/server";

export interface GetSearchResponse {
  text: string;
}

export async function GET(request: NextRequest) {
  const queryText = request.nextUrl.searchParams.get("q");

  if (queryText == null) {
    return new Response("Missing query text", { status: 400 });
  }

  const chromaClient = new ChromaClient();
  const obsidianNotesCollection = await chromaClient.getCollection({
    name: "obsidian-notes",
  });

  const openai = new OpenAIController();
  const embeddingClient = openai.getEmbeddingClient();
  const embeddingModel = openai.getEmbeddingModel();

  const result = await embeddingClient.embeddings.create({
    model: embeddingModel,
    input: queryText,
  });

  const response = await obsidianNotesCollection.query({
    queryEmbeddings: [result.data[0].embedding],
    nResults: 5,
  });

  const documents = response.documents;

  const matchedText = documents
    .map((document) => document.filter((content) => !!content).join("\n"))
    .join("\n\n");

  return Response.json({ text: matchedText } satisfies GetSearchResponse);
}
