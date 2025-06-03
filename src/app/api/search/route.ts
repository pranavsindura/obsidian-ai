import { OpenAIController } from "@/controllers/openai";
import { ChromaClient } from "chromadb";
import { NextRequest } from "next/server";

export interface GetSearchResponse {
  text: string;
  sources: string[];
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
    nResults: 10,
  });

  const documents = response.documents[0];

  const metadatas = response.metadatas[0];

  const matchedText = documents.filter((content) => !!content).join("\n");

  const sources = metadatas
    .filter((content) => !!content)
    .map((content) => content.source as string | undefined);

  const filteredSources = new Set(sources.filter((content) => content != null));

  return Response.json({
    text: matchedText,
    sources: Array.from(filteredSources),
  } satisfies GetSearchResponse);
}
