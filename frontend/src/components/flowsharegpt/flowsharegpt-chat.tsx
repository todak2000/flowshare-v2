"use client";

import { useState, useRef, useEffect } from "react";
import { UserProfile } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  BrainCircuit,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  User,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FlowshareGPTChatProps {
  user: UserProfile;
}

export function FlowshareGPTChat({ user }: FlowshareGPTChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `## Welcome, ${user.full_name || "there"}! 👋

I'm **FlowshareGPT**, your petroleum production analyst with full access to your production data.

### What I Can Do:

- 📊 **Production Analysis** - Analyze trends, volumes, BSW%, temperature, and API gravity from your actual production entries
- 🔄 **Reconciliation Review** - Examine allocation calculations, shrinkage patterns, and partner distributions
- ⚠️ **Anomaly Investigation** - Identify outliers and data quality issues with specific references to your entries
- 📈 **Trend Analysis** - Compare performance over time using your historical data
- 🎯 **Actionable Insights** - Provide petroleum engineering recommendations based on your actual numbers

### Try Asking:

- "What are the production trends this month?"
- "Analyze the latest reconciliation results"
- "Are there any anomalies in the recent data?"
- "Compare BSW% across partners"
- "Show me entries with high water cut"

I have access to **your actual production entries**, reconciliations, and partner data. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    // Add placeholder for assistant response
    const assistantMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const authHeaders = await apiClient.getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flowsharegpt/chat`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversation_history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Update the last message (assistant's response)
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantMessageIndex] = {
            role: "assistant",
            content: accumulatedContent,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          role: "assistant",
          content:
            "I apologize, but I encountered an error. Please try again later.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full ">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-transparent ">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <div className="relative flex items-center justify-center w-12 h-12 bg-linear-to-br from-primary to-primary/50 rounded-xl shadow-lg">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold  flex items-center gap-2 ">
              FlowshareGPT
              <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full border border-primary/30">
                Beta
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
              Petroleum Production Analyst
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-4 ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-4 duration-500`}
          >
            <div
              className={`max-w-[75%] group ${
                message.role === "user" ? "flex flex-col items-end" : ""
              }`}
            >
              <Card
                className={`px-4 rounded-sm py-2 shadow-none ${
                  message.role === "user"
                    ? "bg-primary/1 dark:bg-primary/10 border-primary/20 dark:border-primary/30 backdrop-blur-sm"
                    : " backdrop-blur-sm "
                } `}
              >
                {message.role === "assistant" ? (
                  <div className="prose dark:prose-invert prose-sm max-w-none font-mono text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-lg font-bold  mt-4 mb-2 first:mt-0"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-base font-semibold mt-3 mb-2"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className=" mb-3 last:mb-0" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc pl-5 space-y-1 "
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal pl-5 space-y-1 "
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong
                            className="text-primary font-bold"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-900 text-primary rounded text-xs font-mono border border-slate-300 dark:border-slate-700"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block p-3 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs overflow-x-auto border border-slate-300 dark:border-slate-700"
                              {...props}
                            />
                          ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      isStreaming && (
                        <span className="inline-block ml-1 w-2 h-4  animate-pulse" />
                      )}
                  </div>
                ) : (
                  <div className="font-mono text-sm  whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}
              </Card>

              {/* Copy button */}
              {message.role === "assistant" && message.content && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(message.content, index)}
                  className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-xs"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10  bg-slate-600  rounded-lg flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/50 rounded-lg flex items-center justify-center shadow-lg">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
            </div>
            <Card className="bg-transparent shadow-none border-none">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm text-slate-700 dark:text-slate-400 font-mono">
                  Analyzing production data...
                </p>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 backdrop-blur-xl p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about production data, trends, or reconciliations..."
                className="min-h-[60px] max-h-[200px] resize-none bg-slate-200/50  dark:bg-slate-600/50 border-slate-300 dark:border-slate-700  font-mono text-sm focus:border-primary focus:ring-primary pr-12"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-400 dark:text-slate-500 font-mono">
                {input.length > 0 && `${input.length} chars`}
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="h-[60px] px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <p className="text-slate-600 dark:text-slate-400">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Enter
              </kbd>{" "}
              to send,{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Shift+Enter
              </kbd>{" "}
              for new line
            </p>
            <p className="text-slate-500 dark:text-slate-500">
              FlowshareGPT may occasionally provide inaccurate information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
