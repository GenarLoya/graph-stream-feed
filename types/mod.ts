export const typesList = {
  counter: "counter",
  cpu: "cpu",
} as const;

export type Types = (typeof typesList)[keyof typeof typesList];

export type Metric = {
  date: number;
  type: Types;
  counter: number;
};
