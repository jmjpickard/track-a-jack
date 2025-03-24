import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EXERCISE_TYPE } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DrawerProps {
  type: EXERCISE_TYPE;
  title: string;
  unit: string;
  options: number[];
  onConfirm: (
    type: EXERCISE_TYPE,
    amount: number,
    unit: string,
    remove: boolean,
  ) => Promise<void>;
}

export const ActivityDrawer: React.FC<DrawerProps> = ({
  type,
  title,
  unit,
  options,
  onConfirm,
}: DrawerProps) => {
  const [value, setValue] = React.useState(0);
  const [removeActivity, setRemoveActivity] = React.useState(false);
  const handleSelect = (selectedVal: number) => {
    if (value === selectedVal) {
      setValue(0);
    }
    setValue(selectedVal);
  };
  const handleConfirm = async () => {
    await onConfirm(type, value, unit, removeActivity);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="h-10 w-10 rounded-full p-0" variant="secondary">
          <PlusCircledIcon className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>How many {unit}?</DrawerDescription>
            <div className="mb-2 mt-2 flex items-center justify-center space-x-2">
              <Switch
                id="remove"
                onCheckedChange={(checked) => setRemoveActivity(checked)}
              />
              <Label htmlFor="remove">Remove activity</Label>
            </div>
          </DrawerHeader>
          <div className="flex flex-row items-center justify-center gap-1 pl-20 pr-20">
            <ToggleGroup type="single">
              {options.map((num, i) => (
                <ToggleGroupItem
                  key={i}
                  value={String(num)}
                  aria-label={`Toggle ${num}`}
                  variant="default"
                  onClick={() => handleSelect(num)}
                  className={
                    removeActivity
                      ? "data-[state=on]:bg-destructive"
                      : "data-[state=on]:bg-green"
                  }
                >
                  {num}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button onClick={handleConfirm}>Submit</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
