import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "~/utils/api";

interface Props {
  refetch: () => void;
}

export const LeaderboardConsent: React.FC<Props> = ({ refetch }) => {
  const setUserConsent = api.user.setUserConsent.useMutation({
    onSuccess: () => refetch(),
  });

  const handleClick = (consent: boolean) => {
    setUserConsent.mutateAsync({
      consent,
    });
  };
  return (
    <div className="mt-5 flex flex-col items-center justify-center gap-5 text-center">
      <Label>Confirm you are happy to share data with other users</Label>
      <div className="flex flex-row gap-3">
        <Button onClick={() => handleClick(true)}>Consent</Button>
        <Button variant={"outline"} onClick={() => handleClick(false)}>
          No
        </Button>
      </div>
    </div>
  );
};
