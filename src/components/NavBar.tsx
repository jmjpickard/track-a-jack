import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserNav } from "./UserNav";

export const NavBar: React.FC = () => {
  return (
    <div className="container flex flex-row items-center justify-around gap-2 py-8 sm:px-20 ">
      <div className="flex flex-col gap-2">
        <h3 className="cursor-pointer text-2xl font-extrabold sm:text-[2rem]">
          <Link href="/">Track A Jack</Link>
        </h3>
        <div>Get off your arse</div>
      </div>
      <Button variant="link" asChild>
        <Link className="text-lg" href="/summary">
          Summary
        </Link>
      </Button>
      <UserNav />
    </div>
  );
};
