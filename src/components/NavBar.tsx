import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserNav } from "./UserNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { FriendRequestsDropdown } from "./FriendRequestsDropdown";
import { Users } from "lucide-react";

/**
 * Navigation bar component for the application
 */
export const NavBar: React.FC = () => {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const router = useRouter();

  return (
    <div className="mb-10 w-full bg-white">
      <div className="m-auto flex w-4/5 flex-col gap-4 pt-3 sm:w-3/5">
        <div className="flex flex-row items-center justify-between gap-2 ">
          <div className="flex flex-col gap-2">
            <h3 className="cursor-pointer text-2xl font-extrabold sm:text-[2rem]">
              <Link href="/">Track A Jack</Link>
            </h3>
            {!isAuth && <div>Get off your arse</div>}
          </div>
          {isAuth && (
            <div className="flex items-center gap-2">
              <Link href="/find-friends">
                <Button variant="ghost" size="icon" title="Find Friends">
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <FriendRequestsDropdown />
              <UserNav />
            </div>
          )}
        </div>
        {isAuth && (
          <div className="flex flex-row items-center justify-center gap-5 sm:justify-start ">
            <Button variant="link" asChild>
              <Link className="text-lg" href="/feed">
                Feed
              </Link>
            </Button>
            <Button variant="link" asChild>
              <Link className="text-lg" href="/">
                Log
              </Link>
            </Button>
            <Button variant="link" asChild>
              <Link className="text-lg" href="/track">
                Track
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
