export interface StandardResponseModuleOptions {
  interceptAll?: boolean;
  validateResponse?: (data) => boolean;
  validationErrorMessage?: string;
}
