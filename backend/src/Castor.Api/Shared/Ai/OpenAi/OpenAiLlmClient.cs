using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Schema;
using Microsoft.Extensions.Options;

namespace Castor.Api.Shared;

/// <summary>An <see cref="ILlmClient"/> adapter for the OpenAI Responses API.</summary>
public sealed class OpenAiLlmClient : ILlmClient
{
    private const int MaxAttempts = 3;
    private const int MaxRetryDelaySeconds = 30;

    private readonly HttpClient httpClient;
    private readonly OpenAiLlmOptions options;
    private readonly ILogger<OpenAiLlmClient> logger;

    public OpenAiLlmClient(
        HttpClient httpClient,
        IOptions<OpenAiLlmOptions> options,
        ILogger<OpenAiLlmClient> logger)
    {
        ArgumentNullException.ThrowIfNull(httpClient);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(logger);

        this.httpClient = httpClient;
        this.options = options.Value;
        this.logger = logger;

        string baseUrl = this.options.BaseUrl.EndsWith("/", StringComparison.Ordinal)
            ? this.options.BaseUrl
            : $"{this.options.BaseUrl}/";

        this.httpClient.BaseAddress = new Uri(baseUrl, UriKind.Absolute);
        this.httpClient.Timeout = TimeSpan.FromSeconds(this.options.TimeoutSeconds);
        this.httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", this.options.ApiKey);
        this.httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<string> CompleteAsync(LlmPrompt prompt, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(prompt);

        object request = CreateRequest(prompt, null);
        CompletionResult result = await SendAsync(request, cancellationToken);
        return result.Text;
    }

    public async Task<TResult> CompleteJsonAsync<TResult>(LlmPrompt prompt, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(prompt);

        JsonNode schema = CreateStrictSchema<TResult>();
        string schemaName = typeof(TResult).Name.ToLowerInvariant();
        object format = new
        {
            type = "json_schema",
            name = schemaName,
            strict = true,
            schema,
        };
        object request = CreateRequest(prompt, format);
        CompletionResult result = await SendAsync(request, cancellationToken);

        try
        {
            return LlmJson.Deserialize<TResult>(result.Text);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException(
                $"OpenAI returned invalid JSON for {typeof(TResult).Name}. Request id: {result.RequestId ?? "unavailable"}.",
                exception);
        }
    }

    private object CreateRequest(LlmPrompt prompt, object? format)
    {
        if (format is null)
        {
            return new
            {
                model = options.Model,
                instructions = prompt.Instructions,
                input = prompt.Input,
                max_output_tokens = options.MaxOutputTokens,
                store = false,
            };
        }

        return new
        {
            model = options.Model,
            instructions = prompt.Instructions,
            input = prompt.Input,
            max_output_tokens = options.MaxOutputTokens,
            store = false,
            text = new { format },
        };
    }

    private async Task<CompletionResult> SendAsync(object request, CancellationToken cancellationToken)
    {
        string requestJson = JsonSerializer.Serialize(request, LlmJson.Options);
        Stopwatch stopwatch = Stopwatch.StartNew();

        for (int attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            using HttpRequestMessage requestMessage = new(HttpMethod.Post, "responses");
            requestMessage.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            HttpResponseMessage response;
            try
            {
                response = await httpClient.SendAsync(
                    requestMessage,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);
            }
            catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
            {
                throw new TimeoutException(
                    $"OpenAI did not respond within {options.TimeoutSeconds} seconds.",
                    exception);
            }
            catch (HttpRequestException exception) when (attempt < MaxAttempts)
            {
                TimeSpan delay = RetryDelay(null, attempt);
                logger.LogWarning(
                    exception,
                    "OpenAI request failed before receiving a response. Retrying attempt {NextAttempt} after {DelayMs} ms.",
                    attempt + 1,
                    delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            using (response)
            {
                string? requestId = ReadRequestId(response);
                if (IsTransient(response.StatusCode) && attempt < MaxAttempts)
                {
                    TimeSpan delay = RetryDelay(response, attempt);
                    logger.LogWarning(
                        "OpenAI returned status {StatusCode}. Retrying attempt {NextAttempt} after {DelayMs} ms. Request id: {RequestId}.",
                        (int)response.StatusCode,
                        attempt + 1,
                        delay.TotalMilliseconds,
                        requestId ?? "unavailable");
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }

                if (!response.IsSuccessStatusCode)
                {
                    throw new HttpRequestException(
                        $"OpenAI returned HTTP {(int)response.StatusCode}. Request id: {requestId ?? "unavailable"}.",
                        null,
                        response.StatusCode);
                }

                string responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                CompletionResult result = ParseResponse(responseJson, requestId);
                stopwatch.Stop();
                logger.LogInformation(
                    "OpenAI completed model {Model} in {ElapsedMs} ms using {InputTokens} input and {OutputTokens} output tokens. Request id: {RequestId}.",
                    options.Model,
                    stopwatch.ElapsedMilliseconds,
                    result.InputTokens,
                    result.OutputTokens,
                    result.RequestId ?? "unavailable");
                return result;
            }
        }

        throw new InvalidOperationException("OpenAI request exhausted all retry attempts.");
    }

    private static CompletionResult ParseResponse(string responseJson, string? headerRequestId)
    {
        using JsonDocument document = JsonDocument.Parse(responseJson);
        JsonElement root = document.RootElement;
        string? responseId = ReadString(root, "id");
        string? status = ReadString(root, "status");
        string? requestId = headerRequestId ?? responseId;

        if (!string.Equals(status, "completed", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"OpenAI response did not complete successfully. Status: {status ?? "missing"}. Request id: {requestId ?? "unavailable"}.");
        }

        StringBuilder text = new();
        if (root.TryGetProperty("output", out JsonElement output) && output.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement item in output.EnumerateArray())
            {
                string? itemType = ReadString(item, "type");
                if (!string.Equals(itemType, "message", StringComparison.Ordinal)
                    || !item.TryGetProperty("content", out JsonElement content)
                    || content.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (JsonElement part in content.EnumerateArray())
                {
                    string? partType = ReadString(part, "type");
                    if (string.Equals(partType, "refusal", StringComparison.Ordinal))
                    {
                        throw new InvalidOperationException(
                            $"OpenAI refused the request. Request id: {requestId ?? "unavailable"}.");
                    }

                    if (string.Equals(partType, "output_text", StringComparison.Ordinal))
                    {
                        string? outputText = ReadString(part, "text");
                        if (!string.IsNullOrEmpty(outputText))
                        {
                            text.Append(outputText);
                        }
                    }
                }
            }
        }

        if (text.Length == 0)
        {
            throw new InvalidOperationException(
                $"OpenAI returned no text output. Request id: {requestId ?? "unavailable"}.");
        }

        int? inputTokens = ReadUsage(root, "input_tokens");
        int? outputTokens = ReadUsage(root, "output_tokens");
        return new CompletionResult(text.ToString(), requestId, inputTokens, outputTokens);
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property)
            || property.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return property.GetString();
    }

    private static int? ReadUsage(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty("usage", out JsonElement usage)
            || usage.ValueKind != JsonValueKind.Object
            || !usage.TryGetProperty(propertyName, out JsonElement property)
            || !property.TryGetInt32(out int value))
        {
            return null;
        }

        return value;
    }

    private static string? ReadRequestId(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("x-request-id", out IEnumerable<string>? values))
        {
            return null;
        }

        return values.FirstOrDefault();
    }

    private static bool IsTransient(HttpStatusCode statusCode)
    {
        return statusCode == HttpStatusCode.TooManyRequests || (int)statusCode >= 500;
    }

    private static TimeSpan RetryDelay(HttpResponseMessage? response, int attempt)
    {
        TimeSpan? retryAfter = response?.Headers.RetryAfter?.Delta;
        if (retryAfter is not null && retryAfter.Value > TimeSpan.Zero)
        {
            return retryAfter.Value > TimeSpan.FromSeconds(MaxRetryDelaySeconds)
                ? TimeSpan.FromSeconds(MaxRetryDelaySeconds)
                : retryAfter.Value;
        }

        double delayMilliseconds = 250 * Math.Pow(2, attempt - 1);
        return TimeSpan.FromMilliseconds(delayMilliseconds);
    }

    private static JsonNode CreateStrictSchema<TResult>()
    {
        JsonNode schema = LlmJson.Options.GetJsonSchemaAsNode(typeof(TResult));
        MakeObjectsStrict(schema);
        return schema;
    }

    private static void MakeObjectsStrict(JsonNode node)
    {
        if (node is JsonObject jsonObject)
        {
            if (jsonObject["properties"] is JsonObject properties)
            {
                JsonArray required = [];
                foreach (KeyValuePair<string, JsonNode?> property in properties)
                {
                    required.Add(property.Key);
                }

                jsonObject["required"] = required;
                jsonObject["additionalProperties"] = false;
            }

            foreach (KeyValuePair<string, JsonNode?> property in jsonObject.ToArray())
            {
                if (property.Value is not null)
                {
                    MakeObjectsStrict(property.Value);
                }
            }

            return;
        }

        if (node is JsonArray jsonArray)
        {
            foreach (JsonNode? item in jsonArray)
            {
                if (item is not null)
                {
                    MakeObjectsStrict(item);
                }
            }
        }
    }

    private sealed record CompletionResult(string Text, string? RequestId, int? InputTokens, int? OutputTokens);
}
