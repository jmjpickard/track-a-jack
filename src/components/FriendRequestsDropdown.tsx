import { useState } from "react";
import { api } from "~/utils/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Link from "next/link";

/**
 * Displays a dropdown for friend requests with notifications
 */
export const FriendRequestsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  // Get friend requests
  const friendRequestsQuery = api.user.getFriendRequests.useQuery(undefined, {
    refetchInterval: open ? 10000 : false, // Refetch every 10 seconds when open
  });

  // Access the feed query to allow refetching
  const utils = api.useUtils();

  // Mutations
  const respondToRequestMutation = api.user.respondToFriendRequest.useMutation({
    onMutate: () => {
      toast.loading("Processing request...");
    },
    onSuccess: (_, variables) => {
      if (variables.accept) {
        toast.success("Friend request accepted!");
        // Invalidate the feed query to refetch when accepting a friend
        void utils.post.getFeed.invalidate();
      } else {
        toast.info("Friend request declined");
      }
      void friendRequestsQuery.refetch();
      setPendingRequestId(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setPendingRequestId(null);
    },
  });

  const handleAcceptRequest = (requestId: string) => {
    setPendingRequestId(requestId);
    respondToRequestMutation.mutate({ requestId, accept: true });
  };

  const handleRejectRequest = (requestId: string) => {
    setPendingRequestId(requestId);
    respondToRequestMutation.mutate({ requestId, accept: false });
  };

  const receivedRequests = friendRequestsQuery.data?.received ?? [];
  const requestCount = receivedRequests.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {requestCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {requestCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Friend Requests</span>
          {requestCount > 0 && <Badge variant="outline">{requestCount}</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {friendRequestsQuery.isLoading ? (
          <DropdownMenuItem disabled>Loading requests...</DropdownMenuItem>
        ) : receivedRequests.length > 0 ? (
          <ScrollArea className="h-64">
            {receivedRequests.map((request) => (
              <DropdownMenuItem
                key={request.id}
                className="flex flex-col items-stretch p-0"
              >
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.sender.image ?? ""} />
                      <AvatarFallback>
                        {request.sender.name?.charAt(0) ??
                          request.sender.username?.charAt(0) ??
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {request.sender.name ?? request.sender.username}
                      </div>
                      {request.sender.username && request.sender.name && (
                        <div className="text-xs text-muted-foreground">
                          @{request.sender.username}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={pendingRequestId === request.id}
                    >
                      {pendingRequestId === request.id &&
                      !respondToRequestMutation.variables?.accept
                        ? "..."
                        : "✕"}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={pendingRequestId === request.id}
                    >
                      {pendingRequestId === request.id &&
                      respondToRequestMutation.variables?.accept
                        ? "..."
                        : "✓"}
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <DropdownMenuItem disabled>No friend requests</DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/find-friends" className="cursor-pointer">
            Find Friends
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
