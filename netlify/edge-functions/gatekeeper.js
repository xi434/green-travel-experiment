import { verify } from "https://esm.sh/2fa-lib";

export default async (request, context) => {
  const url = new URL(request.url);
  const inputCode = url.searchParams.get("code");
  const secret = Netlify.env.get("TOTP_SECRET");

  if (!inputCode) {
    return new Response("需要输入口令", { status: 403 });
  }

  const isValid = await verify(inputCode, secret, { window: 1 });
  if (!isValid) {
    return new Response("口令错误或已过期", { status: 403 });
  }
  // 口令对，放行
};

export const config = { path: "/*", excludedPath: ["/*.css", "/*.js", "/*.png"] };