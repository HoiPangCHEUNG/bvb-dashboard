import { NextRequest } from "next/server";
import { getMistralClient } from "../../../services/mistral";

interface AnalyzeRequest {
  data: unknown;
  question: string;
  context?: string;
  dataType?: "concentration" | "funding" | "liquidation" | "general";
}

export async function POST(request: NextRequest) {
  try {
    const {
      data,
      question,
      context,
      dataType = "general",
    }: AnalyzeRequest = await request.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build system prompt based on data type
          let systemPrompt =
            "You are a cryptocurrency derivatives risk analyst specializing in funding rates and open interest analysis.";

          switch (dataType) {
            case "concentration":
              systemPrompt +=
                " Analyze OI concentration data and provide insights on market risks, position concentrations, and potential liquidation cascades. Focus on actionable insights for risk management.";
              break;
            case "funding":
              systemPrompt +=
                " Analyze funding rate data and provide insights on market sentiment, arbitrage opportunities, and delta-neutral strategies.";
              break;
            case "liquidation":
              systemPrompt +=
                " Analyze liquidation data and provide insights on market stress, potential cascade events, and risk mitigation strategies.";
              break;
            default:
              systemPrompt +=
                " Analyze the provided financial data and answer questions about market conditions, risks, and trading opportunities.";
          }

          const userPrompt = `Market Data: ${JSON.stringify(
            data,
            null,
            2
          )}\n\nUser Question: ${question}`;

          const client = getMistralClient();

          const result = await client.chat.stream({
            model: "mistral-small-latest",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          // Stream the response
          for await (const event of result) {
            // Debug: log event structure in development
            // if (process.env.NODE_ENV === "development") {
            //   console.log("Event structure:", JSON.stringify(event, null, 2));
            // }

            // Extract content from the streaming event
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
    console.error("Analysis API error:", error);
    return new Response("Error analyzing data", { status: 500 });
  }
}
