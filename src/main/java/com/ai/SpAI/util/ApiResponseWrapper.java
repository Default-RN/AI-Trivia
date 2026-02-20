package com.ai.SpAI.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseWrapper<T> {
    private boolean success;
    private String message;
    private T data;
    private String error;
    private long timestamp;
    private String requestId;
    private long processingTimeMs;

    // Private constructor
    private ApiResponseWrapper() {
        this.timestamp = Instant.now().toEpochMilli();
    }

    // Success response with data
    public static <T> ApiResponseWrapper<T> success(T data) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }

    // Success response with message and data
    public static <T> ApiResponseWrapper<T> success(String message, T data) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(true);
        response.setMessage(message);
        response.setData(data);
        return response;
    }

    // Success response with message only
    public static <T> ApiResponseWrapper<T> success(String message) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }

    // Error response with error message
    public static <T> ApiResponseWrapper<T> error(String error) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(false);
        response.setError(error);
        return response;
    }

    // Error response with message and error
    public static <T> ApiResponseWrapper<T> error(String message, String error) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setError(error);
        return response;
    }

    // Error response with HTTP status equivalent
    public static <T> ApiResponseWrapper<T> error(int statusCode, String error) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(false);
        response.setError(error);
        response.setMessage(getMessageForStatusCode(statusCode));
        return response;
    }

    // Builder pattern for complex responses
    public static class Builder<T> {
        private ApiResponseWrapper<T> response;

        public Builder() {
            response = new ApiResponseWrapper<>();
        }

        public Builder<T> success(boolean success) {
            response.setSuccess(success);
            return this;
        }

        public Builder<T> message(String message) {
            response.setMessage(message);
            return this;
        }

        public Builder<T> data(T data) {
            response.setData(data);
            return this;
        }

        public Builder<T> error(String error) {
            response.setError(error);
            return this;
        }

        public Builder<T> requestId(String requestId) {
            response.setRequestId(requestId);
            return this;
        }

        public Builder<T> processingTime(long processingTimeMs) {
            response.setProcessingTimeMs(processingTimeMs);
            return this;
        }

        public ApiResponseWrapper<T> build() {
            return response;
        }
    }

    // Helper method to get message from status code
    private static String getMessageForStatusCode(int statusCode) {
        switch (statusCode) {
            case 400: return "Bad Request";
            case 401: return "Unauthorized";
            case 403: return "Forbidden";
            case 404: return "Not Found";
            case 408: return "Request Timeout";
            case 429: return "Too Many Requests";
            case 500: return "Internal Server Error";
            case 502: return "Bad Gateway";
            case 503: return "Service Unavailable";
            case 504: return "Gateway Timeout";
            default: return "Error";
        }
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    // Helper method to check if response has error
    public boolean hasError() {
        return error != null && !error.isEmpty();
    }

    // Helper method to get safe data (returns null if error)
    public T getDataOrNull() {
        return success ? data : null;
    }

    @Override
    public String toString() {
        return String.format(
                "ApiResponseWrapper{success=%s, message='%s', error='%s', timestamp=%d, requestId='%s'}",
                success, message, error, timestamp, requestId
        );
    }
}