export type QueryOptions = {
  enabled?: boolean;
  onSuccess?: (data?: any) => void;
  onError?: (e: any) => void;
  onSettled?: () => void;
};
