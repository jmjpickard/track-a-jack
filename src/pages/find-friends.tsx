import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { NavBar } from "~/components/NavBar";
import { api } from "~/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Displays a user search result with appropriate actions based on friendship status
 */
const UserSearchResult = ({
  user,
  onSendRequest,
  isPendingRequest,
}: {
  user: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    friendStatus?: string;
  };
  onSendRequest: (userId: string) => void;
  isPendingRequest: boolean;
}) => {
  return (
    <div className="flex items-center justify-between border-b p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image ?? ""} />
          <AvatarFallback>
            {user.name?.charAt(0) ?? user.username?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{user.name ?? user.username}</div>
          {user.username && user.name && (
            <div className="text-xs text-muted-foreground">
              @{user.username}
            </div>
          )}
        </div>
      </div>

      {user.friendStatus === "none" && (
        <Button
          size="sm"
          onClick={() => onSendRequest(user.id)}
          disabled={isPendingRequest}
        >
          {isPendingRequest ? "Sending..." : "Add Friend"}
        </Button>
      )}

      {user.friendStatus === "pending" && (
        <Badge variant="outline">Request Sent</Badge>
      )}

      {user.friendStatus === "friends" && <Badge>Friends</Badge>}

      {user.friendStatus?.startsWith("received") && (
        <Badge variant="outline">Request Received</Badge>
      )}
    </div>
  );
};

/**
 * Find and add friends page
 */
export default function FindFriends() {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingRequestUserId, setPendingRequestUserId] = useState<
    string | null
  >(null);

  const router = useRouter();
  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  // Search users
  const searchUsersQuery = api.user.searchUsers.useQuery(
    { query: searchQuery },
    {
      enabled: isAuth && searchQuery.length > 0,
    },
  );

  // Mutations
  const sendFriendRequestMutation = api.user.sendFriendRequest.useMutation({
    onMutate: () => {
      toast.loading("Sending friend request...");
    },
    onSuccess: (_, variables) => {
      toast.success("Friend request sent successfully!");
      setPendingRequestUserId(null);
      void searchUsersQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to send request: ${error.message}`);
      setPendingRequestUserId(null);
    },
  });

  const handleSendFriendRequest = (userId: string) => {
    setPendingRequestUserId(userId);
    sendFriendRequestMutation.mutate({ receiverId: userId });
  };

  return (
    <>
      <Head>
        <title>Find Friends | Track a Jack</title>
        <meta name="description" content="Find and add friends" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
        <NavBar />
        <Toaster />
        <div className="container max-w-2xl pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>
                Search for friends to connect with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search by name, username, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.length > 0 ? (
                searchUsersQuery.isLoading ? (
                  <div className="py-6 text-center">Searching...</div>
                ) : searchUsersQuery.data?.length ? (
                  <div className="divide-y rounded-md border">
                    {searchUsersQuery.data.map((user) => (
                      <UserSearchResult
                        key={user.id}
                        user={user}
                        onSendRequest={handleSendFriendRequest}
                        isPendingRequest={pendingRequestUserId === user.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">No users found</div>
                )
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  Enter a name, username, or email to search
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
