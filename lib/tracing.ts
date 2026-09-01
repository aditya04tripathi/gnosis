import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

function resolveOtlpTracesUrl(): string | null {
	const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
	if (!endpoint) {
		return null;
	}
	if (endpoint.endsWith("/v1/traces")) {
		return endpoint;
	}
	return `${endpoint.replace(/\/$/, "")}/v1/traces`;
}

export function initTracing(serviceName: string) {
	const tracesUrl = resolveOtlpTracesUrl();
	if (!tracesUrl) {
		return;
	}

	const traceExporter = new OTLPTraceExporter({ url: tracesUrl });

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: serviceName,
		}),
		traceExporter,
		instrumentations: [
			getNodeAutoInstrumentations({
				"@opentelemetry/instrumentation-fs": {
					enabled: false,
				},
			}),
		],
	});

	sdk.start();

	process.on("SIGTERM", () => {
		sdk
			.shutdown()
			.catch((error) => console.error("Error terminating tracing", error));
	});
}
