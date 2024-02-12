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

  const handleClick = async (consent: boolean) => {
    await setUserConsent.mutateAsync({
      consent,
    });
  };
  return (
    <div className="mt-5 flex flex-col items-center justify-center gap-5 text-center">
      <Label>Confirm you are happy to share data with other users</Label>
      <div className="flex flex-row gap-3">
        <Button onClick={async () => await handleClick(true)}>Consent</Button>
        <Button
          variant={"outline"}
          onClick={async () => await handleClick(false)}
        >
          No
        </Button>
      </div>
    </div>
  );
};
