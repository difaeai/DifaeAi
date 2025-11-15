using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Difae.WindowsAgent.Services;

public sealed class CameraBridgeWorker : BackgroundService
{
    private readonly AgentConfigLoader _configLoader;
    private readonly StreamingSessionFactory _sessionFactory;
    private readonly AutoStartRegistrar _autoStartRegistrar;
    private readonly ILogger<CameraBridgeWorker> _logger;

    public CameraBridgeWorker(
        AgentConfigLoader configLoader,
        StreamingSessionFactory sessionFactory,
        AutoStartRegistrar autoStartRegistrar,
        ILogger<CameraBridgeWorker> logger)
    {
        _configLoader = configLoader;
        _sessionFactory = sessionFactory;
        _autoStartRegistrar = autoStartRegistrar;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await _autoStartRegistrar.EnsureRegisteredAsync(stoppingToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Automatic start registration failed");
        }

        var delay = TimeSpan.FromSeconds(5);

        while (!stoppingToken.IsCancellationRequested)
        {
            AgentConfig config;
            try
            {
                config = await _configLoader.LoadAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load agent configuration");
                delay = Backoff(delay);
                await SafeDelay(delay, stoppingToken).ConfigureAwait(false);
                continue;
            }

            try
            {
                using var session = _sessionFactory.Create(config);
                await session.RunAsync(stoppingToken).ConfigureAwait(false);
                delay = TimeSpan.FromSeconds(5);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Streaming session terminated unexpectedly");
                delay = Backoff(delay);
                await SafeDelay(delay, stoppingToken).ConfigureAwait(false);
            }
        }
    }

    private static async Task SafeDelay(TimeSpan delay, CancellationToken cancellationToken)
    {
        if (delay <= TimeSpan.Zero)
        {
            delay = TimeSpan.FromSeconds(5);
        }

        try
        {
            await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // ignore cancellation
        }
    }

    private static TimeSpan Backoff(TimeSpan current)
    {
        var next = TimeSpan.FromSeconds(Math.Min(current.TotalSeconds * 2, 300));
        return next;
    }
}
