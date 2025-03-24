import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@prisma/client";
import { Crown } from "lucide-react";

type ParticipantWithProgress = {
  id: string;
  currentProgress: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

type ChallengeLeaderboardProps = {
  participants: ParticipantWithProgress[];
  goalAmount: number;
  currentUserId: string;
  showFinalResults?: boolean;
};

/**
 * Displays a leaderboard of participants in a challenge, with their progress and ranking
 */
export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  participants,
  goalAmount,
  currentUserId,
  showFinalResults = false,
}) => {
  // Sort participants by progress (descending)
  const sortedParticipants = [...participants].sort(
    (a, b) => b.currentProgress - a.currentProgress,
  );

  // Find if we have winners (participants who completed the goal)
  const winners = showFinalResults
    ? sortedParticipants.filter((p) => p.currentProgress >= goalAmount)
    : [];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">Rank</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead className="text-right">Progress</TableHead>
            <TableHead className="text-right">% Complete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedParticipants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No participants yet.
              </TableCell>
            </TableRow>
          ) : (
            sortedParticipants.map((participant, index) => {
              const isCurrentUser = participant.user.id === currentUserId;
              const isWinner =
                showFinalResults && participant.currentProgress >= goalAmount;
              const progressPercentage = Math.min(
                100,
                Math.round((participant.currentProgress / goalAmount) * 100),
              );

              return (
                <TableRow
                  key={participant.id}
                  className={`${isCurrentUser ? "bg-muted/50" : ""}`}
                >
                  <TableCell className="text-center">
                    {isWinner ? (
                      <Crown className="mx-auto h-5 w-5 text-yellow-500" />
                    ) : (
                      index + 1
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={participant.user.image ?? undefined}
                          alt={participant.user.name ?? "User"}
                        />
                        <AvatarFallback>
                          {(
                            participant.user.name?.[0] ??
                            participant.user.username?.[0] ??
                            "U"
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {participant.user.username ??
                          participant.user.name ??
                          "User"}
                        {isCurrentUser && " (You)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {participant.currentProgress} / {goalAmount}
                  </TableCell>
                  <TableCell className="text-right">
                    {progressPercentage}%
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
