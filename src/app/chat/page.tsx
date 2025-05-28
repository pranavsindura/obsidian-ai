"use client";

import { useRef, useState } from "react";
import { PostChatBody, PostChatResponse } from "@/app/api/chat/route";
import { Message } from "@/types/chat";
import { GetSearchResponse } from "@/app/api/search/route";

type HiddenMessage = Message & {
  hidden: boolean;
};

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState(
    "you are smart, sharp, a critical thinker, a helpful assistant and a teacher.",
  );
  const [messages, setMessages] = useState<HiddenMessage[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const appendMessage = (message: HiddenMessage) => {
    setMessages((messages) => [...messages, message]);
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const getChatCompletion = async () => {
    setLoading(true);
    setError("");
    setUserPrompt("");
    appendMessage({
      role: "user",
      content: userPrompt,
      hidden: false,
    });

    let contextMessage: HiddenMessage | null = null;

    try {
      // search matched texts
      const response = await fetch(`/api/search?q=${userPrompt}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { text } = (await response.json()) as GetSearchResponse;
      contextMessage = {
        role: "assistant",
        content: `Based on query, I found this in the user notes:\n${text}`,
        hidden: true,
      };
      appendMessage(contextMessage);
    } catch (error) {
      setError(
        error?.toString() ??
          "unknown error occurred while searching for context",
      );
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userPrompt: userPrompt,
          messages: contextMessage ? [...messages, contextMessage] : messages,
        } satisfies PostChatBody),
      });

      const body = (await response.json()) as PostChatResponse;
      const message = body.message;

      if (message == null) {
        setError("No response from OpenAI");
      } else {
        appendMessage({
          role: "assistant",
          content: message,
          hidden: false,
        });
      }
    } catch (error) {
      setError(
        error?.toString() ??
          "unknown error occurred while fetching chat completion",
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-2">
      <div className="flex flex-col w-[95%]">
        <h4 className="text-lg self-start mt-4">System prompt</h4>
        <textarea
          className="min-h-8 w-full border-black border rounded-sm p-2"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        ></textarea>
        <div
          className="flex flex-col h-[400px] w-full border-black border overflow-scroll mt-4 p-8 gap-y-8"
          ref={chatRef}
        >
          {messages
            .filter((message) => !message.hidden)
            .map((message, index) => (
              <div
                key={index}
                className={`w-[80%] ${message.role === "user" ? "self-end" : "self-start"} bg-gray-200 border-black border rounded-md p-4`}
              >
                <p className="text-md whitespace-pre-line">{message.content}</p>
              </div>
            ))}
        </div>
        <textarea
          className="min-h-8 w-full border-black border rounded-sm mt-4 p-2"
          placeholder="Ask anything"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
        ></textarea>
        <button
          className="mt-4 p-2 bg-black text-white w-20 cursor-pointer hover:bg-gray-600 disabled:bg-gray-400"
          type="button"
          onClick={getChatCompletion}
          disabled={loading}
        >
          Submit
        </button>
        {loading && <p className="text-md mt-4">Loading...</p>}
        {error && <p className="text-red-500 text-md mt-4">{error}</p>}
      </div>
    </div>
  );
}
