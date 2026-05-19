import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
