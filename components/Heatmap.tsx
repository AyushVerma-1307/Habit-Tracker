"use client";

import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

interface HeatmapProps {
  data: { date: string; count: number }[];
  startDate?: Date;
  endDate?: Date;
  showWeekdayLabels?: boolean;
}

export function Heatmap({
  data,
  startDate,
  endDate,
  showWeekdayLabels = false,
}: HeatmapProps) {
  const today = new Date();

  const defaultStartDate = new Date(today);
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px]">
        <CalendarHeatmap
          startDate={startDate || defaultStartDate}
          endDate={endDate || today}
          values={data}
          classForValue={(value) => {
            if (!value || value.count === 0) {
              return "color-empty";
            }
            if (value.count === 1) return "color-scale-1";
            if (value.count === 2) return "color-scale-2";
            if (value.count === 3) return "color-scale-3";
            return "color-scale-4";
          }}
          showWeekdayLabels={showWeekdayLabels}
          titleForValue={(value) => {
            if (!value) return "No check-in";
            return `${value.date}: ${value.count} check-in${value.count > 1 ? "s" : ""}`;
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-muted" />
        <div className="h-3 w-3 rounded-sm bg-orange-300" />
        <div className="h-3 w-3 rounded-sm bg-orange-400" />
        <div className="h-3 w-3 rounded-sm bg-orange-500" />
        <div className="h-3 w-3 rounded-sm bg-orange-600" />
        <span>More</span>
      </div>
    </div>
  );
}