/** @jsx h */
import { serve } from "https://deno.land/std@0.142.0/http/server.ts";
import { h, ssr } from "https://crux.land/api/get/4cfWmS.ts";
import { MergedFeed } from "./merged-feed.tsx";
import { Index } from "./pages/index.tsx";

const gistUrlPattern = new URLPattern({
  protocol: "https",
  hostname: "gist.github.com",
  pathname: "/:user/:gistId",
});

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Bad Method", { status: 405 });
  }

  const url = new URL(req.url);

  if (url.pathname === "/") {
    const gistUrl = url.searchParams.get("gist");
    if (gistUrl) {
      const matches = gistUrlPattern.exec(gistUrl);
      if (matches) {
        return Response.redirect(
          new URL(`/gist:${matches.pathname.groups.gistId}/feed.xml`, req.url)
            .toString(),
        );
      } else {
        return Response.redirect(new URL("/?error=1", req.url).toString());
      }
    }
    return ssr(() => <Index error={url.searchParams.get("error") === "1"} />);
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
