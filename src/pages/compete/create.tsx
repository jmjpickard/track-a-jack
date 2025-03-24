import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Dumbbell,
  Timer,
  MoveUp,
  Bike,
  Waves,
} from "lucide-react";
import { EXERCISE_TYPE } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import { addDays, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

/**
 * Form for creating new challenge competitions
 */
export default function CreateChallengePage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EXERCISE_TYPE>(EXERCISE_TYPE.PUSH_UPS);
  const [goalAmount, setGoalAmount] = useState<string>("100");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState<string>(
    format(addDays(new Date(), 14), "yyyy-MM-dd"),
  );
  const [isPublic, setIsPublic] = useState(true);

  const createChallenge = api.challenge.createChallenge.useMutation({
    onSuccess: (challenge) => {
      setIsSubmitting(false);
      void router.push(`/compete/${challenge.id}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setFormErrors({ form: error.message });
    },
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Challenge name is required";
    } else if (name.length < 3) {
      errors.name = "Name must be at least 3 characters";
    }

    if (!goalAmount) {
      errors.goalAmount = "Goal amount is required";
    } else {
      const goal = parseInt(goalAmount, 10);
      if (isNaN(goal) || goal <= 0) {
        errors.goalAmount = "Goal must be a positive number";
      }
    }

    if (!startDate) {
      errors.startDate = "Start date is required";
    }

    if (!endDate) {
      errors.endDate = "End date is required";
    } else if (
      startDate &&
      endDate &&
      new Date(startDate) >= new Date(endDate)
    ) {
      errors.endDate = "End date must be after start date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    createChallenge.mutate({
      name,
      description: description || undefined,
      type: type as
        | "RUNNING"
        | "PUSH_UPS"
        | "SIT_UPS"
        | "SWIMMING"
        | "CYCLING"
        | "PULL_UPS",
      goalAmount: parseInt(goalAmount, 10),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isPublic,
    });
  };

  if (status === "unauthenticated") {
    void router.push("/signin");
    return null;
  }

  return (
    <>
      <Head>
        <title>Create Challenge | Track A Jack</title>
      </Head>
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="link" asChild className="p-0">
            <Link
              href="/compete"
              className="flex items-center text-muted-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Challenges
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold">Create a Challenge</h1>
          <p className="text-muted-foreground">
            Set up a new challenge for yourself and others
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Details</CardTitle>
            <CardDescription>
              Define your challenge goals and timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {formErrors.form && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {formErrors.form}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Challenge Name</Label>
                  <Input
                    id="name"
                    placeholder="E.g., '30-Day Push-up Challenge'"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your challenge..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exercise Type</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(value) => setType(value as EXERCISE_TYPE)}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={EXERCISE_TYPE.PUSH_UPS}
                        id="push-ups"
                      />
                      <Label
                        htmlFor="push-ups"
                        className="flex items-center gap-1"
                      >
                        <Dumbbell className="h-4 w-4" /> Push-ups
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={EXERCISE_TYPE.SIT_UPS}
                        id="sit-ups"
                      />
                      <Label
                        htmlFor="sit-ups"
                        className="flex items-center gap-1"
                      >
                        <MoveUp className="h-4 w-4" /> Sit-ups
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={EXERCISE_TYPE.RUNNING}
                        id="running"
                      />
                      <Label
                        htmlFor="running"
                        className="flex items-center gap-1"
                      >
                        <Timer className="h-4 w-4" /> Running (km)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={EXERCISE_TYPE.SWIMMING}
                        id="swimming"
                      />
                      <Label
                        htmlFor="swimming"
                        className="flex items-center gap-1"
                      >
                        <Waves className="h-4 w-4" /> Swimming (km)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={EXERCISE_TYPE.CYCLING}
                        id="cycling"
                      />
                      <Label
                        htmlFor="cycling"
                        className="flex items-center gap-1"
                      >
                        <Bike className="h-4 w-4" /> Cycling (km)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={EXERCISE_TYPE.PULL_UPS}
                        id="pull-ups"
                      />
                      <Label
                        htmlFor="pull-ups"
                        className="flex items-center gap-1"
                      >
                        <Dumbbell className="h-4 w-4" rotate={90} /> Pull-ups
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goalAmount">Challenge Goal</Label>
                  <div className="flex items-center">
                    <Input
                      id="goalAmount"
                      type="number"
                      placeholder="Goal amount"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      min="1"
                      className={`w-1/3 ${
                        formErrors.goalAmount ? "border-destructive" : ""
                      }`}
                    />
                    <span className="ml-2 text-muted-foreground">
                      {type === EXERCISE_TYPE.PUSH_UPS
                        ? "push-ups"
                        : type === EXERCISE_TYPE.SIT_UPS
                          ? "sit-ups"
                          : type === EXERCISE_TYPE.PULL_UPS
                            ? "pull-ups"
                            : type === EXERCISE_TYPE.SWIMMING
                              ? "kilometers (swimming)"
                              : type === EXERCISE_TYPE.CYCLING
                                ? "kilometers (cycling)"
                                : "kilometers (running)"}
                    </span>
                  </div>
                  {formErrors.goalAmount && (
                    <p className="text-xs text-destructive">
                      {formErrors.goalAmount}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`pl-9 ${
                          formErrors.startDate ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                    {formErrors.startDate && (
                      <p className="text-xs text-destructive">
                        {formErrors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`pl-9 ${
                          formErrors.endDate ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                    {formErrors.endDate && (
                      <p className="text-xs text-destructive">
                        {formErrors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="isPublic">Make this challenge public</Label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Challenge"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
