using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Difae.WindowsAgent.Services;

public sealed class AgentConfigLoader
{
    private const string ConfigFileName = "agent-config.json";

    private readonly string _configPath;
    private readonly ILogger<AgentConfigLoader> _logger;

    public AgentConfigLoader(ILogger<AgentConfigLoader> logger)
    {
        _logger = logger;
        _configPath = Path.Combine(AppContext.BaseDirectory, ConfigFileName);
    }

    public async Task<AgentConfig> LoadAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Loading configuration from {ConfigPath}", _configPath);

        if (!File.Exists(_configPath))
        {
            throw new FileNotFoundException(
                $"Configuration file '{ConfigFileName}' was not found next to the executable.",
                _configPath
            );
        }

        await using var stream = File.OpenRead(_configPath);
        using var reader = new StreamReader(stream);
        var json = await reader.ReadToEndAsync(cancellationToken);

        var config = AgentConfig.FromJson(json);
        var resolved = ApplyEnvironmentOverrides(config);

        _logger.LogInformation("Bridge ID: {BridgeId}", resolved.BridgeId);
        _logger.LogInformation("Backend relay: {RelayUri}", resolved.RelayUri);
        _logger.LogInformation("RTSP source: {RtspUrl}", resolved.GetSafeRtspUrl());

        return resolved;
    }

    private static AgentConfig ApplyEnvironmentOverrides(AgentConfig config)
    {
        var bridgeId = Environment.GetEnvironmentVariable("BRIDGE_ID");
        var backendUrl = Environment.GetEnvironmentVariable("BACKEND_URL");
        var relayEndpoint = Environment.GetEnvironmentVariable("RELAY_ENDPOINT");
        var apiKey = Environment.GetEnvironmentVariable("BRIDGE_API_KEY");
        var rtspUrl = Environment.GetEnvironmentVariable("RTSP_URL");
        var username = Environment.GetEnvironmentVariable("RTSP_USERNAME");
        var password = Environment.GetEnvironmentVariable("RTSP_PASSWORD");
        var host = Environment.GetEnvironmentVariable("RTSP_HOST");
        var portValue = Environment.GetEnvironmentVariable("RTSP_PORT");
        var path = Environment.GetEnvironmentVariable("RTSP_PATH");
        var ffmpegPath = Environment.GetEnvironmentVariable("FFMPEG_PATH");
        var transport = Environment.GetEnvironmentVariable("RTSP_TRANSPORT");

        var camera = config.Camera with
        {
            RtspUrl = string.IsNullOrWhiteSpace(rtspUrl) ? config.Camera.RtspUrl : rtspUrl,
            Username = string.IsNullOrWhiteSpace(username) ? config.Camera.Username : username!,
            Password = string.IsNullOrWhiteSpace(password) ? config.Camera.Password : password!,
            Host = string.IsNullOrWhiteSpace(host) ? config.Camera.Host : host!,
            StreamPath = string.IsNullOrWhiteSpace(path) ? config.Camera.StreamPath : path!,
            RtspPort = ParseIntOrDefault(portValue, config.Camera.RtspPort),
        };

        var ffmpeg = config.Ffmpeg with
        {
            Path = string.IsNullOrWhiteSpace(ffmpegPath) ? config.Ffmpeg.Path : ffmpegPath!,
            RtspTransport = string.IsNullOrWhiteSpace(transport) ? config.Ffmpeg.RtspTransport : transport!,
        };

        return config with
        {
            BridgeId = string.IsNullOrWhiteSpace(bridgeId) ? config.BridgeId : bridgeId!,
            BackendUrl = string.IsNullOrWhiteSpace(backendUrl) ? config.BackendUrl : backendUrl!,
            RelayEndpoint = string.IsNullOrWhiteSpace(relayEndpoint) ? config.RelayEndpoint : relayEndpoint!,
            ApiKey = string.IsNullOrWhiteSpace(apiKey) ? config.ApiKey : apiKey!,
            Camera = camera,
            Ffmpeg = ffmpeg,
        };
    }

    private static int ParseIntOrDefault(string? value, int fallback)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }
}
