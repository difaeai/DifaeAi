using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Difae.WindowsAgent.Services;

public sealed class StreamingSession : IDisposable
{
    private readonly AgentConfig _config;
    private readonly HttpClient _httpClient;
    private readonly ILogger<StreamingSession> _logger;

    public StreamingSession(AgentConfig config, HttpClient httpClient, ILogger<StreamingSession> logger)
    {
        _config = config;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting relay to {Relay}", _config.RelayUri);

        using var process = StartFfmpeg();
        using var registration = cancellationToken.Register(() => TerminateProcess(process));
        var errorTask = ConsumeStandardErrorAsync(process, cancellationToken);

        using var request = BuildRequest(process, cancellationToken);

        HttpResponseMessage? response = null;
        try
        {
            response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken
            ).ConfigureAwait(false);
        }
        catch
        {
            TerminateProcess(process);
            throw;
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
                throw new InvalidOperationException(
                    $"Relay endpoint {_config.RelayUri} rejected the stream with {(int)response.StatusCode}: {body}"
                );
            }

            _logger.LogInformation(
                "Relay accepted stream (status {StatusCode})",
                (int)response.StatusCode
            );

            await WaitForProcessAsync(process, cancellationToken).ConfigureAwait(false);
            await errorTask.ConfigureAwait(false);
        }
    }

    private HttpRequestMessage BuildRequest(Process process, CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, _config.RelayUri);
        request.Headers.AcceptEncoding.Clear();
        request.Headers.TransferEncodingChunked = true;
        request.Headers.Add("X-Bridge-Id", _config.BridgeId);
        if (!string.IsNullOrWhiteSpace(_config.ApiKey))
        {
            request.Headers.Add("X-Api-Key", _config.ApiKey);
        }

        request.Content = new ProcessStreamContent(process.StandardOutput.BaseStream, cancellationToken);
        return request;
    }

    private Process StartFfmpeg()
    {
        var arguments = BuildFfmpegArguments();

        var psi = new ProcessStartInfo
        {
            FileName = _config.Ffmpeg.Path,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        foreach (var argument in arguments)
        {
            psi.ArgumentList.Add(argument);
        }

        _logger.LogInformation("Launching FFmpeg: {FileName} {Args}", psi.FileName, string.Join(" ", psi.ArgumentList));

        try
        {
            var process = Process.Start(psi);
            if (process is null)
            {
                throw new InvalidOperationException("Failed to start ffmpeg process");
            }

            return process;
        }
        catch (Win32Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to start ffmpeg at '{_config.Ffmpeg.Path}'. Ensure FFmpeg is installed and accessible.",
                ex
            );
        }
    }

    private IReadOnlyList<string> BuildFfmpegArguments()
    {
        var args = new List<string>
        {
            "-nostdin",
            "-rtsp_transport",
            _config.Ffmpeg.RtspTransport,
        };

        if (_config.Ffmpeg.ExtraArguments.Count > 0)
        {
            args.AddRange(_config.Ffmpeg.ExtraArguments);
        }

        args.AddRange(new[]
        {
            "-i",
            _config.RtspUrl,
            "-c",
            "copy",
            "-f",
            "mpegts",
            "pipe:1",
        });

        return args;
    }

    private static async Task WaitForProcessAsync(Process process, CancellationToken cancellationToken)
    {
        try
        {
            await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            TerminateProcess(process);
            throw;
        }

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"ffmpeg exited with code {process.ExitCode}");
        }
    }

    private Task ConsumeStandardErrorAsync(Process process, CancellationToken cancellationToken)
    {
        return Task.Run(async () =>
        {
            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    var line = await process.StandardError.ReadLineAsync().ConfigureAwait(false);
                    if (line is null)
                    {
                        break;
                    }

                    if (!string.IsNullOrWhiteSpace(line))
                    {
                        _logger.LogInformation("ffmpeg: {Line}", line);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to read ffmpeg stderr");
            }
        }, cancellationToken);
    }

    private static void TerminateProcess(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch
        {
            // ignore termination errors
        }
    }

    public void Dispose()
    {
        _httpClient.Dispose();
    }

    private sealed class ProcessStreamContent : HttpContent
    {
        private readonly Stream _source;
        private readonly CancellationToken _cancellationToken;

        public ProcessStreamContent(Stream source, CancellationToken cancellationToken)
        {
            _source = source;
            _cancellationToken = cancellationToken;
            Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        }

        protected override async Task SerializeToStreamAsync(Stream stream, TransportContext? context)
        {
            await _source.CopyToAsync(stream, 81920, _cancellationToken).ConfigureAwait(false);
        }

        protected override bool TryComputeLength(out long length)
        {
            length = -1;
            return false;
        }
    }
}
