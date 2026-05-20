import { AuthenticatedLayout } from "@/components/layout/auth-provider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
