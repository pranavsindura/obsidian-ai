import { OpenAIController } from "@/controllers/openai";
import { Message } from "@/types/chat";

export interface PostChatBody {
  systemPrompt: string;
  userPrompt: string;
  messages: Message[];
}

export interface PostChatResponse {
  message: string | null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as PostChatBody;

  const openai = new OpenAIController();
  const client = openai.getChatCompletionClient();
  const model = openai.getChatCompletionModel();

  const result = await client.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: body.systemPrompt },
      ...body.messages,
      { role: "user", content: body.userPrompt },
    ],
  });

  const response: PostChatResponse = {
    message: result.choices[0].message.content,
  };

  return Response.json(response);
}
