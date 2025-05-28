"use client";

import { useState } from "react";
import {
  PostEmbeddingBody,
  PostEmbeddingResponse,
} from "@/app/api/embedding/route";

export default function Home() {
  const [input, setInput] = useState("");
  const [outputVector, setOutputVector] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getEmbeddingCompletion = async () => {
    setLoading(true);
    setError("");
    setOutputVector([]);

    try {
      const response = await fetch("/api/embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input,
        } satisfies PostEmbeddingBody),
      });

      const { vector } = (await response.json()) as PostEmbeddingResponse;
      setOutputVector(vector);
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
        <h4 className="text-lg self-start mt-4">Output vector</h4>
        <div className="w-full self-end bg-gray-200 border-black border rounded-md p-4">
          <p className="text-md whitespace-pre-line overflow-scroll">
            {JSON.stringify(outputVector)}
          </p>
        </div>
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
