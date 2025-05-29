import { Tools } from "@/constants/tools";
import { OpenAIController } from "@/controllers/openai";
import { Message } from "@/types/chat";
import OpenAI from "openai";
import { GetSearchResponse } from "../search/route";

export interface PostChatBody {
  systemPrompt: string;
  userPrompt: string;
  messages: Message[];
}

export interface PostChatResponse {
  message: string | null;
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: Tools.SEARCH_NOTES,
      description: "search the user's markdown notes for relevant text",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "the query to search for",
          },
        },
        required: ["q"],
        additionalProperties: false,
      },
    },
  },
];

export async function POST(request: Request) {
  const body = (await request.json()) as PostChatBody;

  const openai = new OpenAIController();
  const client = openai.getChatCompletionClient();
  const model = openai.getChatCompletionModel();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: body.systemPrompt },
    ...body.messages,
    { role: "user", content: body.userPrompt },
  ];

  const firstResult = await client.chat.completions.create({
    model: model,
    messages,
    tools,
  });

  let response: PostChatResponse = {
    message: firstResult.choices[0].message.content,
  };

  const { tool_calls } = firstResult.choices[0].message;

  if (tool_calls) {
    messages.push(firstResult.choices[0].message);

    for (const toolCall of tool_calls) {
      const message = await handleToolCall(toolCall);
      if (message) {
        messages.push(message);
      }
    }

    const secondResult = await client.chat.completions.create({
      model: model,
      messages,
      tools,
    });

    response = {
      message: secondResult.choices[0].message.content,
    };
  }

  return Response.json(response);
}

async function handleToolCall(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
): Promise<OpenAI.Chat.ChatCompletionMessageParam | null> {
  if (toolCall.type !== "function") return null;

  const functionName = toolCall.function.name;
  const functionArgs = JSON.parse(toolCall.function.arguments);

  switch (functionName) {
    case Tools.SEARCH_NOTES:
      const searchResponse = await fetch(
        `http://localhost:3000/api/search?q=${functionArgs.q}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const searchResult = (await searchResponse.json()) as GetSearchResponse;

      return {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(searchResult),
      };
    default:
      return null;
  }
}
