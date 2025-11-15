using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Difae.WindowsAgent.Services;

public sealed record AgentConfig
{
    [JsonPropertyName("bridgeId")]
    public required string BridgeId { get; init; }

    [JsonPropertyName("backendUrl")]
    public required string BackendUrl { get; init; }

    [JsonPropertyName("relayEndpoint")]
    public string RelayEndpoint { get; init; } = "/api/bridge/relay";

    [JsonPropertyName("apiKey")]
    public string? ApiKey { get; init; }

    [JsonPropertyName("camera")]
    public required CameraConfig Camera { get; init; }

    [JsonPropertyName("ffmpeg")]
    public FfmpegConfig Ffmpeg { get; init; } = new();

    public Uri RelayUri => BuildRelayUri();

    public string RtspUrl => BuildRtspUrl();

    public string GetSafeRtspUrl()
    {
        var builder = new UriBuilder(RtspUrl)
        {
            Password = string.IsNullOrEmpty(Camera.Password) ? string.Empty : "****",
        };

        return builder.Uri.ToString();
    }

    private string BuildRtspUrl()
    {
        if (!string.IsNullOrWhiteSpace(Camera.RtspUrl))
        {
            return Camera.RtspUrl;
        }

        var path = Camera.StreamPath.StartsWith("/", StringComparison.Ordinal)
            ? Camera.StreamPath
            : $"/{Camera.StreamPath}";

        var builder = new UriBuilder("rtsp", Camera.Host, Camera.RtspPort, path)
        {
            UserName = Camera.Username,
            Password = Camera.Password,
        };

        return builder.Uri.ToString();
    }

    private Uri BuildRelayUri()
    {
        if (Uri.TryCreate(RelayEndpoint, UriKind.Absolute, out var absolute))
        {
            return absolute;
        }

        if (!Uri.TryCreate(BackendUrl, UriKind.Absolute, out var backendBase))
        {
            throw new InvalidOperationException($"Invalid backendUrl '{BackendUrl}' in agent-config.json.");
        }

        if (!Uri.TryCreate(backendBase, RelayEndpoint, out var combined))
        {
            throw new InvalidOperationException($"Invalid relayEndpoint '{RelayEndpoint}' in agent-config.json.");
        }

        return combined;
    }

    public static AgentConfig FromJson(string json)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
            AllowTrailingCommas = true,
        };

        var config = JsonSerializer.Deserialize<AgentConfig>(json, options);
        if (config is null)
        {
            throw new InvalidOperationException("Failed to deserialize agent-config.json.");
        }

        return config with { Camera = config.Camera with { } };
    }
}

public sealed record CameraConfig
{
    [JsonPropertyName("host")]
    public required string Host { get; init; }

    [JsonPropertyName("username")]
    public string Username { get; init; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; init; } = string.Empty;

    [JsonPropertyName("rtspPort")]
    public int RtspPort { get; init; } = 554;

    [JsonPropertyName("streamPath")]
    public string StreamPath { get; init; } = "/";

    [JsonPropertyName("rtspUrl")]
    public string? RtspUrl { get; init; }
}

public sealed record FfmpegConfig
{
    [JsonPropertyName("path")]
    public string Path { get; init; } = "ffmpeg";

    [JsonPropertyName("rtspTransport")]
    public string RtspTransport { get; init; } = "tcp";

    [JsonPropertyName("extraArguments")]
    public IReadOnlyList<string> ExtraArguments { get; init; } = Array.Empty<string>();
}
