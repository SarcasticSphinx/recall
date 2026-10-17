"use client";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "./workspace-context";
import { weeklyActivity } from "@/lib/activity";
export function ActivityChart() {
  const { workspace, clock } = useWorkspace();
  const data = weeklyActivity(workspace, clock);
  const total = data.reduce((sum, day) => sum + day.reviews, 0);
  return (
    <Card className="activity-panel">
      <CardHeader className="activity-heading">
        <div>
          <CardTitle>Your week in practice</CardTitle>
          <CardDescription>Every attempt is a little progress.</CardDescription>
        </div>
        <Badge variant="secondary">
          {total} {total === 1 ? "review" : "reviews"}
        </Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="activity-plot"
          config={{ reviews: { label: "Reviews", color: "var(--accent)" } }}
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.day || ""
                  }
                />
              }
            />
            <Bar
              dataKey="reviews"
              fill="var(--color-reviews)"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="activity-footnote">
          {total
            ? "Keep a rhythm that works for you."
            : "Your first review will start the story. No activity has been added yet."}
        </p>
        <ul className="sr-only" aria-label="Reviews in the last seven days">
          {data.map((day) => (
            <li key={day.day}>
              {day.day}: {day.reviews} reviews
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
