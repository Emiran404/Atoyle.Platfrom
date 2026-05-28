class TelemetryService {
  constructor() {
    this.events = [];
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
    this.timer = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Flush on beforeunload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Global error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('unhandled_rejection', {
        reason: event.reason ? event.reason.toString() : 'Unknown'
      });
    });

    this.startTimer();
    console.log('TelemetryService initialized');
  }

  trackEvent(type, data = {}) {
    this.events.push({
      type,
      timestamp: Date.now(),
      url: window.location.pathname,
      data
    });

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  flush(useBeacon = false) {
    if (this.events.length === 0) return;

    const payload = JSON.stringify({ events: this.events });
    const url = '/api/telemetry';

    try {
      if (useBeacon && navigator.sendBeacon) {
        // use navigator.sendBeacon when page is unloading
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payload,
          keepalive: true
        }).catch(err => console.warn('Telemetry sync failed', err));
      }
    } catch (e) {
      console.warn('Telemetry send error', e);
    }

    this.events = [];
  }
}

export const telemetry = new TelemetryService();
