export class ApiError extends Error {
  status?: number;
  /** The server's `detail` string from a JSON error body, when one was present. */
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}
