export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*", "/help/:path*", "/api/analysis/:path*", "/api/resumes/:path*", "/api/export/:path*"],
};
