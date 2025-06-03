import { TenantProvider } from "@/components/TenantContextProvider";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return <TenantProvider>{children}</TenantProvider>;

  }