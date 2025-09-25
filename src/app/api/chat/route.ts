import { NextRequest } from "next/server";
import { getMistralClient } from "../../../services/mistral";

interface ChatRequest {
  message: string;
  messages?: { role: "user" | "assistant"; content: string }[];
  context?: string;
  data?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      messages,
      context = "BVB Dashboard",
      data,
    }: ChatRequest = await request.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let systemPrompt = `You are an AI assistant for the BVB (cryptocurrency derivatives) Dashboard.
          You specialize in:
          - Funding rates analysis and interpretation
          - Cryptocurrency derivatives trading insights
          - Open interest and market concentration analysis
          - Risk management in crypto trading
          - Market sentiment analysis
          - Trading strategies and opportunities

          Provide helpful, accurate, and actionable insights. Keep responses concise but informative.
          Current context: ${context}`;

          // Add current market data if available
          if (data && Object.keys(data).length > 0) {
            systemPrompt += `

          Current Market Data Available:
          ${JSON.stringify(data, null, 2)}

          Use this data to provide specific, data-driven insights. Reference actual numbers and trends from the current market state.`;
          }

          // Build proper conversation history
          const conversationMessages: Array<
            | { role: "system"; content: string }
            | { role: "user"; content: string }
            | { role: "assistant"; content: string }
          > = [
            { role: "system" as const, content: systemPrompt }
          ];

          // Add previous messages if they exist
          if (messages && messages.length > 0) {
            messages.forEach(msg => {
              conversationMessages.push({
                role: msg.role,
                content: msg.content
              });
            });
          }

          // Add current user message
          conversationMessages.push({
            role: "user" as const,
            content: message
          });

          const client = getMistralClient();

          const result = await client.chat.stream({
            model: "mistral-small-latest",
            messages: conversationMessages,
          });

          // Stream the response
          for await (const event of result) {
            const delta = event?.data?.choices?.[0]?.delta;
            if (delta?.content) {
              controller.enqueue(encoder.encode(delta.content as string));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Error processing chat message", { status: 500 });
  }
}
