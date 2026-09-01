export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { patchHttpServerMetrics } = await import("./lib/http-metrics");
		patchHttpServerMetrics();

		if (process.env.ENABLE_TRACING === "true") {
			const { initTracing } = await import("./lib/tracing");
			initTracing(process.env.OTEL_SERVICE_NAME ?? "gnosis");
		}
	}
}
