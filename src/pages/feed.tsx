import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { NavBar } from "~/components/NavBar";
import { api } from "~/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EXERCISE_TYPE } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Helper function to format date
const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
};

// Helper function to format exercise type
const formatExerciseType = (type: EXERCISE_TYPE) => {
  switch (type) {
    case "PUSH_UPS":
      return "Push-ups";
    case "SIT_UPS":
      return "Sit-ups";
    case "RUNNING":
      return "Running";
    default:
      return type;
  }
};

const ActivityPost = ({ post }: { post: any }) => {
  const userName = post.user.name || post.user.username || "User";
  const userImage = post.user.image;
  const exercises = post.exercises;

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar>
          <AvatarImage src={userImage} alt={userName} />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-base">{userName}</CardTitle>
          <CardDescription className="text-xs">
            {formatDate(new Date(post.createdAt))}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col gap-2">
          {exercises.map((exercise: any) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between"
            >
              <span>{formatExerciseType(exercise.type)}:</span>
              <Badge variant="outline">
                {exercise.amount} {exercise.unit || ""}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const UserSearchResult = ({
  user,
  onSendRequest,
}: {
  user: any;
  onSendRequest: (userId: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between border-b p-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image} />
          <AvatarFallback>
            {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{user.name || user.username}</div>
          {user.username && user.name && (
            <div className="text-xs text-muted-foreground">
              @{user.username}
            </div>
          )}
        </div>
      </div>

      {user.friendStatus === "none" && (
        <Button size="sm" onClick={() => onSendRequest(user.id)}>
          Add Friend
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

const FriendRequest = ({
  request,
  onAccept,
  onReject,
}: {
  request: any;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  const sender = request.sender;

  return (
    <div className="flex items-center justify-between border-b p-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.image} />
          <AvatarFallback>
            {sender.name?.charAt(0) || sender.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{sender.name || sender.username}</div>
          {sender.username && sender.name && (
            <div className="text-xs text-muted-foreground">
              @{sender.username}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(request.id)}
        >
          Reject
        </Button>
        <Button size="sm" onClick={() => onAccept(request.id)}>
          Accept
        </Button>
      </div>
    </div>
  );
};

export default function Feed() {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("feed");

  const router = useRouter();
  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  // Get feed data
  const feedQuery = api.post.getFeed.useQuery(
    {
      limit: 20,
    },
    {
      enabled: isAuth && activeTab === "feed",
    },
  );

  // Get friend requests
  const friendRequestsQuery = api.user.getFriendRequests.useQuery(undefined, {
    enabled: isAuth && activeTab === "requests",
  });

  // Search users
  const searchUsersQuery = api.user.searchUsers.useQuery(
    { query: searchQuery },
    {
      enabled: isAuth && activeTab === "search" && searchQuery.length > 0,
    },
  );

  // Mutations
  const sendFriendRequestMutation = api.user.sendFriendRequest.useMutation({
    onSuccess: () => {
      searchUsersQuery.refetch();
    },
  });

  const respondToRequestMutation = api.user.respondToFriendRequest.useMutation({
    onSuccess: () => {
      friendRequestsQuery.refetch();
    },
  });

  const handleSendFriendRequest = (userId: string) => {
    sendFriendRequestMutation.mutate({ receiverId: userId });
  };

  const handleAcceptRequest = (requestId: string) => {
    respondToRequestMutation.mutate({ requestId, accept: true });
  };

  const handleRejectRequest = (requestId: string) => {
    respondToRequestMutation.mutate({ requestId, accept: false });
  };

  return (
    <>
      <Head>
        <title>Feed | Track a Jack</title>
        <meta name="description" content="Your exercise feed" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
        <NavBar />
        <div className="container max-w-2xl pt-4">
          <Tabs
            defaultValue="feed"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="requests">
                Friend Requests
                {friendRequestsQuery.data?.received.length ? (
                  <Badge variant="destructive" className="ml-1">
                    {friendRequestsQuery.data.received.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="search">Find Friends</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="pt-2">
              {feedQuery.isLoading ? (
                <div className="py-10 text-center">Loading feed...</div>
              ) : feedQuery.data?.posts.length ? (
                <div className="space-y-4">
                  {feedQuery.data.posts.map((post) => (
                    <ActivityPost key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="mb-4">Your feed is empty</p>
                  <p className="text-sm text-muted-foreground">
                    Add friends or log some exercise to see activity
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="pt-2">
              <div className="divide-y rounded-md border">
                <div className="p-3 font-medium">Friend Requests</div>

                {friendRequestsQuery.isLoading ? (
                  <div className="p-8 text-center">Loading requests...</div>
                ) : friendRequestsQuery.data?.received.length ? (
                  <ScrollArea className="max-h-[300px]">
                    {friendRequestsQuery.data.received.map((request) => (
                      <FriendRequest
                        key={request.id}
                        request={request}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No friend requests
                  </div>
                )}
              </div>

              {friendRequestsQuery.data?.sent.length ? (
                <div className="mt-4 divide-y rounded-md border">
                  <div className="p-3 font-medium">Sent Requests</div>
                  <ScrollArea className="max-h-[200px]">
                    {friendRequestsQuery.data.sent.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-2 border-b p-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.receiver.image ?? ""} />
                          <AvatarFallback>
                            {request.receiver.name?.charAt(0) ||
                              request.receiver.username?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {request.receiver.name || request.receiver.username}
                          </div>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="search" className="pt-2">
              <div className="mb-4">
                <Input
                  placeholder="Search for friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.length > 0 ? (
                searchUsersQuery.isLoading ? (
                  <div className="py-10 text-center">Searching...</div>
                ) : searchUsersQuery.data?.length ? (
                  <div className="divide-y rounded-md border">
                    {searchUsersQuery.data.map((user) => (
                      <UserSearchResult
                        key={user.id}
                        user={user}
                        onSendRequest={handleSendFriendRequest}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">No users found</div>
                )
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  Enter a name, username, or email to search
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
