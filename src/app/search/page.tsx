"use client";

import { useState } from "react";
import { GetSearchResponse } from "../api/search/route";

export default function Home() {
  const [input, setInput] = useState("");
  const [matchedText, setMatchedText] = useState("");
  const [matchedSources, setMatchedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getEmbeddingCompletion = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/search?q=${input}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { text, sources } = (await response.json()) as GetSearchResponse;
      setMatchedText(text);
      setMatchedSources(
        sources.map((source) =>
          source.replace(process.env.NEXT_PUBLIC_OBSIDIAN_VAULT_PATH ?? "", ""),
        ),
      );
    } catch (error) {
      setError(error?.toString() ?? "unknown error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-2">
      <div className="flex flex-col w-[95%]">
        <h4 className="text-lg self-start mt-4">Input Text</h4>
        <textarea
          className="min-h-8 w-full border-black border rounded-sm p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        ></textarea>
        <h4 className="text-lg self-start mt-4">Matched Sources</h4>
        <div className="max-h-[400px] whitespace-pre-line min-h-8 w-full bg-gray-200 p-2 border-black border rounded-sm flex flex-col gap-y-4 overflow-y-scroll">
          {matchedSources.map((source) => (
            <div key={source}>
              <a
                href={`obsidian://open?path=${process.env.NEXT_PUBLIC_OBSIDIAN_VAULT_PATH}${source}`}
                className="text-blue-600 hover:underline hover:text-blue-700"
              >
                {source}
              </a>
            </div>
          ))}
        </div>
        <h4 className="text-lg self-start mt-4">Matched Text</h4>
        <p className="max-h-[400px] whitespace-pre overflow-scroll min-h-8 w-full bg-gray-200 p-2 border-black border rounded-sm">
          {matchedText}
        </p>
        <button
          className="mt-4 p-2 bg-black text-white w-20 cursor-pointer hover:bg-gray-600 disabled:bg-gray-400"
          type="button"
          onClick={getEmbeddingCompletion}
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
