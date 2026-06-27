import { getApiBaseUrl } from "../config/apiRuntimeConfig";
import {
  API_CONNECTION_ERROR_MESSAGE,
  getDefaultApiErrorMessage,
} from "../errors/apiErrorMessages";
import { ApiRequestError } from "./ApiRequestError";
import { readResponsePayload } from "./readResponsePayload";

export async function requestJson(endpoint, options = {}) {
  const { body, headers = {}, method = "GET", signal } = options;
  let response;

  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    throw new ApiRequestError(API_CONNECTION_ERROR_MESSAGE, {
      status: 0,
      payload: { message: error.message },
      endpoint,
    });
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    console.error("[AGMC API] JSON request failed", {
      endpoint,
      method,
      status: response.status,
      statusText: response.statusText,
      payload,
    });

    throw new ApiRequestError(
      payload?.message || getDefaultApiErrorMessage(response.status, endpoint),
      {
        status: response.status,
        payload,
        endpoint,
      }
    );
  }

  return payload;
}
