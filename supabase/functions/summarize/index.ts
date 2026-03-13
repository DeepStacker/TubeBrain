// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SummaryRequest {
  videoId?: string;
  videoIds?: string[];
  model?: string;
  provider?: string;
  language?: string;
  style?: string;
}

async function fetchTranscript(videoId: string): Promise<{ transcript: string; textSegments: string[] }> {
  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = await response.text();

  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) {
    const descMatch = html.match(/"shortDescription":"(.*?)"/);
    if (descMatch) {
      return { transcript: `Video description: ${descMatch[1].replace(/\\n/g, "\n").slice(0, 4000)}`, textSegments: [] };
    }
    throw new Error("No captions or description available.");
  }

  const captionTracks = JSON.parse(captionMatch[1]);
  const track = captionTracks.find((t: any) => t.languageCode === "en") || captionTracks[0];
  if (!track?.baseUrl) throw new Error("No caption URL found.");

  const captionUrl = track.baseUrl.replace(/\\u0026/g, "&");
  const captionResp = await fetch(captionUrl);
  const captionXml = await captionResp.text();

  const textSegments: string[] = [];
  const regex = /<text start="([\d.]+)"[^>]*>(.*?)<\/text>/g;
  let match;
  while ((match = regex.exec(captionXml)) !== null) {
    const time = parseFloat(match[1]);
    const text = match[2]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/<[^>]*>/g, "");
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    textSegments.push(`[${mins}:${secs.toString().padStart(2, "0")}] ${text}`);
  }

  return { transcript: textSegments.join("\n"), textSegments };
}

function extractVideoInfo(html: string) {
  const titleMatch = html.match(/"title":"(.*?)"/);
  const channelMatch = html.match(/"ownerChannelName":"(.*?)"/);
  const viewMatch = html.match(/"viewCount":"(\d+)"/);
  const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
  const publishMatch = html.match(/"publishDate":"(.*?)"/);

  const likeFactoidMatch = html.match(/"factoidRenderer":{"value":{"simpleText":"(.*?)"},"label":{"simpleText":"Likes"}}/);
  const likeCountMatch = html.match(/"likeCount":"(\d+)"/);
  const likeAccessibilityMatch = html.match(/"accessibilityData":{"label":"([\d,MKB.]+)\s*(?:likes|like this video)/i);

  let likes = "0";
  if (likeFactoidMatch) {
    likes = likeFactoidMatch[1];
  } else if (likeAccessibilityMatch) {
    likes = likeAccessibilityMatch[1];
  } else if (likeCountMatch) {
    const count = parseInt(likeCountMatch[1]);
    likes = count > 1000000 ? `${(count / 1000000).toFixed(1)}M` : count > 1000 ? `${(count / 1000).toFixed(0)}K` : count.toString();
  }

  const keywordsMatch = html.match(/<meta name="keywords" content="(.*?)"/);
  const descMatch = html.match(/"shortDescription":"(.*?)"/);
  const keywords = keywordsMatch ? keywordsMatch[1] : "";
  const description = descMatch ? descMatch[1].replace(/\\n/g, "\n") : "";

  const lengthSec = lengthMatch ? parseInt(lengthMatch[1]) : 0;
  const mins = Math.floor(lengthSec / 60);
  const secs = lengthSec % 60;

  const views = viewMatch ? parseInt(viewMatch[1]) : 0;
  const formattedViews = views > 1000000
    ? `${(views / 1000000).toFixed(1)}M views`
    : views > 1000
      ? `${(views / 1000).toFixed(0)}K views`
      : `${views} views`;

  return {
    title: titleMatch ? titleMatch[1].replace(/\\"/g, '"') : "Unknown Title",
    channel: channelMatch ? channelMatch[1] : "Unknown Channel",
    duration: `${mins}:${secs.toString().padStart(2, "0")}`,
    views: formattedViews,
    likes,
    published: publishMatch ? publishMatch[1] : "",
    keywords,
    description,
  };
}

async function callAI(provider: string, model: string, messages: any[], apiKey: string) {
  let url = "";
  if (provider === "groq") url = "https://api.groq.com/openai/v1/chat/completions";
  else if (provider === "openrouter") url = "https://openrouter.ai/api/v1/chat/completions";
  else if (provider === "google") url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  else if (provider === "xai") url = "https://api.x.ai/v1/chat/completions";
  else if (provider === "cerebras") url = "https://api.cerebras.ai/v1/chat/completions";

  if (provider === "google") {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: messages[0].content + "\n\n" + messages[1].content }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8000 }
      })
    });
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider === "openrouter" && { "HTTP-Referer": "https://lovable.dev", "X-Title": "Youtube Genius" })
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    })
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || `AI error: ${resp.status}`);
  return data.choices?.[0]?.message?.content;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: SummaryRequest = await req.json();
    const { videoId, videoIds: rawVideoIds, provider = "groq", model = "llama-3.3-70b-versatile", language = "English", style = "Detailed" } = body;

    // Support both single videoId (backward compat) and array videoIds
    const videoIds: string[] = rawVideoIds && rawVideoIds.length > 0
      ? rawVideoIds.filter(Boolean).slice(0, 3)
      : videoId ? [videoId] : [];

    if (videoIds.length === 0) throw new Error("videoId or videoIds is required");

    const envKey = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = Deno.env.get(envKey);
    if (!apiKey) throw new Error(`${envKey} is not configured`);

    // Fetch info and transcripts for all videos
    const videoDataArr: { videoInfo: any; transcript: string }[] = [];
    let primaryVideoInfo: any = null;

    for (const vid of videoIds) {
      const pageUrl = `https://www.youtube.com/watch?v=${vid}`;
      const pageResp = await fetch(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept-Language": "en-US,en;q=0.9" }
      });
      const html = await pageResp.text();
      const videoInfo = extractVideoInfo(html);
      if (!primaryVideoInfo) primaryVideoInfo = videoInfo;

      let transcript: string;
      try {
        const transcriptData = await fetchTranscript(vid);
        transcript = transcriptData.transcript;
      } catch {
        transcript = `[NO CAPTIONS — FALLBACK CONTEXT]
Title: ${videoInfo.title}
Channel: ${videoInfo.channel}
Keywords: ${videoInfo.keywords}
Description:
${videoInfo.description.slice(0, 3000)}`;
      }

      videoDataArr.push({ videoInfo, transcript });
    }

    const isMultiVideo = videoIds.length > 1;

    // Build combined context for the AI
    const combinedContext = videoDataArr.map((vd, i) =>
      `=== VIDEO ${i + 1}: "${vd.videoInfo.title}" by ${vd.videoInfo.channel} ===\n${vd.transcript.slice(0, Math.floor(15000 / videoIds.length))}`
    ).join("\n\n");

    const systemPrompt = `You are an expert educational AI assistant and YouTube video analyst. 
${isMultiVideo ? "You are given MULTIPLE videos. Synthesize them into one unified Master Guide, comparing and combining their insights." : ""}
Respond in ${language}. Style: ${style}.
Return ONLY valid JSON (no markdown, no code blocks) with this EXACT structure:
{
  "overview": "3-5 paragraphs of massively detailed analysis${isMultiVideo ? " comparing and synthesizing all videos" : ""}",
  "keyPoints": ["10-15 highly detailed insight strings"],
  "takeaways": ["6-10 actionable takeaway strings"],
  "timestamps": [{"time": "0:00", "label": "Topic description"}],
  "roadmap": {
    "title": "Mastery Roadmap",
    "steps": [{"step": 1, "task": "Task name", "description": "How to accomplish it in detail"}]
  },
  "learningContext": {
    "why": "Deep explanation of why this topic matters",
    "whatToHowTo": "Specific step-by-step guidance on what to learn and in what order",
    "bestWay": "The most effective and proven approach to mastering this topic"
  },
  "quiz": [
    {
      "question": "A clear question testing understanding of the content",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Why this answer is correct, with context from the video"
    }
  ],
  "mindMap": {
    "nodes": [{"id": "1", "label": "Central Topic"}, {"id": "2", "label": "Sub-concept"}],
    "edges": [{"source": "1", "target": "2", "label": "relates to"}]
  },
  "tags": ["tag1", "tag2"]
}
Rules:
- quiz: Generate 8-10 questions with 4 options each. answer is the 0-based index of the correct option.
- mindMap: Create 10-15 nodes and edges that visually map the key concepts. The first node (id "1") is always the central topic.
- timestamps: 8-15 major section timestamps.
- keyPoints: minimum 10 items.
- Respond in ${language}.`;

    const content = await callAI(provider, model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: combinedContext }
    ], apiKey);

    let summary;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      summary = JSON.parse(jsonMatch[1].trim());
    } catch {
      throw new Error("Failed to parse AI response as JSON.");
    }

    // Return primary video info + all transcripts for the chat feature
    const allTranscripts = videoDataArr.map((vd, i) =>
      `[Video ${i + 1}: ${vd.videoInfo.title}]\n${vd.transcript}`
    ).join("\n\n---\n\n");

    return new Response(JSON.stringify({
      videoInfo: primaryVideoInfo,
      allVideoInfo: videoDataArr.map(vd => vd.videoInfo),
      summary,
      transcript: videoDataArr[0]?.transcript || "",
      allTranscripts,
      metadata: { provider, model, language, style, videoCount: videoIds.length }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
