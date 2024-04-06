export const addOne = (num: number) => {
  return num + 1;
};

export const jsonStringify = (str: string) => JSON.stringify(str, null, 2);

export const eeq = (v1, v2) => v1 === v2;

export const prop = (prop: string, obj: Record<string, unknown>) => obj[prop];
