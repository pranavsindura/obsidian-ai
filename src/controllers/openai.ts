import assert from "assert";
import { AzureOpenAI } from "openai";

export class OpenAIController {
  chatCompletionClient: AzureOpenAI;
  chatCompletionModel: string;

  embeddingClient: AzureOpenAI;
  embeddingModel: string;

  constructor() {
    this.chatCompletionClient = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_CHAT_COMPLETION_API_VERSION,
      deployment: process.env.AZURE_OPENAI_CHAT_COMPLETION_DEPLOYMENT,
    });

    assert(
      process.env.AZURE_OPENAI_CHAT_COMPLETION_MODEL,
      "AZURE_OPENAI_CHAT_COMPLETION_MODEL is not set",
    );
    this.chatCompletionModel = process.env.AZURE_OPENAI_CHAT_COMPLETION_MODEL;

    this.embeddingClient = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION,
      deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    });

    assert(
      process.env.AZURE_OPENAI_EMBEDDING_MODEL,
      "AZURE_OPENAI_EMBEDDING_MODEL is not set",
    );
    this.embeddingModel = process.env.AZURE_OPENAI_EMBEDDING_MODEL;
  }

  getChatCompletionModel() {
    return this.chatCompletionModel;
  }

  getChatCompletionClient() {
    return this.chatCompletionClient;
  }

  getEmbeddingModel() {
    return this.embeddingModel;
  }

  getEmbeddingClient() {
    return this.embeddingClient;
  }
}
