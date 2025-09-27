import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { feedbacks } = req.body;

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(400).json({ error: "No feedbacks provided" });
    }

    const prompt = `
    You are an assistant helping summarize workplace feedback. All feedback is directed at the Fontys ICT - InnovationLab in Strijp S.

    Task:
    - Only look at the feedback given, do not make anything up. If there is no positive feedback, say that, the same goes for negative.
    - Provide a structured, easy-to-read summary of the following feedback.
    - Organize the summary into clear sections with short paragraphs, bullet points, or numbered lists.
    - Highlight:
      1. The most common positive points
      2. The main areas of concern
      3. Any suggestions or recurring themes from employees
    - Do NOT include a top-level title like "Feedback Summary" (the UI already has one).
    - Keep it concise, but well formatted with line breaks for readability.
    - Suggest what should be improved in a short way.

    Feedbacks:
    ${feedbacks.map((f, i) => `${i + 1}. ${f}`).join("\n")}
    `;

    // ✅ Streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // ✅ OpenAI streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) res.write(delta);
    }

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate summary" });
    }
  }
}
