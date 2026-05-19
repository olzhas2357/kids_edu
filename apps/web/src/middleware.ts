import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, AUTH_PUBLIC_PATHS } from '@/lib/auth/constants';

const TEACHER_PREFIX = '/teacher';
const STUDENT_PREFIX = '/student';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const isAuthPage = AUTH_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isTeacherArea = pathname.startsWith(TEACHER_PREFIX);
  const isStudentArea = pathname.startsWith(STUDENT_PREFIX);
  const isProtected = isTeacherArea || isStudentArea;

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const from = request.nextUrl.searchParams.get('from');
    if (from && (from.startsWith(TEACHER_PREFIX) || from.startsWith(STUDENT_PREFIX))) {
      return NextResponse.redirect(new URL(from, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*', '/login', '/register'],
};
