import { OpenAIController } from "@/controllers/openai";

export interface PostEmbeddingBody {
  text: string;
}

export interface PostEmbeddingResponse {
  vector: number[];
}

export async function POST(request: Request) {
  const body = (await request.json()) as PostEmbeddingBody;

  const openai = new OpenAIController();
  const client = openai.getEmbeddingClient();
  const model = openai.getEmbeddingModel();

  const result = await client.embeddings.create({
    model: model,
    input: body.text,
  });

  const response: PostEmbeddingResponse = {
    vector: result.data[0].embedding,
  };

  return Response.json(response);
}
