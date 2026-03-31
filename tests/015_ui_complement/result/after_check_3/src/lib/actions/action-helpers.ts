export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionFailure {
  success: false;
  error: ActionError;
}

export interface ActionError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
