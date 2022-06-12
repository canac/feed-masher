/** @jsx h */
import { h, tw } from "https://crux.land/api/get/4cfWmS.ts";

export function Index(params: { error: boolean }) {
  return (
    <main
      class={tw
        `flex h-screen flex-col justify-center bg-gray-200 text-center font-sans`}
    >
      <h1 class={tw`pb-3 text-3xl`}>Feed Masher</h1>
      <p class={tw`pb-6 font-bold`}>
        Combine multiple RSS and Atom feeds into one combined Atom feed.
      </p>
      <p class={tw`pb-2`}>
        Enter the URL of a Gist that contains your feed URLs. The Gist should
        have one feed URL per line.
      </p>
      <form action="/">
        <label for="gist" class={tw`sr-only`}>Gist URL</label>
        <input
          id="gist"
          name="gist"
          placeholder="https://gist.github.com/user/0123456789abcdef0123456789abcdef"
          class={tw`w-[40rem] rounded-xl border-2 p-2 mr-2`}
        />
        <button
          type="submit"
          class={tw`rounded-xl bg-blue-400 px-4 py-2 hover:bg-blue-300`}
        >
          Mash!
        </button>
        {params.error
          ? (
            <p class={tw`pb-2 text-red-600`}>
              Uh oh! That URL doesn't look like a Gist. Please try again.
            </p>
          )
          : null}
      </form>
    </main>
  );
}
