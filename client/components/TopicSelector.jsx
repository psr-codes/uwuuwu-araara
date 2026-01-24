"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export default function TopicSelector({
  selectedTopics,
  onTopicsChange,
  disabled,
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${SOCKET_URL}/api/topics`)
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load topics:", err);
        setError("Failed to load topics");
        setLoading(false);
      });
  }, []);

  const toggleTopic = (topicId) => {
    if (disabled) return;

    const newSelection = selectedTopics.includes(topicId)
      ? selectedTopics.filter((t) => t !== topicId)
      : [...selectedTopics, topicId];

    // Ensure at least one topic (default to general)
    onTopicsChange(newSelection.length > 0 ? newSelection : ["general"]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 py-4">
        <Loader2 size={18} className="animate-spin" />
        <span>Loading topics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm py-2">
        {error}. Using default topics.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((topic) => {
        const isSelected = selectedTopics.includes(topic.id);
        return (
          <button
            key={topic.id}
            onClick={() => toggleTopic(topic.id)}
            disabled={disabled}
            title={topic.description}
            className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 text-sm ${
              isSelected
                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span>{topic.icon}</span>
            <span>{topic.name}</span>
            {isSelected && <Check size={14} />}
          </button>
        );
      })}
    </div>
  );
}
