import React from "react";

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

const buildPath = (values: number[], width: number, height: number) => {
  if (values.length === 0) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 160,
  height = 40,
  stroke = "#0f766e",
  fill = "rgba(15,118,110,0.12)",
}) => {
  if (!values.length) {
    return null;
  }
  const path = buildPath(values, width, height);
  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;
  const gradientId = React.useId();
  const useGradient = stroke === "#0f766e";
  const resolvedStroke = useGradient ? `url(#${gradientId})` : stroke;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="sparkline">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(14,124,120,1)" />
          <stop offset="100%" stopColor="rgba(217,131,31,0.9)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={fill} stroke="none" />
      <path d={path} fill="none" stroke={resolvedStroke} strokeWidth="2" />
    </svg>
  );
};
