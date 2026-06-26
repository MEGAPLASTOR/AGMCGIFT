import { getApiBaseUrl } from "../config/apiRuntimeConfig";
import {
  API_CONNECTION_ERROR_MESSAGE,
  getDefaultApiErrorMessage,
} from "../errors/apiErrorMessages";
import { ApiRequestError } from "./ApiRequestError";
import { readResponsePayload } from "./readResponsePayload";

export async function postJson(endpoint, body) {
  let response;

  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
