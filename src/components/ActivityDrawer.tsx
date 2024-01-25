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
import { EXERCISE_TYPE } from "@prisma/client";

interface DrawerProps {
  type: EXERCISE_TYPE;
  title: string;
  unit: string;
  options: number[];
  onConfirm: (
    type: EXERCISE_TYPE,
    amount: number,
    unit: string,
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
  const handleSelect = (selectedVal: number) => {
    console.log(selectedVal);
    if (value === selectedVal) {
      setValue(0);
    }
    setValue(selectedVal);
  };
  console.log(value);
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="flex flex-row gap-3" variant="secondary">
          <div>Log activity</div>
          <PlusCircledIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>How many {unit}?</DrawerDescription>
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
                >
                  {num}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button onClick={() => onConfirm(type, value, unit)}>
                Submit
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
