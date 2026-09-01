import {
	Counter,
	Histogram,
	Registry,
	collectDefaultMetrics,
} from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
	name: "http_requests_total",
	help: "Total HTTP requests",
	labelNames: ["method", "route", "status"],
	registers: [register],
});

export const httpRequestDuration = new Histogram({
	name: "http_request_duration_seconds",
	help: "HTTP request duration in seconds",
	labelNames: ["method", "route", "status"],
	buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
	registers: [register],
});

let patched = false;

export function patchHttpServerMetrics() {
	if (patched) {
		return;
	}
	patched = true;

	const http = require("node:http") as typeof import("node:http");
	const originalEmit = http.Server.prototype.emit;

	http.Server.prototype.emit = function (
		event: string,
		...args: unknown[]
	): boolean {
		if (event === "request") {
			const req = args[0] as import("node:http").IncomingMessage;
			const res = args[1] as import("node:http").ServerResponse;
			const start = Date.now();
			const route = req.url?.split("?")[0] ?? "unknown";

			res.on("finish", () => {
				const labels = {
					method: req.method ?? "GET",
					route,
					status: String(res.statusCode),
				};
				httpRequestsTotal.inc(labels);
				httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
			});
		}

		return originalEmit.apply(this, [event, ...args] as never);
	};
}

export { register };
