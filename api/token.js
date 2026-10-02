export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": "post-street-teleprompter-private"
      },
      body: JSON.stringify({
        session: {
          type: "transcription",
          audio: {
            input: {
              noise_reduction: { type: "near_field" },
              transcription: {
                model: "gpt-live-transcribe",
                languages: ["en"],
                delay: "low",
                prompt: "Teleprompter reading for filmmaking, Sony FX30, editing, and creator videos.",
                keywords: [
                  "Sony FX30",
                  "FX30",
                  "Cine EI",
                  "Flexible ISO",
                  "S-Log3",
                  "Premiere Pro",
                  "Motion Duck",
                  "Post Street Studios"
                ]
              },
              turn_detection: null
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI client secret error status:", response.status);
      res.status(502).json({ error: "OpenAI session creation failed. Check the server API key, model access and billing." });
      return;
    }

    if(typeof data.value !== "string" || !data.value){
      res.status(502).json({error:"OpenAI returned no session token."});
      return;
    }

    // Only the short-lived client secret is returned to the browser.
    res.status(200).json({
      value: data.value,
      expires_at: data.expires_at
    });
  } catch (error) {
    console.error("Token request failed:", error.name);
    res.status(500).json({ error: "Could not create realtime transcription session." });
  }
}
