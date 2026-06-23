// Cloudflare Pages Function: proxy /api/* to the Worker
const API_ORIGIN = 'https://sellup-api.lea-jolivet03.workers.dev';

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = API_ORIGIN + url.pathname + url.search;
  const proxied = new Request(target, request);
  return fetch(proxied);
};
