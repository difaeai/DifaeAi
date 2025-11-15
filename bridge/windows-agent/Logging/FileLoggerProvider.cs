using System.Collections.Concurrent;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Difae.WindowsAgent.Logging;

public sealed class FileLoggerProvider : ILoggerProvider
{
    private readonly string _filePath;
    private readonly BlockingCollection<string> _queue = new();
    private readonly Task _writerTask;
    private bool _disposed;

    public FileLoggerProvider(string filePath)
    {
        _filePath = filePath;
        Directory.CreateDirectory(Path.GetDirectoryName(_filePath) ?? AppContext.BaseDirectory);
        _writerTask = Task.Factory.StartNew(WriteLoop, TaskCreationOptions.LongRunning);
    }

    public ILogger CreateLogger(string categoryName)
    {
        return new FileLogger(categoryName, _queue);
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _queue.CompleteAdding();
        try
        {
            _writerTask.Wait(TimeSpan.FromSeconds(5));
        }
        catch
        {
            // ignore
        }
    }

    private void WriteLoop()
    {
        try
        {
            using var stream = new FileStream(_filePath, FileMode.Append, FileAccess.Write, FileShare.Read);
            using var writer = new StreamWriter(stream) { AutoFlush = true };

            foreach (var line in _queue.GetConsumingEnumerable())
            {
                writer.WriteLine(line);
            }
        }
        catch
        {
            // last resort logging failure; nothing we can do safely here
        }
    }

    private sealed class FileLogger : ILogger
    {
        private readonly string _categoryName;
        private readonly BlockingCollection<string> _queue;

        public FileLogger(string categoryName, BlockingCollection<string> queue)
        {
            _categoryName = categoryName;
            _queue = queue;
        }

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel)
        {
            return logLevel != LogLevel.None;
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel))
            {
                return;
            }

            var timestamp = DateTimeOffset.Now.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz");
            var message = formatter(state, exception);
            var line = $"{timestamp} [{logLevel}] {_categoryName}: {message}";

            if (exception is not null)
            {
                line = string.Join(Environment.NewLine, line, exception.ToString());
            }

            if (!_queue.IsAddingCompleted)
            {
                _queue.Add(line);
            }
        }
    }
}
