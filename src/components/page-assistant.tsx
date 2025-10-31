
"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pageAssistant } from "@/ai/flows/page-assistant-flow";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  content: string;
}

interface PageAssistantProps {
  pageContext: string;
}

export function PageAssistant({ pageContext }: PageAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getInitialMessage = async () => {
      setIsLoading(true);
      try {
        const result = await pageAssistant({ pageContext });
        setMessages([{ role: "model", content: result.response }]);
      } catch (error) {
        setMessages([
          {
            role: "model",
            content: "Hello! How can I help you today?",
          },
        ]);
        console.error("Error fetching initial message:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getInitialMessage();
  }, [pageContext]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableNode = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableNode) {
          scrollableNode.scrollTop = scrollableNode.scrollHeight;
        }
    }
  }, [messages]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await pageAssistant({
        pageContext,
        userQuery: input,
        history: messages,
      });
      setMessages((prev) => [...prev, { role: "model", content: result.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I'm having trouble connecting. Please try again later.",
        },
      ]);
      console.error("Error fetching AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg animate-pulse-subtle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6"/> : <Bot className="h-6 w-6" />}
          <span className="sr-only">Toggle Chatbot</span>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm">
            <Card className="flex flex-col h-[60vh] shadow-2xl">
                <CardHeader className="flex flex-row items-center gap-3">
                    <Avatar>
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline text-lg">Difa, your AI Assistant</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn("flex gap-3 text-sm", message.role === "user" ? "justify-end" : "justify-start")}>
                                    {message.role === 'model' && <Avatar className="h-8 w-8"><AvatarFallback>AI</AvatarFallback></Avatar>}
                                    <div className={cn("rounded-lg px-4 py-2", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        <p>{message.content}</p>
                                    </div>
                                    {message.role === 'user' && <Avatar className="h-8 w-8"><AvatarFallback>U</AvatarFallback></Avatar>}
                                </div>
                            ))}
                            {isLoading && messages.length > 0 && (
                                <div className="flex justify-start gap-3 text-sm">
                                    <Avatar className="h-8 w-8"><AvatarFallback>AI</AvatarFallback></Avatar>
                                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="pt-6 border-t">
                    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                        <Input id="message" placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} autoComplete="off" />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
      )}
    </>
  );
}
