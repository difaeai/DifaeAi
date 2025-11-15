using System;
using System.Diagnostics;
using System.IO;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Difae.WindowsAgent.Services;

public sealed class AutoStartRegistrar
{
    private const string MarkerFileName = ".auto-start-registered";
    private const string ScheduledTaskName = "DifaeCameraBridge";

    private readonly ILogger<AutoStartRegistrar> _logger;

    public AutoStartRegistrar(ILogger<AutoStartRegistrar> logger)
    {
        _logger = logger;
    }

    public async Task EnsureRegisteredAsync(CancellationToken cancellationToken)
    {
        if (!OperatingSystem.IsWindows())
        {
            _logger.LogDebug("Auto-start registration skipped: not running on Windows");
            return;
        }

        var markerPath = Path.Combine(AppContext.BaseDirectory, MarkerFileName);
        if (File.Exists(markerPath))
        {
            _logger.LogDebug("Auto-start already registered (marker found)");
            return;
        }

        var exePath = Environment.ProcessPath ?? Process.GetCurrentProcess().MainModule?.FileName;
        if (string.IsNullOrWhiteSpace(exePath))
        {
            _logger.LogWarning("Unable to determine executable path for auto-start registration");
            return;
        }

        if (!Environment.UserInteractive)
        {
            _logger.LogInformation("Auto-start registration skipped (non-interactive session)");
            return;
        }

        if (!IsUserAdministrator())
        {
            _logger.LogWarning("Auto-start registration skipped: administrator privileges required");
            return;
        }

        _logger.LogInformation("Registering scheduled task for auto-start");

        var arguments = new[]
        {
            "/Create",
            "/TN",
            ScheduledTaskName,
            "/TR",
            exePath,
            "/SC",
            "ONLOGON",
            "/RL",
            "HIGHEST",
            "/F",
        };

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "schtasks",
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            foreach (var argument in arguments)
            {
                psi.ArgumentList.Add(argument);
            }

            using var process = Process.Start(psi);

            if (process is null)
            {
                throw new InvalidOperationException("Failed to start schtasks.exe");
            }

            await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);

            if (process.ExitCode != 0)
            {
                _logger.LogWarning(
                    "schtasks.exe exited with code {ExitCode}. Auto-start may not be configured.",
                    process.ExitCode
                );
                return;
            }

            await File.WriteAllTextAsync(markerPath, DateTimeOffset.UtcNow.ToString("O"), cancellationToken)
                .ConfigureAwait(false);
            _logger.LogInformation("Scheduled task {TaskName} registered", ScheduledTaskName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to register scheduled task for auto-start");
        }
    }

    private static bool IsUserAdministrator()
    {
        if (!OperatingSystem.IsWindows())
        {
            return false;
        }

        using var identity = WindowsIdentity.GetCurrent();
        var principal = new WindowsPrincipal(identity);
        return principal.IsInRole(WindowsBuiltInRole.Administrator);
    }
}
