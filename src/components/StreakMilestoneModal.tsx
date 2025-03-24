import { useEffect, useState } from "react";

import { Flame, Award, Share2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StreakMilestoneModalProps {
  streak: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal that celebrates streak milestones
 */
export const StreakMilestoneModal = ({
  streak,
  isOpen,
  onClose,
}: StreakMilestoneModalProps) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Milestone messages based on streak count
  const getMilestoneMessage = (streakCount: number) => {
    if (streakCount >= 365)
      return "A Whole Year of Dedication! Legendary Status!";
    if (streakCount >= 180) return "Half a Year Strong! Absolutely Incredible!";
    if (streakCount >= 100) return "Triple Digits! You're a Force of Nature!";
    if (streakCount >= 30) return "A Full Month! Your Dedication is Inspiring!";
    if (streakCount >= 21) return "21 Days - They Say That Forms a Habit!";
    if (streakCount >= 14)
      return "Two Weeks Strong! Keep Building That Momentum!";
    if (streakCount >= 7) return "A Full Week! You're on Fire!";
    if (streakCount >= 3) return "Three Days In! You're Building Momentum!";
    return "Streak Started! The Journey of a Thousand Miles Begins!";
  };

  // Trigger confetti effect when modal opens
  useEffect(() => {
    if (isOpen) {
      // Wait a moment for the modal to open before triggering
      const timer = setTimeout(() => {
        void confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl">
            <Flame className="h-6 w-6 text-orange-500" />
            {streak} Day Streak!
            <Flame className="h-6 w-6 text-orange-500" />
          </DialogTitle>
          <DialogDescription className="pt-2 text-center text-base">
            {getMilestoneMessage(streak)}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center space-y-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Award className="h-14 w-14 text-orange-500" />
          </div>

          <p className="text-center text-sm">
            You&apos;ve been consistently active for {streak} days. Keep up the
            amazing work to reach your next milestone!
          </p>

          <div className="flex w-full flex-col space-y-2">
            {showShareOptions ? (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `I've reached a ${streak} day streak on Track a Jack! 🔥`,
                    );
                    setShowShareOptions(false);
                  }}
                >
                  Copy Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareOptions(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Milestone
                </Button>
                <Button variant="default" size="sm" onClick={onClose}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
