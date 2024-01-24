// components/ProgressDisplay.tsx
import React from "react";

interface ProgressDisplayProps {
  current: number;
  target: number;
  total: number; // The overall target value
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  current,
  target,
  total,
}) => {
  const currentPercentage = Math.min(100, (current / total) * 100);
  const targetPercentage = Math.min(100, (target / total) * 100);

  return (
    <div>
      <div className="relative mb-1 flex h-6 w-full flex-row overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="rounded-l-full bg-primary p-2 text-center text-xs font-medium leading-none text-blue-100"
          style={{ width: `${currentPercentage}%` }}
        ></div>
        <div
          className="absolute w-1 bg-blue-500"
          style={{ left: `${targetPercentage}%`, height: "100%" }}
        ></div>
        <div
          className={`absolute text-xs font-medium ${
            targetPercentage < 100 ? "text-gray-700" : "text-white"
          } p-1`}
          style={{ left: `calc(${targetPercentage}% + 0.5rem)` }}
        >
          <span className="inline-block text-sm font-semibold text-blue-500">
            Target: {target}%
          </span>
        </div>
      </div>
      <div className="flex w-full flex-row ">
        <div style={{ width: `${currentPercentage}%` }}>{current}%</div>
      </div>
    </div>
  );
};

export default ProgressDisplay;
