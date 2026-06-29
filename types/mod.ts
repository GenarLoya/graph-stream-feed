export const typesList = {
  cpu: "cpu",
  memory: "memory",
} as const;

export type Types = (typeof typesList)[keyof typeof typesList];

export type Metric = {
  date: number;
  type: Types;
  counter: number;
};

export type Process = {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
};

export type ProcessSnapshot = {
  date: number;
  processes: Process[];
};
