import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import React from "react";

interface ToggleItems {
  label: string;
  value: string;
}

interface ToggleProps {
  toggles: ToggleItems[];
  onChange: (value: string) => void;
}

export const ToggleSelect: React.FC<ToggleProps> = ({
  toggles,
  onChange,
}: ToggleProps) => {
  return (
    <ToggleGroup type="multiple" >
      {toggles.map((toggle) => (
        <ToggleGroupItem
          key={toggle.value}
          value={toggle.value}
          aria-label={`Toggle ${toggle.label}`}
          variant="outline"
          onChange={(value) => onChange(value.currentTarget.value)}
          onClick={(value) => onChange(value.currentTarget.value)}
        >
          <div>{toggle.label}</div>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
