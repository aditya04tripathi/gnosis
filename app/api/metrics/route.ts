import { collectDefaultMetrics, register } from "prom-client";
import { NextResponse } from "next/server";

let metricsInitialized = false;

function ensureMetrics() {
	if (!metricsInitialized) {
		collectDefaultMetrics({ register });
		metricsInitialized = true;
	}
}

export async function GET() {
	ensureMetrics();
	const metrics = await register.metrics();
	return new NextResponse(metrics, {
		headers: { "Content-Type": register.contentType },
	});
}
