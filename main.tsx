import { serve } from "https://deno.land/std@0.142.0/http/server.ts";
import { MergedFeed } from "./merged-feed.tsx";

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Bad Method", { status: 405 });
  }

  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Feed Masher");
  }

  const gistPattern = new URLPattern({ pathname: "/gist\\::gistId/feed.xml" });
  const matches = gistPattern.exec(req.url);
  if (matches) {
    const { gistId } = matches.pathname.groups;
    const feed = await MergedFeed.fromGist(gistId);
    return new Response(await feed.generateFeed(), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new Response("Not Found", { status: 404 });
});
