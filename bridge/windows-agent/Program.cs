using Difae.WindowsAgent.Logging;
using Difae.WindowsAgent.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "Difae Camera Bridge";
});

var logFilePath = Path.Combine(AppContext.BaseDirectory, "windows-agent.log");

builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(options =>
{
    options.SingleLine = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffzzz ";
});
builder.Logging.AddProvider(new FileLoggerProvider(logFilePath));

builder.Services.AddSingleton<AgentConfigLoader>();
builder.Services.AddSingleton<AutoStartRegistrar>();
builder.Services.AddHttpClient("relay", client =>
{
    client.Timeout = Timeout.InfiniteTimeSpan;
});
builder.Services.AddSingleton<StreamingSessionFactory>();
builder.Services.AddHostedService<CameraBridgeWorker>();

var host = builder.Build();

await host.RunAsync();
