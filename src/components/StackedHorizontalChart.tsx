import React from "react";
import { Group } from "@visx/group";
import { BarStackHorizontal } from "@visx/shape";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";

export type InputData = {
  category: string;
  current: number;
  track: number;
  top: number;
};

interface StackedBarChartProps {
  data: InputData[];
  width: number;
  height: number;
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  width,
  height,
}) => {
  const margin = { top: 20, bottom: 20, left: 40, right: 20 };
  const categories = ["current", "track", "top"];
  // Extract categories and values

  const getCat = (d: InputData) => d.category;

  // Create scales
  const xScale = scaleLinear<number>({
    domain: [0, 100],
    nice: true,
  });

  const yScale = scaleBand<string>({
    domain: categories,
    padding: 0.2,
  });

  const colorScale = scaleOrdinal<string, string>({
    domain: categories,
    range: ["24 9.8% 10%", "#8a89a6", "#7b6888"],
  });

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  xScale.rangeRound([0, xMax]);
  yScale.rangeRound([yMax, 0]);

  const background = "#eaedff";
  return (
    <svg width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        <BarStackHorizontal<InputData, string>
          data={data}
          keys={categories}
          height={yMax}
          y={getCat}
          yScale={yScale}
          xScale={xScale}
          color={colorScale}
        >
          {(barStacks) =>
            barStacks.map((barStack) =>
              barStack.bars.map((bar) => {
                return (
                  <rect
                    key={`barstack-horizontal-${barStack.index}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={bar.color}
                  />
                );
              }),
            )
          }
        </BarStackHorizontal>
      </Group>
    </svg>
  );
};

export default StackedBarChart;
