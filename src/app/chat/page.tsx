"use client";

import { useRef, useState } from "react";
import { PostChatBody, PostChatResponse } from "@/app/api/chat/route";
import { Message } from "@/types/chat";
import Markdown from "react-markdown";

type HiddenMessage = Message & {
  hidden: boolean;
};

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an AI assistant that helps people find information. Always reply in markdown.",
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
    const trimmedUserPrompt = userPrompt.trim();
    if (trimmedUserPrompt === "") {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError("");
    setUserPrompt("");
    appendMessage({
      role: "user",
      content: userPrompt,
      hidden: false,
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userPrompt: userPrompt,
          messages,
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
    <div className="flex flex-col items-center py-2">
      <div className="flex flex-col w-[95%]">
        <textarea
          className="min-h-8 max-h-12 w-full border-black border rounded-sm p-2 mt-2"
          value={systemPrompt}
          placeholder="System prompt"
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
        <div
          className="flex flex-col h-[520px] w-full border-black border overflow-scroll mt-4 p-8 gap-y-8"
          ref={chatRef}
        >
          {messages
            .filter((message) => !message.hidden)
            .map((message, index) => (
              <div
                key={`${message}-${index}`}
                className={`w-[80%] ${message.role === "user" ? "self-end" : "self-start"} bg-gray-200 border-black border rounded-md p-4`}
              >
                <Markdown>{message.content}</Markdown>
              </div>
            ))}
        </div>
        <div className="flex flex-row gap-x-2 items-start flex-full">
          <textarea
            className="min-h-12 h-fit w-full border-black border rounded-sm mt-4 p-2 flex-full"
            placeholder="Ask anything"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          ></textarea>
          <button
            className="mt-4 p-2 bg-black text-white w-20 cursor-pointer rounded-sm hover:bg-gray-600 disabled:bg-gray-400"
            type="button"
            onClick={getChatCompletion}
            disabled={loading}
          >
            Submit
          </button>
        </div>
        {loading && <p className="text-md mt-4">Loading...</p>}
        {error && <p className="text-red-500 text-md mt-4">{error}</p>}
      </div>
    </div>
  );
}
