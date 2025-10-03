import { auth } from "@/server/auth";
import { NavbarClientWrapper } from "./navbar-client-wrapper";
import { UnauthenticatedNavbar } from "./landing/unauthenticated-navbar";

export async function Navbar() {
  const session = await auth();

  if (!session) {
    return <UnauthenticatedNavbar />;
  }

  return <NavbarClientWrapper session={session} />;
}
