using System.Net.Http;
using Microsoft.Extensions.Logging;

namespace Difae.WindowsAgent.Services;

public sealed class StreamingSessionFactory
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILoggerFactory _loggerFactory;

    public StreamingSessionFactory(IHttpClientFactory httpClientFactory, ILoggerFactory loggerFactory)
    {
        _httpClientFactory = httpClientFactory;
        _loggerFactory = loggerFactory;
    }

    public StreamingSession Create(AgentConfig config)
    {
        var client = _httpClientFactory.CreateClient("relay");
        var logger = _loggerFactory.CreateLogger<StreamingSession>();
        return new StreamingSession(config, client, logger);
    }
}
