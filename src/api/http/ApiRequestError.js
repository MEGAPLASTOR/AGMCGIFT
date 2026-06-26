export class ApiRequestError extends Error {
  constructor(message, { status, payload, endpoint }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
    this.endpoint = endpoint;
  }
}
