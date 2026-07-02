export type NavigationItem = {
  href: string;
  label: string;
};

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
