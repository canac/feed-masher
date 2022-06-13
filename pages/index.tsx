/** @jsx htw */
import { h, tw } from "https://crux.land/api/get/4cfWmS.ts";

// h with support for Tailwind classes
function htw(tagNameOrComponent: any, props: any = {}, ...children: any[]) {
  return h(tagNameOrComponent, {
    ...props,
    class: tw(props.class),
  }, ...children);
}

export function Index(params: { error: boolean }) {
  return (
    <main class="flex h-screen flex-col justify-center bg-gray-200 text-center font-sans">
      <h1 class="pb-3 text-3xl">Feed Masher</h1>
      <p class="pb-6 font-bold">
        Combine multiple RSS and Atom feeds into one combined Atom feed.
      </p>
      <p class="pb-2">
        Enter the URL of a Gist that contains your feed URLs. The Gist should
        have one feed URL per line.
      </p>
      <form action="/">
        <label for="gist" class="sr-only">Gist URL</label>
        <input
          id="gist"
          name="gist"
          placeholder="https://gist.github.com/user/0123456789abcdef0123456789abcdef"
          class="w-[40rem] rounded-xl border-2 p-2 mr-2"
        />
        <button
          type="submit"
          class="bg-blue-400 px-4 py-2 hover:bg-blue-300 rounded-xl"
        >
          Mash!
        </button>
        {params.error
          ? (
            <p class="pb-2 text-red-600">
              Uh oh! That URL doesn't look like a Gist. Please try again.
            </p>
          )
          : null}
      </form>
    </main>
  );
}
