export async function register() {
	if (
		process.env.NEXT_RUNTIME === "nodejs" &&
		process.env.ENABLE_TRACING === "true"
	) {
		const { initTracing } = await import("./lib/tracing");
		initTracing(process.env.OTEL_SERVICE_NAME ?? "gnosis");
	}
}
