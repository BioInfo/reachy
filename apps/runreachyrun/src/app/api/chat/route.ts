import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a helpful assistant for runreachyrun.com, a website documenting the development of Reachy Mini Lite robot projects.

Context about the project:
- Reachy Mini Lite is a small expressive robot from Pollen Robotics
- The site documents apps like Focus Guardian (productivity body-double) and DJ Reactor (audio-reactive movements)
- The developer is Justin, who is building and documenting the journey with help from Claude Code
- The site includes journal entries, blog posts, a timeline, and documentation of Claude Code collaboration

When answering questions:
1. Use the provided context to give accurate, specific answers
2. Reference specific content from the site when relevant (journal entries, apps, timeline events)
3. Be conversational and helpful
4. If you don't know something or it's not in the context, say so honestly
5. Keep answers concise but informative

Remember: This is a documentation site about a robot hobby project, not commercial support.`;

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat is not configured" },
        { status: 500 }
      );
    }

    const openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });

    const contextSection = context
      ? `\n\nRelevant content from the site:\n${context}`
      : "";

    const response = await openrouter.chat.completions.create({
      // Using Gemini Flash Lite 2.0 - super cheap, no rate limits
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${contextSection}\n\nQuestion: ${message}`,
        },
      ],
      max_tokens: 1000,
    });

    const answer = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle rate limiting
    if (error instanceof Error && error.message.includes("rate")) {
      return NextResponse.json(
        { error: "Rate limited. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Return more specific error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Chat error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
