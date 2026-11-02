/** What every form action returns: an error to show, or a success message. */
export interface ActionState {
  error?: string;
  message?: string;
}
