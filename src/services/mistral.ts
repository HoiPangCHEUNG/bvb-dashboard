import { Mistral } from "@mistralai/mistralai";

let client: Mistral;

export const getMistralClient = (): Mistral => {
  if (client) return client;

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Please define the MISTRAL_API_KEY environment variable");
  }

  client = new Mistral({ apiKey });
  return client;
};

export const analyzeTradingData = async (
  data: unknown,
  userQuestion: string
): Promise<unknown> => {
  const client = getMistralClient();

  const systemPrompt = `You are a cryptocurrency trading analyst specializing in funding rates and open interest analysis.
Analyze the provided market data and answer user questions about trading opportunities, risk assessment, and market conditions.
Focus on actionable insights for trading strategies like delta-neutral arbitrage based on funding rate and OI imbalances.`;

  const userPrompt = `Market Data: ${JSON.stringify(data, null, 2)}

User Question: ${userQuestion}`;

  const chatResponse = await client.chat.complete({
    model: "mistral-large-latest",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return chatResponse.choices[0].message.content;
};
